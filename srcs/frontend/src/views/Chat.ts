import { Router } from '../core/router.js';
import { 
    getUserById,
    markMessagesAsRead,
    sendMessage,
    getUserConversations
} from '../data/UserService.js';
import { mockMessages, ChatMessage } from '../data/mock_data.js';
import { NotificationManager } from '../components/Notification.js';

export class ChatView {
    private element: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = 1; // get user session
    private activeChatUserId: number | null = null;

    constructor(router: Router) {
        this.router = router;
    }

    render(rootElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.className = 'chat-view';

        // Parse route to see if a specific user chat is requested
        const chatParam = window.location.hash.split('/chat/')[1];
        if (chatParam && !isNaN(Number(chatParam))) {
            this.activeChatUserId = Number(chatParam);
        }

        // Create the UI
        this.element.innerHTML = `
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="chat-sidebar-header">
                        <h3>Conversations</h3>
                        <div class="chat-search">
                            <input type="text" placeholder="Search..." id="chat-search">
                        </div>
                    </div>
                    <div class="chat-contacts" id="chat-contacts">
                        <!-- Contacts will be loaded here -->
                        <div class="loading-spinner">Loading conversations...</div>
                    </div>
                </div>
                <div class="chat-main" id="chat-main">
                    ${this.activeChatUserId 
                        ? '<div class="loading-spinner">Loading messages...</div>' 
                        : '<div class="chat-welcome"><p>Select a conversation to start chatting</p></div>'}
                </div>
            </div>
        `;

        rootElement.appendChild(this.element);
        
        // Load contacts
        this.loadContacts();
        
        // Load active chat if any
        if (this.activeChatUserId) {
            this.loadActiveChat(this.activeChatUserId);
        }
        
        // Setup search
        const searchInput = this.element.querySelector('#chat-search') as HTMLInputElement;
        searchInput?.addEventListener('input', () => {
            this.filterContacts(searchInput.value);
        });
    }

