import { Router } from '../core/router.js';
import { Listener, addListener, removeListener, removeListeners } from '../services/listener.js';
import { 
    getUserById, 
    sendMessage, 
    getChatMessages, 
    markMessagesAsRead,
    getFriendsList,
    getLastMessageAndUnreadCount,
    setRealStatus,
    format_date,
    removeFriend
} from '../services/UserService.js';
import { ChatMessage, UserProfile } from '../types/index.js';
import { NotificationManager } from '../components/Notification.js';
import { getCurrentUser } from '../services/auth.js';
import { NULL_USER } from '../constants/defaults.js';
import { applyTranslations } from './Translate.js';

export class ChatView {
    private element: HTMLElement | null = null;
    private router: Router;
    private activeChatPartnerId: number | null = null;
    private currentUser: UserProfile = NULL_USER;

    private boundListeners: Listener[] = [];
    private addListener(l: Listener) { addListener(l, this.boundListeners); }
    private removeListeners() { removeListeners(this.boundListeners); this.boundListeners = []; }
    private boundContactListeners: Listener[] = [];
    private addContactListener(l: Listener) { addListener(l, this.boundContactListeners); }
    private removeContactListeners() { removeListeners(this.boundContactListeners); this.boundContactListeners = []; }
    private boundPanelListeners: Listener[] = [];
    private addPanelListener(l: Listener) { addListener(l, this.boundPanelListeners); }
    private removePanelListeners() { removeListeners(this.boundPanelListeners); this.boundPanelListeners = []; }

    private intervalId: number | null = null;

    constructor(router: Router, partnerId?: string) {
        console.log("--- CONSTRUCTING CHAT VIEW ---");
        this.router = router;
        this.activeChatPartnerId = partnerId ? parseInt(partnerId) : null;
    }

