import { Router } from '../core/router.js';
import { getUserById, sendFriendRequest, acceptFriendRequest } from '../data/UserService.js';
import { mockUsers } from '../data/mock_data.js';
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

        // Create the UI with layout matching Settings style
        this.element.innerHTML = `
            <div class="friends-header">
                <h2>Friends</h2>
                <p>Connect with other players and manage your friend list</p>
            </div>
            
            <div class="friends-container">
                <div class="friends-sidebar">
                    <div class="friends-search">
                        <input type="text" id="friend-search" placeholder="Search for users...">
                        <button id="search-button" class="app-button">Search</button>
                    </div>
                    
                    <ul class="friends-nav">
                        <li><a href="#all-friends" class="active" data-tab="friends-list">My Friends <span class="friends-count" id="friends-count"></span></a></li>
                        <li><a href="#requests" data-tab="requests">Friend Requests <span class="friends-count" id="request-count"></span></a></li>
                    </ul>
                </div>
                
                <div class="friends-content">
                    <div id="friends-list" class="friends-panel active">
                        <h3>My Friends</h3>
                        <div class="friends-grid" id="friends-grid">
                            <!-- Friends will be loaded here -->
                            <div class="loading-spinner">Loading friends...</div>
                        </div>
                    </div>
                    
                    <div id="requests" class="friends-panel">
                        <h3>Friend Requests</h3>
                        <div class="requests-list" id="requests-list">
                            <!-- Friend requests will be loaded here -->
                            <div class="loading-spinner">Loading requests...</div>
                        </div>
                    </div>
                    
                    <div id="search-results" class="friends-panel search-results-panel">
                        <h3>Search Results</h3>
                        <div class="search-results-container" id="search-results-container">
                            <!-- Search results will appear here -->
                            <p>Search for users to add them as friends</p>
                        </div>
                    </div>
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
        
        // Nav item switching - like Settings tabs
        const navLinks = this.element.querySelectorAll('.friends-nav a');
        const panels = this.element.querySelectorAll('.friends-panel');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('data-tab');
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Show target panel, hide others
                panels.forEach(panel => {
                    if (panel.id === tabId) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
            });
        });
        
        // Search form
        const searchButton = this.element.querySelector('#search-button');
        const searchInput = this.element.querySelector('#friend-search') as HTMLInputElement;
        
        searchButton?.addEventListener('click', () => {
            const searchTerm = searchInput?.value.trim() || '';
            if (searchTerm) {
                this.searchUsers(searchTerm);
                
                // Switch to search results panel
                navLinks.forEach(l => l.classList.remove('active'));
                panels.forEach(panel => panel.classList.remove('active'));
                
                const searchPanel = this.element?.querySelector('#search-results');
                if (searchPanel) searchPanel.classList.add('active');
            }
        });
        
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim() || '';
                if (searchTerm) {
                    this.searchUsers(searchTerm);
                    
                    // Switch to search results panel
                    navLinks.forEach(l => l.classList.remove('active'));
                    panels.forEach(panel => panel.classList.remove('active'));
                    
                    const searchPanel = this.element?.querySelector('#search-results');
                    if (searchPanel) searchPanel.classList.add('active');
                }
            }
        });
    }

    private loadFriends(): void {
        const currentUser = getUserById(this.currentUserId);
        const friendsGrid = this.element?.querySelector('#friends-grid');
        const friendsCount = this.element?.querySelector('#friends-count');
        
        if (!friendsGrid || !currentUser) return;
        
        const friends = currentUser.friends || [];
        
        // Update friends count
        if (friendsCount) {
            friendsCount.textContent = friends.length > 0 ? `(${friends.length})` : '';
        }
        
        if (friends.length === 0) {
            friendsGrid.innerHTML = '<p class="empty-message">You don\'t have any friends yet. Use the search to find other players.</p>';
            return;
        }
        
        let friendsHTML = '';
        
        friends.forEach(friendId => {
            const friend = getUserById(friendId);
            if (!friend) return;
            
            // Determine status - ADD API 
            const status = friend.status || (Math.random() > 0.5 ? 'online' : 'offline');
            const statusText = status === 'in-game' ? 'In Game' : (status === 'online' ? 'Online' : 'Offline');
            
            friendsHTML += `
                <div class="friend-card">
                    <img src="${friend.avatarUrl || 'https://placehold.co/80x80/1d1f21/ffffff?text=' + friend.displayName.charAt(0)}" 
                        alt="${friend.displayName}" class="friend-avatar">
                    <div class="friend-info">
                        <h4>${friend.displayName}</h4>
                        <div class="friend-status ${status}">
                            ${statusText}
                        </div>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-button message" data-id="${friend.id}">
                            <i class="fas fa-comment"></i> Message
                        </button>
                        <button class="friend-button invite" data-id="${friend.id}">
                            <i class="fas fa-gamepad"></i> Invite
                        </button>
                    </div>
                </div>
            `;
        });
        
        friendsGrid.innerHTML = friendsHTML;
        
        // Add event listeners to buttons
        const messageButtons = this.element?.querySelectorAll('.friend-button.message');
        messageButtons?.forEach(button => {
            button.addEventListener('click', () => {
                const friendId = button.getAttribute('data-id');
                this.router.navigate(`/chat/${friendId}`);
            });
        });
        
        const inviteButtons = this.element?.querySelectorAll('.friend-button.invite');
        inviteButtons?.forEach(button => {
            button.addEventListener('click', () => {
                const friendId = button.getAttribute('data-id');
                const friend = getUserById(Number(friendId));
                if (friend) {
                    NotificationManager.show({
                        title: 'Game Invitation',
                        message: `Invitation sent to ${friend.displayName}`,
                        type: 'success',
                        duration: 3000
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
        
        const requests = currentUser.friendRequests || [];
        const pendingRequests = requests.filter(r => r.status === 'pending');
        
        // Update request count
        if (requestCount) {
            requestCount.textContent = pendingRequests.length > 0 ? `(${pendingRequests.length})` : '';
        }
        
        if (pendingRequests.length === 0) {
            requestsList.innerHTML = '<p class="empty-message">You don\'t have any friend requests.</p>';
            return;
        }
        
        let requestsHTML = '';
        
        pendingRequests.forEach(request => {
            const fromUser = getUserById(request.from);
            if (!fromUser) return;
            
            requestsHTML += `
                <div class="request-card">
                    <img src="${fromUser.avatarUrl || 'https://placehold.co/50x50/1d1f21/ffffff?text=' + fromUser.displayName.charAt(0)}" 
                        alt="${fromUser.displayName}" class="request-avatar">
                    <div class="request-info">
                        <h4>${fromUser.displayName}</h4>
                        <p class="request-date">Requested ${request.date}</p>
                    </div>
                    <div class="request-actions">
                        <button class="request-button accept" data-id="${request.id}" data-user-id="${fromUser.id}">
                            Accept
                        </button>
                        <button class="request-button reject" data-id="${request.id}" data-user-id="${fromUser.id}">
                            Reject
                        </button>
                    </div>
                </div>
            `;
        });
        
        requestsList.innerHTML = requestsHTML;
        
        // Add event listeners for accept/reject buttons
        const acceptButtons = this.element?.querySelectorAll('.request-button.accept');
        acceptButtons?.forEach(button => {
            button.addEventListener('click', () => {
                const requestId = Number(button.getAttribute('data-id'));
                const userId = Number(button.getAttribute('data-user-id'));
                
                // Accept friend request
                const success = acceptFriendRequest(this.currentUserId, requestId);
                
                if (success) {
                    NotificationManager.show({
                        title: 'Friend Request Accepted',
                        message: 'You are now friends!',
                        type: 'success',
                        duration: 3000
                    });
                    
                    // Reload both friend lists
                    this.loadFriends();
                    this.loadFriendRequests();
                }
            });
        });
        
        const rejectButtons = this.element?.querySelectorAll('.request-button.reject');
        rejectButtons?.forEach(button => {
            button.addEventListener('click', () => {
                const requestId = Number(button.getAttribute('data-id'));
                const userId = Number(button.getAttribute('data-user-id'));
                
                // ADD API, reject the friend request
                // For now, just remove the card and show notification
                const requestCard = button.closest('.request-card');
                if (requestCard) {
                    requestCard.remove();
                    
                    NotificationManager.show({
                        title: 'Friend Request Rejected',
                        message: 'The friend request has been rejected.',
                        type: 'info',
                        duration: 3000
                    });
                    
                    // Reload requests list to update counts
                    this.loadFriendRequests();
                }
            });
        });
    }

    private searchUsers(searchTerm: string): void {
        const searchResults = this.element?.querySelector('#search-results-container');
        if (!searchResults) return;
        
        // Show loading state
        searchResults.innerHTML = '<div class="loading-spinner">Searching...</div>';
        
        const currentUser = getUserById(this.currentUserId);
        if (!currentUser) return;
        
        // Filter users
        const filteredUsers = mockUsers.filter(user => 
            user.id !== this.currentUserId && 
            (user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             user.username.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        if (filteredUsers.length === 0) {
            searchResults.innerHTML = '<p class="empty-message">No users found matching your search.</p>';
            return;
        }
        
        let resultsHTML = '';
        
        filteredUsers.forEach(user => {
            const isFriend = currentUser.friends?.includes(user.id);
            const isPending = currentUser.friendRequests?.some(r => r.from === user.id && r.status === 'pending');
            
            resultsHTML += `
                <div class="search-result-card">
                    <img src="${user.avatarUrl || 'https://placehold.co/50x50/1d1f21/ffffff?text=' + user.displayName.charAt(0)}" 
                        alt="${user.displayName}" class="search-result-avatar">
                    <div class="search-result-info">
                        <h4>${user.displayName}</h4>
                        <p>@${user.username}</p>
                    </div>
                    <div class="search-result-actions">
                        ${isFriend 
                            ? '<span class="friend-badge"><i class="fas fa-user-check"></i> Friend</span>'
                            : (isPending 
                                ? '<span class="pending-badge"><i class="fas fa-clock"></i> Pending</span>'
                                : `<button class="friend-button add" data-id="${user.id}">
                                    <i class="fas fa-user-plus"></i> Add Friend
                                </button>`
                            )
                        }
                    </div>
                </div>
            `;
        });
        
        searchResults.innerHTML = resultsHTML;
        
        // Add event listeners to add friend buttons
        const addFriendButtons = this.element?.querySelectorAll('.friend-button.add');
        addFriendButtons?.forEach(button => {
            button.addEventListener('click', () => {
                const userId = Number(button.getAttribute('data-id'));
                const user = getUserById(userId);
                
                if (user) {
                    // ADD API, send friend request
                    const success = sendFriendRequest(this.currentUserId, userId);
                    
                    if (success) {
                        // Update button to show pending
                        const actionsDiv = button.parentElement;
                        if (actionsDiv) {
                            actionsDiv.innerHTML = '<span class="pending-badge"><i class="fas fa-clock"></i> Pending</span>';
                        }
                        
                        NotificationManager.show({
                            title: 'Friend Request Sent',
                            message: `Friend request sent to ${user.displayName}`,
                            type: 'success',
                            duration: 3000
                        });
                    }
                }
            });
        });
    }

    destroy(): void {
        this.element = null;
    }
}