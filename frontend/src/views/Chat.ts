import { Router } from '../core/router.js';
import { 
    getUserById,
    markMessagesAsRead,
    sendMessage,
    getUserConversations
} from '../data/UserService.js';
import { ChatMessage } from '../data/Types.js';
import { NotificationManager } from '../components/Notification.js';
import { mockMessages } from '../data/mock_data.js';

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

        // Create the UI with a style similar to Settings view
        this.element.innerHTML = `
            <div class="chat-header">
                <h2>Chat</h2>
                <p>Chat with your friends and other players</p>
            </div>
            
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="chat-search">
                        <input type="text" placeholder="Search contacts..." id="chat-search">
                    </div>
                    
                    <div class="chat-contacts" id="chat-contacts">
                        <!-- Contacts will be loaded here -->
                        <div class="loading-spinner">Loading conversations...</div>
                    </div>
                </div>
                
                <div class="chat-content">
                    <!-- Welcome panel (initially visible) -->
                    <div class="chat-panel welcome-panel active" id="welcome-panel">
                        <div class="chat-welcome">
                            <i class="fas fa-comments"></i>
                            <h3>Welcome to Chat</h3>
                            <p>Select a conversation to start chatting or search for users to start a new conversation.</p>
                        </div>
                    </div>
                    
                    <!-- Active chat panel (initially hidden) -->
                    <div class="chat-panel" id="active-chat-panel">
                        <div class="chat-panel-header" id="chat-panel-header">
                            <!-- Chat header will be populated dynamically -->
                        </div>
                        
                        <div class="chat-messages" id="chat-messages">
                            <!-- Messages will be populated dynamically -->
                        </div>
                        
                        <div class="chat-input">
                            <input type="text" placeholder="Type a message..." id="message-input">
                            <button id="send-button" class="app-button">
                                <i class="fas fa-paper-plane"></i> Send
                            </button>
                        </div>
                    </div>
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
        
        // Get conversations for current user using the helper function
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
            
            // Get online status
            const isOnline = user.status === 'online';
            const statusClass = user.status === 'in-game' ? 'in-game' : (isOnline ? 'online' : 'offline');
            
            contactsHTML += `
                <div class="chat-contact ${this.activeChatUserId === user.id ? 'active' : ''}" data-id="${user.id}">
                    <div class="chat-contact-avatar">
                        <img src="${user.avatarUrl || 'https://placehold.co/40x40/1d1f21/ffffff?text=User'}" alt="${user.displayName}">
                        <span class="chat-status ${statusClass}"></span>
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
        // Show active chat panel, hide welcome panel
        const welcomePanel = this.element?.querySelector('#welcome-panel');
        const activeChatPanel = this.element?.querySelector('#active-chat-panel');
        
        if (welcomePanel && activeChatPanel) {
            welcomePanel.classList.remove('active');
            activeChatPanel.classList.add('active');
        }
        
        const headerContainer = this.element?.querySelector('#chat-panel-header');
        const messagesContainer = this.element?.querySelector('#chat-messages');
        
        if (!headerContainer || !messagesContainer) return;
        
        const user = getUserById(userId);
        if (!user) {
            messagesContainer.innerHTML = '<div class="chat-no-messages">User not found</div>';
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
        
        // Render header
        headerContainer.innerHTML = `
            <div class="chat-panel-user">
                <img src="${user.avatarUrl || 'https://placehold.co/40x40/1d1f21/ffffff?text=User'}" alt="${user.displayName}">
                <div class="chat-panel-info">
                    <h3>${user.displayName}</h3>
                    <span class="chat-panel-status ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="chat-panel-actions">
                <button title="Video Call"><i class="fas fa-video"></i></button>
                <button title="Invite to Game"><i class="fas fa-gamepad"></i></button>
                <button title="More Options"><i class="fas fa-ellipsis-v"></i></button>
            </div>
        `;
        
        // Render messages
        messagesContainer.innerHTML = messages.length > 0 
            ? messages.map(msg => this.renderMessage(msg)).join('') 
            : '<div class="chat-no-messages"><p>No messages yet. Start a conversation!</p></div>';
        
        // Scroll to bottom of messages
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Mark messages as read
        markMessagesAsRead(userId, this.currentUserId);
        
        // Setup send handler
        const messageInput = this.element?.querySelector('#message-input') as HTMLInputElement;
        const sendButton = this.element?.querySelector('#send-button');
        
        // Remove old event listeners
        const newSendButton = sendButton?.cloneNode(true);
        if (sendButton?.parentNode && newSendButton) {
            sendButton.parentNode.replaceChild(newSendButton, sendButton);
        }
        
        // Add new send button listener
        this.element?.querySelector('#send-button')?.addEventListener('click', () => {
            this.sendNewMessage(userId);
        });
        
        // Clear old input listener and add new one
        messageInput?.removeEventListener('keypress', this.handleKeyPress);
        messageInput?.addEventListener('keypress', this.handleKeyPress);
        
        // Focus on input
        messageInput?.focus();
    }

    private handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && this.activeChatUserId) {
            this.sendNewMessage(this.activeChatUserId);
        }
    }

    private sendNewMessage(userId: number): void {
        const messageInput = this.element?.querySelector('#message-input') as HTMLInputElement;
        const content = messageInput?.value.trim();
        
        if (!content) return;
        
        // Create new message
        const newMessage = sendMessage(this.currentUserId, userId, content);
        
        if (newMessage) {
            // Add to UI
            const messagesContainer = this.element?.querySelector('#chat-messages');
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
    }

    private renderMessage(message: ChatMessage): string {
        const isFromCurrentUser = message.senderId === this.currentUserId;
        const time = this.formatMessageTime(message.timestamp);
        
        return `
            <div class="chat-message ${isFromCurrentUser ? 'sent' : 'received'}">
                <div class="message-content">
                    <p>${message.content}</p>
                    <span class="message-time">
                        ${time} 
                        ${isFromCurrentUser ? (message.read ? '<i class="fas fa-check-double"></i>' : '<i class="fas fa-check"></i>') : ''}
                    </span>
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
        const messageInput = this.element?.querySelector('#message-input');
        messageInput?.removeEventListener('keypress', this.handleKeyPress as EventListener);
        
        this.element = null;
    }
}