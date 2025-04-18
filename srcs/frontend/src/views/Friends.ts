import { Router } from '../core/router.js';
import { getUserById } from '../data/UserService.js';
import { mockUsers } from '../data/mock_data.js' 
import { NotificationManager } from '../components/Notification.js';

export class FriendsView {
    private element: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = 1; // get real user session

    constructor(router: Router) {
        this.router = router;
    }

    render(rootElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.className = 'friends-view';

        const currentUser = getUserById(this.currentUserId);
        if (!currentUser) {
            this.element.innerHTML = '<p>User not found</p>';
            rootElement.appendChild(this.element);
            return;
        }

        // Create the UI sections
        this.element.innerHTML = `
            <div class="friends-container">
                <h2>Friends</h2>
                
                <div class="friends-search-container">
                    <div class="search-form">
                        <input type="text" id="friend-search" placeholder="Search for users...">
                        <button id="search-button" class="button">Search</button>
                    </div>
                </div>
                
                <div class="tabs">
                    <button class="tab-button active" data-tab="friends-list">My Friends</button>
                    <button class="tab-button" data-tab="requests">Friend Requests <span id="request-count"></span></button>
                </div>
                
                <div class="tab-content">
                    <div id="friends-list" class="tab-pane active">
                        <div class="friends-grid" id="friends-grid">
                            <!-- Friends will be loaded here -->
                        </div>
                    </div>
                    
                    <div id="requests" class="tab-pane">
                        <div class="requests-list" id="requests-list">
                            <!-- Friend requests will be loaded here -->
                        </div>
                    </div>
                </div>
                
                <div id="search-results" class="search-results">
                    <!-- Search results will appear here -->
                </div>
            </div>
        `;

        rootElement.appendChild(this.element);
        
        // Setup event handlers
        this.setupEventListeners();
        
        // Load initial data
        this.loadFriends();
        this.loadFriendRequests();
    }