    private loadContacts(): void {
        const contactsContainer = this.element?.querySelector('#chat-contacts');
        if (!contactsContainer) return;
        
        // Get conversations for current user using the new helper function
        const conversations = getUserConversations(this.currentUserId);
        
        if (conversations.length === 0) {
            contactsContainer.innerHTML = '<p class="no-contacts">No conversations yet</p>';
            return;
        }
        
        let contactsHTML = '';
        
        conversations.forEach(convo => {
            const user = convo.user;
            const lastMessage = convo.lastMessage;
            const unreadCount = convo.unreadCount;
            
            // Get online status - using the new status field from mock data
            const isOnline = user.status === 'online';
            const statusText = user.status === 'in-game' ? 'In Game' : (isOnline ? 'Online' : 'Offline');
            
            contactsHTML += `
                <div class="chat-contact ${this.activeChatUserId === user.id ? 'active' : ''}" data-id="${user.id}">
                    <div class="chat-contact-avatar">
                        <img src="${user.avatarUrl || 'https://placehold.co/60x60/1d1f21/ffffff?text=User'}" alt="${user.displayName}">
                        <span class="chat-status ${user.status === 'in-game' ? 'in-game' : (isOnline ? 'online' : 'offline')}"></span>
                    </div>
                    <div class="chat-contact-info">
                        <h4>${user.displayName}</h4>
                        <p class="chat-last-message">
                            ${lastMessage ? this.truncateMessage(lastMessage.content, 30) : 'No messages yet'}
                        </p>
                    </div>
                    <div class="chat-contact-meta">
                        <span class="chat-time">${lastMessage ? this.formatMessageTime(lastMessage.timestamp) : ''}</span>
                        ${unreadCount > 0 ? `<span class="chat-unread">${unreadCount}</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        contactsContainer.innerHTML = contactsHTML;
        
        // Add click handlers
        const contacts = this.element?.querySelectorAll('.chat-contact');
        contacts?.forEach(contact => {
            contact.addEventListener('click', () => {
                const userId = Number(contact.getAttribute('data-id'));
                this.activeChatUserId = userId;
                
                // Update active contact
                contacts.forEach(c => c.classList.remove('active'));
                contact.classList.add('active');
                
                // Load chat
                this.loadActiveChat(userId);
                
                // Update URL without full navigation
                const newUrl = `#/chat/${userId}`;
                if (window.location.hash !== newUrl) {
                    history.pushState(null, '', newUrl);
                }
            });
        });
    }

    private loadActiveChat(userId: number): void {
        const chatMain = this.element?.querySelector('#chat-main');
        if (!chatMain) return;
        
        const user = getUserById(userId);
        if (!user) {
            chatMain.innerHTML = '<div class="chat-welcome"><p>User not found</p></div>';
            return;
        }
        
        // Get messages between current user and selected user
        const messages = mockMessages.filter(msg => 
            (msg.senderId === this.currentUserId && msg.receiverId === userId) || 
            (msg.senderId === userId && msg.receiverId === this.currentUserId)
        ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        // Get online status from user
        const statusClass = user.status === 'in-game' ? 'in-game' : (user.status === 'online' ? 'online' : 'offline');
        const statusText = user.status === 'in-game' ? 'In Game' : (user.status === 'online' ? 'Online' : 'Offline');
        
        chatMain.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-user">
                    <img src="${user.avatarUrl || 'https://placehold.co/40x40/1d1f21/ffffff?text=User'}" alt="${user.displayName}" class="chat-header-avatar">
                    <div class="chat-header-info">
                        <h3>${user.displayName}</h3>
                        <span class="chat-header-status ${statusClass}">
                            ${statusText}
                        </span>
                    </div>
                </div>
                <div class="chat-header-actions">
                    <button class="icon-button" title="Video Call">
                        <i class="fas fa-video"></i>
                    </button>
                    <button class="icon-button" title="Invite to Game">
                        <i class="fas fa-gamepad"></i>
                    </button>
                    <button class="icon-button" title="More Options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages">
                ${messages.length > 0 ? 
                    messages.map(msg => this.renderMessage(msg)).join('') : 
                    '<div class="chat-no-messages"><p>No messages yet. Start a conversation!</p></div>'}
            </div>
            <div class="chat-input">
                <input type="text" placeholder="Type a message..." id="message-input">
                <button id="send-button" class="button">
                    <i class="fas fa-paper-plane"></i> Send
                </button>
            </div>
        `;
        
        // Scroll to bottom of messages
        const messagesContainer = chatMain.querySelector('#chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Mark messages as read
        markMessagesAsRead(userId, this.currentUserId);
        
        // Setup send handler
        const messageInput = chatMain.querySelector('#message-input') as HTMLInputElement;
        const sendButton = chatMain.querySelector('#send-button');
        
        const sendMessageHandler = () => {
            const content = messageInput?.value.trim();
            if (!content) return;
            
            // Create new message using the helper function
            const newMessage = sendMessage(this.currentUserId, userId, content);
            
            if (newMessage) {
                // Add to UI
                const messagesContainer = chatMain.querySelector('#chat-messages');
                if (messagesContainer) {
                    const messageEl = document.createElement('div');
                    messageEl.innerHTML = this.renderMessage(newMessage);
                    messagesContainer.appendChild(messageEl.firstElementChild as HTMLElement);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
                
                // Clear input
                messageInput.value = '';
                
                // Update contact list to show new last message
                this.loadContacts();
                
                // Focus input again
                messageInput.focus();
            }
        };
        
        sendButton?.addEventListener('click', sendMessageHandler);
        
        messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessageHandler();
            }
        });
    }

    private renderMessage(message: ChatMessage): string {
        const isFromCurrentUser = message.senderId === this.currentUserId;
        const time = this.formatMessageTime(message.timestamp);
        
        return `
            <div class="chat-message ${isFromCurrentUser ? 'sent' : 'received'}">
                <div class="message-content">
                    <p>${message.content}</p>
                    <span class="message-time">${time} ${isFromCurrentUser ? (message.read ? '<i class="fas fa-check-double"></i>' : '<i class="fas fa-check"></i>') : ''}</span>
                </div>
            </div>
        `;
    }

    private filterContacts(searchTerm: string): void {
        const contacts = this.element?.querySelectorAll('.chat-contact');
        contacts?.forEach(contact => {
            const userName = contact.querySelector('h4')?.textContent?.toLowerCase() || '';
            if (userName.includes(searchTerm.toLowerCase())) {
                (contact as HTMLElement).style.display = '';
            } else {
                (contact as HTMLElement).style.display = 'none';
            }
        });
    }

    private truncateMessage(message: string, maxLength: number): string {
        return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
    }

    private formatMessageTime(date: Date): string {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date >= today) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date >= yesterday) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    destroy(): void {
        this.element = null;
    }
}