    async render(rootElement: HTMLElement): Promise<void> {
        const user = await getCurrentUser();
        if (!user) return;
        this.currentUser = user;
        this.element = document.createElement('div');
        this.element.className = 'chat-view';

        // Create the UI with a style similar to Settings view
        this.element.innerHTML = `
            <div class="chat-header">
                <h2 data-i18n="chat">Chat</h2>
                <p data-i18n="chatDescription">Chat with your friends and other players</p>
            </div>
            
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="chat-search">
                        <input type="text" placeholder="Filter contacts..." id="chat-search" data-i18n="filterContacts">
                    </div>
                    
                    <div class="chat-contacts" id="chat-contacts">
                        <!-- Contacts will be loaded here -->
                        <div class="loading-spinner" data-i18n="loadingConversations">Loading conversations...</div>
                    </div>
                </div>
                
                <div class="chat-content">
                    <!-- Welcome panel (initially visible) -->
                    <div class="chat-panel welcome-panel active" id="welcome-panel">
                        <div class="chat-welcome">
                            <i class="fas fa-comments"></i>
                            <h3 data-i18n="welcomeToChat">Welcome to Chat</h3>
                            <p data-i18n="selectContact">Select a contact to start chatting.</p>
                        </div>
                    </div>
                    
                    <!-- Chat panel (initially hidden) -->
                    <div class="chat-panel" id="chat-panel">
                        <div class="chat-panel-header" id="chat-panel-header">
                            <!-- Chat header will be populated dynamically -->
                        </div>
                        
                        <div class="chat-messages" id="chat-messages">
                            <!-- Messages will be populated dynamically -->
                        </div>
                        
                        <div class="chat-input">
                            <input type="text" placeholder="Type a message..." id="message-input" data-i18n="typeMessage">
                            <button id="send-button" class="app-button" data-i18n="sendMessage">
                                <i class="fas fa-paper-plane"></i> Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        rootElement.appendChild(this.element);
        applyTranslations(this.currentUser.language);

        await this.renderContacts();
        await this.setupEventListeners();
        await this.renderActiveChat();

        // refresh chat every 3 seconds. needs a smarter refresh function
        this.intervalId = window.setInterval(() => this.refreshChat(), 3000);
    }

    // refresh chat every 3 seconds. needs a smarter refresh function
    private async refreshChat() {
        await this.renderContacts();
        await this.renderActiveChat();
    }

    private async renderContacts(): Promise<void> {
        const contactsContainer = this.element?.querySelector('#chat-contacts');
        if (!contactsContainer) return;
        const friends = await getFriendsList(this.currentUser.id);
        if (friends.length === 0) {
            contactsContainer.innerHTML = '<span data-i18n="noContacts">No contacts</span>';
            applyTranslations(this.currentUser.language);
            return;
        }

        // let tempHTML: string = '';
        let tempHTML: Element = document.createElement('tempHTML');
        for (const friend of friends) {
            const {lastMessage, unreadCount} = (await getLastMessageAndUnreadCount(this.currentUser.id, friend.friend_id));
            tempHTML.innerHTML += `
                <div class="chat-contact" data-id="${friend.friend_id}">
                    <div class="chat-contact-avatar">
                        <img src="${friend.friend_avatar_url}" alt="${friend.friend_display_name}">
                        <span class="chat-status ${friend.friend_status}"></span>
                    </div>
                    <div class="chat-contact-info">
                        <h4>${friend.friend_display_name}</h4>
                        <p class="chat-last-message" data-i18n="noMessageYet">
                            ${lastMessage ? lastMessage.content.slice(0, 30) : 'No messages yet'}
                        </p>
                    </div>
                    <div class="chat-contact-meta">
                        <span class="chat-time">${lastMessage ? this.formatMessageTime(lastMessage.timestamp) : ''}</span>
                        ${unreadCount > 0 ? `<span class="chat-unread">${unreadCount}</span>` : ''}
                    </div>
                </div>
            `;
        }
        // filter contacts
        const searchInput = this.element?.querySelector('#chat-search') as HTMLInputElement;
        const contacts = tempHTML.querySelectorAll('.chat-contact');
        if (searchInput.value) contacts?.forEach(contact => {
            const userName = contact.querySelector('h4')?.textContent?.toLowerCase() || '';
            if (userName.includes(searchInput.value.toLowerCase())) {
                (contact as HTMLElement).style.display = '';
            } else {
                (contact as HTMLElement).style.display = 'none';
            }
        });
        
        contactsContainer.innerHTML = tempHTML.innerHTML;
        tempHTML.remove();
        this.setupContactListeners();
        applyTranslations(this.currentUser.language);
    }

    private setupEventListeners() {
        // Setup search/filter listener
        const searchInput = this.element?.querySelector('#chat-search') as HTMLInputElement;
        if (searchInput) this.addListener({
            element: searchInput,
            event: 'input',
            handler: () => { this.filterContacts(searchInput.value); }
        });

        // Send button
        const sendButton = this.element?.querySelector('#send-button');
        if (sendButton) this.addListener({
            element: sendButton,
            event: 'click',
            handler: () => { this.sendNewMessage(); }
        });

        // Textbox
        const messageInput = this.element?.querySelector('#message-input');
        if (messageInput) this.addListener({
            element: messageInput,
            event: 'keydown',
            handler: (event) => {
                // const kbEvent = event as KeyboardEvent;
                if ((event as KeyboardEvent).key === 'Enter' && !(event as KeyboardEvent).shiftKey) {
                    (event as KeyboardEvent).preventDefault();
                    this.sendNewMessage();
                }
            }
        });
    }

    private setupContactListeners() {
        // Update this.activeChatPartnerId when clicking on a contact
        const contacts = this.element?.querySelectorAll('.chat-contact');
        if (!contacts) return;
        this.removeContactListeners();
        for (const contact of contacts)
        {
            this.addContactListener({
                element: contact,
                event: 'click',
                handler: () => {
                    this.activeChatPartnerId = Number(contact.getAttribute('data-id'));
                    this.renderActiveChat();
                    const messageInput = this.element?.querySelector('#message-input') as HTMLInputElement;
                    messageInput?.focus();
                }
            });
        }
    }

    private setupPanelListeners() {
        this.removePanelListeners();
        const inviteButton = this.element?.querySelector('.invite-button');
        this.addPanelListener({
            element: inviteButton,
            event: 'click',
            handler: async () => {
                const friendId = this.activeChatPartnerId;
                const friend = friendId ? await getUserById(friendId) : null;
                if (!friendId || !friend || !(await sendMessage(friendId, "Hey, let's play a game!"))) {
                    NotificationManager.show({
                        title: 'Game Invitation',
                        message: `Failed to send invitation ${friend ? `to ${friend.display_name}` : ``}`,
                        type: 'error',
                        duration: 3000
                    });
                } else {
                    NotificationManager.show({
                        title: 'Game Invitation',
                        message: `Invitation sent to ${friend.display_name}`,
                        type: 'success',
                        duration: 3000
                    });
                    this.renderActiveChat();
                }
            }
        });
        const blockButton = this.element?.querySelector('.block-button');
        this.addPanelListener({
            element: blockButton,
            event: 'click',
            handler: async () => {
                const friendId = this.activeChatPartnerId;
                const friend = friendId ? await getUserById(friendId) : null;
                if (!friendId || !friend || !(await removeFriend(this.currentUser.id, friendId))) {
                    NotificationManager.show({
                        title: 'Block user',
                        message: `Failed to block ${friend ? `${friend.display_name}` : ``}`,
                        type: 'error',
                        duration: 3000
                    });
                } else {
                    NotificationManager.show({
                        title: `Blocked ${friend.display_name}`,
                        message: `${friend.display_name} was removed from your friends list`,
                        type: 'success',
                        duration: 3000
                    });
                    this.activeChatPartnerId = null;
                    this.router.reload();
                }
            }
        });
    }

    private activateContact() {
        if (!this.activeChatPartnerId) return;
        const contacts = this.element?.querySelectorAll('.chat-contact');
        if (!contacts) return;
        for (const contact of contacts)
        {
            // Update active contact
            const contactId = Number(contact.getAttribute('data-id'));
            if (contactId === this.activeChatPartnerId)
                contact.classList.add('active');
            else
                contact.classList.remove('active');
        }
    }

    private async renderActiveChat() {
        this.activateContact();
        if (!this.activeChatPartnerId) return;
        // remove welcome panel
        this.element?.querySelector('#welcome-panel')?.remove();
        // display chat panel
        this.element?.querySelector('#chat-panel')?.classList.add('active');
        const headerContainer = this.element?.querySelector('#chat-panel-header');
        const messagesContainer = this.element?.querySelector('#chat-messages');
        if (!headerContainer || !messagesContainer) return;

        try {
            // Show loading state
            // messagesContainer.innerHTML = '<div class="loading-spinner">Loading messages...</div>';

            // Get partner user profile
            const partner = await getUserById(this.activeChatPartnerId);
            if (!partner) {
                messagesContainer.innerHTML = '<div class="chat-no-messages">User not found</div>';
                return;
            }
            setRealStatus(partner);

            // Render header
            const statusClass = partner.status ? partner.status : 'offline';
            const statusText = partner.status ? partner.status.charAt(0).toUpperCase() + partner.status.slice(1) : "Offline";
            
            headerContainer.innerHTML = `
                <div class="chat-panel-user">
                    <img src="${partner.avatar_url || 'https://placehold.co/40x40/1d1f21/ffffff?text=User'}" alt="${partner.display_name}">
                    <div class="chat-panel-info">
                        <h3>${partner.display_name}</h3>
                        <span class="chat-panel-status ${partner.status}">${statusText}</span>
                    </div>
                </div>
                <div class="chat-panel-actions">
                    <button class="invite-button" data-i18n="inviteToGame" title="Invite to Game"><i class="fas fa-gamepad"></i></button>
                    <button class="block-button" data-i18n="blockUser" title="Block User"><i class="fas fa-ban"></i></button>
                </div>
            `;

            // Get chat mesasges
            const messages = await getChatMessages(this.currentUser.id, partner.id);
            if (messages.length === 0) {
                messagesContainer.innerHTML = '<div class="chat-no-messages"><p data-i18n="noMessage">No messages yet. Start a conversation!</p></div>';
                applyTranslations(this.currentUser.language);
            } else {
                this.renderAllMessages(messages);
                await markMessagesAsRead(messages);
            }

            await this.renderContacts();
            this.activateContact();
            this.setupPanelListeners();
        } catch (error) {
            console.error("Error loading chat:", error);
            messagesContainer.innerHTML = '<div class="error">Failed to load messages. Please try again.</div>';
        }
    }

    private handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && this.activeChatPartnerId) {
            this.sendNewMessage();
        }
    }

    private async sendNewMessage(): Promise<void> {
        if (!this.activeChatPartnerId) return;
        const messageInput = this.element?.querySelector('#message-input') as HTMLInputElement;
        const content = messageInput?.value.trim();
        
        if (!content) return;
        
        try {
            const newMessage = await sendMessage(this.activeChatPartnerId, content);
            if (newMessage) {
                this.renderMessage(newMessage);
                messageInput.value = '';
                messageInput.focus();
                // Update contact list to show new last message
                await this.renderContacts();
                this.activateContact();
            }
        } catch (error) {
            console.error("Error sending message:", error);
            NotificationManager.show({
                message: "Failed to send message. Please try again.",
                type: "error",
                duration: 3000
            });
        }
    }

    private renderMessage(message: ChatMessage) {
        const messagesContainer = this.element?.querySelector('#chat-messages');
        if (!messagesContainer) return;
        const isFromCurrentUser = message.sender_id === this.currentUser.id;
        const time = this.formatMessageTime(message.timestamp);
        
        messagesContainer.innerHTML += `
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
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    private renderAllMessages(messages: ChatMessage[]) {
        const messagesContainer = this.element?.querySelector('#chat-messages');
        if (!messagesContainer) return;
        let newHTML: string = '';
        for (const msg of messages) {
            const isFromCurrentUser = msg.sender_id === this.currentUser.id;
            const time = this.formatMessageTime(msg.timestamp);
            
            newHTML += `
                <div class="chat-message ${isFromCurrentUser ? 'sent' : 'received'}">
                    <div class="message-content">
                        <p>${msg.content}</p>
                        <span class="message-time">
                            ${time} 
                            ${isFromCurrentUser ? (msg.read ? '<i class="fas fa-check-double"></i>' : '<i class="fas fa-check"></i>') : ''}
                        </span>
                    </div>
                </div>
            `;
        }
        const newMessages: boolean = (document.querySelectorAll('.chat-message').length !== messages.length);
        // const newMessages = (messagesContainer.innerHTML !== newHTML);
        messagesContainer.innerHTML = newHTML;
        if (newMessages)
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // private renderMessage(message: ChatMessage): string {
    //     const isFromCurrentUser = message.sender_id === this.currentUser.id;
    //     const time = this.formatMessageTime(new Date(message.timestamp));
        
    //     return `
    //         <div class="chat-message ${isFromCurrentUser ? 'sent' : 'received'}">
    //             <div class="message-content">
    //                 <p>${message.content}</p>
    //                 <span class="message-time">
    //                     ${time} 
    //                     ${isFromCurrentUser ? (message.read ? '<i class="fas fa-check-double"></i>' : '<i class="fas fa-check"></i>') : ''}
    //                 </span>
    //             </div>
    //         </div>
    //     `;
    // }

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

    private formatMessageTime(date: string): string {
        const utcDate = new Date(date.replace(' ', 'T') + 'Z');
        const now = new Date();

        const utcNow = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));

        const utcYesterday = new Date(utcNow);
        utcYesterday.setUTCDate(utcYesterday.getUTCDate() - 1);

        const messageDate = new Date(Date.UTC(
            utcDate.getUTCFullYear(),
            utcDate.getUTCMonth(),
            utcDate.getUTCDate()
        ));

        if (messageDate.getTime() === utcNow.getTime()) {
            return utcDate.toISOString().substring(11, 16); // "HH:mm"
        } else if (messageDate.getTime() === utcYesterday.getTime()) {
            return 'Yesterday';
        } else {
            const month = utcDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
            const day = utcDate.getUTCDate();
            return `${month} ${day}`;
        }
    }

    destroy(): void {
        console.log("--- DESTROYING CHAT VIEW ---");
        if (this.intervalId) clearInterval(this.intervalId);
        this.removeListeners();
        this.removePanelListeners();
        this.removeContactListeners();
        this.element?.remove();
        this.element = null; 
    } 
}