    private setupEventListeners(): void {
        if (!this.element) return;
        
        // Tab switching
        const tabButtons = this.element.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                const panes = this.element?.querySelectorAll('.tab-pane');
                panes?.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Show corresponding pane
                const tabId = button.getAttribute('data-tab');
                const pane = this.element?.querySelector(`#${tabId}`);
                pane?.classList.add('active');
            });
        });
        
        // Search form
        const searchButton = this.element.querySelector('#search-button');
        const searchInput = this.element.querySelector('#friend-search') as HTMLInputElement;
        
        searchButton?.addEventListener('click', () => {
            const searchTerm = searchInput?.value || '';
            this.searchUsers(searchTerm);
        });
        
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value || '';
                this.searchUsers(searchTerm);
            }
        });
    }

    private loadFriends(): void {
        const currentUser = getUserById(this.currentUserId);
        const friendsGrid = this.element?.querySelector('#friends-grid');
        
        if (!friendsGrid || !currentUser || !currentUser.friends) {
            if (friendsGrid) {
                friendsGrid.innerHTML = '<p>You don\'t have any friends yet.</p>';
            }
            return;
        }
        
        if (currentUser.friends.length === 0) {
            friendsGrid.innerHTML = '<p>You don\'t have any friends yet.</p>';
            return;
        }
        
        let friendsHTML = '';
        
        currentUser.friends.forEach(friendId => {
            const friend = getUserById(friendId);
            if (!friend) return;
            
            // mock
            friendsHTML += `
                <div class="friend-card">
                    <img src="${friend.avatarUrl || 'https://placehold.co/100x100/1d1f21/ffffff?text=User'}" alt="${friend.displayName}" class="friend-avatar">
                    <div class="friend-info">
                        <h3>${friend.displayName}</h3>
                        <p class="friend-status ${Math.random() > 0.5 ? 'online' : 'offline'}">
                            ${Math.random() > 0.5 ? 'Online' : 'Offline'}
                        </p>
                    </div>
                    <div class="friend-actions">
                        <button class="action-button chat-button" data-id="${friend.id}">
                            <i class="fas fa-comments"></i> Chat
                        </button>
                        <button class="action-button game-button" data-id="${friend.id}">
                            <i class="fas fa-gamepad"></i> Invite
                        </button>
                    </div>
                </div>
            `;
        });
        
        friendsGrid.innerHTML = friendsHTML;
        
        // Add event listeners to buttons
        const chatButtons = this.element?.querySelectorAll('.chat-button');
        chatButtons?.forEach(button => {
            button.addEventListener('click', () => {
                const friendId = button.getAttribute('data-id');
                this.router.navigate(`/chat/${friendId}`);
            });
        });
        
        const gameButtons = this.element?.querySelectorAll('.game-button');
        gameButtons?.forEach(button => {
            button.addEventListener('click', () => {
                const friendId = button.getAttribute('data-id');
                const friend = getUserById(Number(friendId));
                if (friend) {
                    NotificationManager.show({
                        title: 'Game Invitation',
                        message: `Invitation sent to ${friend.displayName}`,
                        type: 'success'
                    });
                }
            });
        });
    }

    private loadFriendRequests(): void {
        const currentUser = getUserById(this.currentUserId);
        const requestsList = this.element?.querySelector('#requests-list');
        const requestCount = this.element?.querySelector('#request-count');
        
        if (!requestsList || !currentUser) return;
        
        if (!currentUser.friendRequests || currentUser.friendRequests.length === 0) {
            requestsList.innerHTML = '<p>You don\'t have any friend requests.</p>';
            if (requestCount) requestCount.textContent = '';
            return;
        }
        
        // Update request count
        if (requestCount) {
            const pendingCount = currentUser.friendRequests.filter(r => r.status === 'pending').length;
            requestCount.textContent = pendingCount > 0 ? `(${pendingCount})` : '';
        }
        
        let requestsHTML = '';
        
        currentUser.friendRequests.forEach(request => {
            if (request.status !== 'pending') return;
            
            const fromUser = getUserById(request.from);
            if (!fromUser) return;
            
            requestsHTML += `
                <div class="request-card">
                    <img src="${fromUser.avatarUrl || 'https://placehold.co/60x60/1d1f21/ffffff?text=User'}" alt="${fromUser.displayName}" class="request-avatar">
                    <div class="request-info">
                        <h3>${fromUser.displayName}</h3>
                        <p class="request-date">Sent on ${request.date}</p>
                    </div>
                    <div class="request-actions">
                        <button class="action-button accept-button" data-id="${request.id}">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="action-button reject-button" data-id="${request.id}">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </div>
            `;
        });
        
        requestsList.innerHTML = requestsHTML || '<p>You don\'t have any friend requests.</p>';
        
    }

    private searchUsers(searchTerm: string): void {
        const searchResults = this.element?.querySelector('#search-results');
        if (!searchResults) return;
        
        if (!searchTerm) {
            searchResults.innerHTML = '';
            return;
        }
        
        const currentUser = getUserById(this.currentUserId);
        if (!currentUser) return;
        
        // Filter users
        const filteredUsers = mockUsers.filter(user => 
            user.id !== this.currentUserId && 
            (user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             user.username.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        if (filteredUsers.length === 0) {
            searchResults.innerHTML = '<p>No users found.</p>';
            return;
        }
        
        let resultsHTML = '<h3>Search Results</h3>';
        
        filteredUsers.forEach(user => {
            const isFriend = currentUser.friends?.includes(user.id);
            
            resultsHTML += `
                <div class="search-result-card">
                    <img src="${user.avatarUrl || 'https://placehold.co/60x60/1d1f21/ffffff?text=User'}" alt="${user.displayName}" class="search-result-avatar">
                    <div class="search-result-info">
                        <h3>${user.displayName}</h3>
                        <p>@${user.username}</p>
                    </div>
                    <div class="search-result-actions">
                        ${isFriend 
                            ? '<span class="friend-badge"><i class="fas fa-user-check"></i> Friend</span>'
                            : `<button class="action-button add-friend-button" data-id="${user.id}">
                                <i class="fas fa-user-plus"></i> Add Friend
                            </button>`
                        }
                    </div>
                </div>
            `;
        });
        
        searchResults.innerHTML = resultsHTML;
    }

    destroy(): void {
        this.element = null;
    }
}