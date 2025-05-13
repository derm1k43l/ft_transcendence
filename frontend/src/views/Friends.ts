import { Router } from '../core/router.js';
import { NotificationManager } from '../components/Notification.js';
import * as Auth from '../services/auth.js';
import { 
    getUserById, 
    sendFriendRequest, 
    getFriendsList,
    getIncomingFriendRequests,
    getOutgoingFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest
} from '../services/UserService.js';
import { currentUser } from '../main.js';

export class FriendsView {
    private element: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = currentUser?.id || -1; // get real user session

    constructor(router: Router) {
        this.router = router;
    }

    async render(rootElement: HTMLElement): Promise<void> {
        this.element = document.createElement('div');
        this.element.className = 'friends-view';

        try {
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
                            <h3>Incoming Friend Requests</h3>
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
            await this.loadFriends();
            await this.loadFriendRequests();
        } catch (error) {
            console.error("Error rendering friends view:", error);
            this.element.innerHTML = '<div class="error">Error loading friends. Please try again later.</div>';
            rootElement.appendChild(this.element);
        }
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

    private async loadFriends(): Promise<void> {
        try {
            const friendsGrid = this.element?.querySelector('#friends-grid');
            const friendsCount = this.element?.querySelector('#friends-count');
            
            if (!friendsGrid || !currentUser) return;
        
            const friends = await getFriendsList(this.currentUserId);
        
            // Update friends count
            if (friendsCount) {
                friendsCount.textContent = friends.length > 0 ? `(${friends.length})` : '';
            }

            if (!friends || friends.length === 0) {
                friendsGrid.innerHTML = '<p class="chat-welcome">You don\'t have any friends yet. Use the search to find other players.</p>';
                return;
            }

            let friendsHTML = '';

            // Loop through each friend ID
            for (const friend of friends) {
                // Get status from the friend object
                const status = friend.friend_status || 'offline';
                const statusText = status === 'in-game' ? 'In Game' : (status === 'online' ? 'Online' : 'Offline');
                if (!friend.friend_display_name)
                    continue;
                friendsHTML += `
                    <div class="friend-card">
                        <img src="${friend.friend_avatar_url || 'https://placehold.co/80x80/1d1f21/ffffff?text=' + friend.friend_display_name.charAt(0)}" 
                            alt="${friend.friend_display_name}" class="friend-avatar">
                        <div class="friend-info">
                            <h4>${friend.friend_display_name}</h4>
                            <div class="friend-status ${status}">
                                ${statusText}
                            </div>
                        </div>
                        <div class="friend-actions">
                            <button class="friend-button message" data-id="${friend.friend_id}">
                                <i class="fas fa-comment"></i> Message
                            </button>
                            <button class="friend-button invite" data-id="${friend.friend_id}">
                                <i class="fas fa-gamepad"></i> Invite
                            </button>
                        </div>
                    </div>
                `;
            }
            friendsGrid.innerHTML = friendsHTML;
            const messageButtons = this.element?.querySelectorAll('.friend-button.message');
            messageButtons?.forEach(button => {
                button.addEventListener('click', () => {
                    const friend = button.getAttribute('data-id');
                    this.router.navigate(`/chat/${friend}`);
                });
            });
            
            const inviteButtons = this.element?.querySelectorAll('.friend-button.invite');
            inviteButtons?.forEach(button => {
                button.addEventListener('click', async () => {
                    const friendId = button.getAttribute('data-id');
                    const friend = await getUserById(Number(friendId));
                    if (friend) {
                        NotificationManager.show({
                            title: 'Game Invitation',
                            message: `Invitation sent to ${friend.display_name}`,
                            type: 'success',
                            duration: 3000
                        });
                    }
                });
            });
        } catch (error) {
            console.error("Error loading friends:", error);
            const friendsGrid = this.element?.querySelector('#friends-grid');
            if (friendsGrid) {
                friendsGrid.innerHTML = '<div class="error">Error loading friends list. Please try again later.</div>';
            }
        }
    }

    private async loadFriendRequests(): Promise<void> {
        try {
            const currentUser = await getUserById(this.currentUserId);
            const requestsList = this.element?.querySelector('#requests-list');
            const requestCount = this.element?.querySelector('#request-count');
            
            if (!requestsList || !currentUser) return;
            
            const pendingRequests = await getIncomingFriendRequests(this.currentUserId);

            
            // Update request count
            if (requestCount) {
                requestCount.textContent = pendingRequests.length > 0 ? `(${pendingRequests.length})` : '';
            }
            
            if (pendingRequests.length === 0) {
                requestsList.innerHTML = '<p class="chat-welcome">You don\'t have any friend requests.</p>';
                return;
            }
            
            let requestsHTML = '';
            
            // Process each request
            for (const request of pendingRequests) {
                const fromUser = await getUserById(request.from_user_id);
                if (!fromUser) continue;
                
                requestsHTML += `
                    <div class="request-card">
                        <img src="${fromUser.avatar_url || 'https://placehold.co/50x50/1d1f21/ffffff?text=' + fromUser.display_name.charAt(0)}" 
                            alt="${fromUser.display_name}" class="request-avatar">
                        <div class="request-info">
                            <h4>${fromUser.display_name}</h4>
                            <p class="request-date">Requested ${request.date}</p>
                        </div>
                        <div class="request-actions">
                            <button class="request-button accept app-button" data-id="${request.id}" data-user-id="${fromUser.id}">
                                Accept
                            </button>
                            <button class="request-button reject app-button danger" data-id="${request.id}" data-user-id="${fromUser.id}">
                                Reject
                            </button>
                        </div>
                    </div>
                        </div>
                    </div>
                `;
            }
            
            requestsList.innerHTML = requestsHTML;
            
            // Add event listeners for accept/reject buttons
            const acceptButtons = this.element?.querySelectorAll('.request-button.accept');
            acceptButtons?.forEach(button => {
                button.addEventListener('click', async () => {
                    const requestId = Number(button.getAttribute('data-id'));
                    const userId = Number(button.getAttribute('data-user-id'));
                    
                    try {
                        // Accept friend request
                        const success = await acceptFriendRequest(this.currentUserId, requestId);
                        
                        if (success) {
                            NotificationManager.show({
                                title: 'Friend Request Accepted',
                                message: 'You are now friends!',
                                type: 'success',
                                duration: 3000
                            });
                            
                            // Reload both friend lists
                            await this.loadFriends();
                            await this.loadFriendRequests();
                        }
                    } catch (error) {
                        console.error("Error accepting friend request:", error);
                        NotificationManager.show({
                            title: 'Error',
                            message: 'Failed to accept friend request',
                            type: 'error',
                            duration: 3000
                        });
                    }
                });
            });
            
            const rejectButtons = this.element?.querySelectorAll('.request-button.reject');
            rejectButtons?.forEach(button => {
                button.addEventListener('click', async () => {
                    const requestId = Number(button.getAttribute('data-id'));
                    const userId = Number(button.getAttribute('data-user-id'));
                    
                    try {
                        // Reject friend request
                        const success = await rejectFriendRequest(this.currentUserId, requestId);
                        
                        if (success) {
                            const requestCard = button.closest('.request-card');
                            if (requestCard) {
                                requestCard.remove();
                                
                                NotificationManager.show({
                                    title: 'Friend Request Rejected',
                                    message: 'The friend request has been rejected.',
                                    type: 'info',
                                    duration: 3000
                                });
                            
                                // Reload both friend lists
                                await this.loadFriends();
                                await this.loadFriendRequests();
                            }
                        }
                    } catch (error) {
                        console.error("Error rejecting friend request:", error);
                        NotificationManager.show({
                            title: 'Error',
                            message: 'Failed to reject friend request',
                            type: 'error',
                            duration: 3000
                        });
                    }
                });
            });
        } catch (error) {
            console.error("Error loading friend requests:", error);
            const requestsList = this.element?.querySelector('#requests-list');
            if (requestsList) {
                requestsList.innerHTML = '<div class="error">Error loading friend requests. Please try again later.</div>';
            }
        }
    }

    private async searchUsers(searchTerm: string): Promise<void> {
        const searchResults = this.element?.querySelector('#search-results-container');
        if (!searchResults) return;
        
        // Show loading state
        searchResults.innerHTML = '<div class="loading-spinner">Searching...</div>';
        
        try {
            // Use API to search for user
            const user = await Auth.findUserByUsername(searchTerm);
            
            if (!user || user.id === this.currentUserId) {
                searchResults.innerHTML = '<p class="chat-welcome">No users found matching your search.</p>';
                return;
            }
            
            // Get current user's friends
            const friends = await getFriendsList(this.currentUserId);
            const isFriend = friends.some(friend => friend.friend_id === user.id);
            
            // Get pending requests
            let incomingRequests = await getIncomingFriendRequests(this.currentUserId);
            let outgoingRequests = await getOutgoingFriendRequests(this.currentUserId);
            const isPending = incomingRequests.some(r => r.from_user_id === user.id) || outgoingRequests.some(r => r.to_user_id === user.id);

            // Generate search result HTML
            const resultHTML = `
                <div class="search-result-card">
                    <img src="${user.avatar_url || 'https://placehold.co/50x50/1d1f21/ffffff?text=' + user.display_name.charAt(0)}" 
                        alt="${user.display_name}" class="search-result-avatar">
                    <div class="search-result-info">
                        <h4>${user.display_name}</h4>
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
            
            searchResults.innerHTML = resultHTML;
            
            // Add event listeners to add friend buttons
            const addFriendButtons = this.element?.querySelectorAll('.friend-button.add');
            addFriendButtons?.forEach(button => {
                button.addEventListener('click', async () => {
                    const userId = Number(button.getAttribute('data-id'));
                    
                    try {
                        // Send API friend request
                        const success = await sendFriendRequest(this.currentUserId, userId);
                        
                        if (success) {
                            // Update button to show pending
                            const actionsDiv = button.parentElement;
                            if (actionsDiv) {
                                actionsDiv.innerHTML = '<span class="pending-badge"><i class="fas fa-clock"></i> Pending</span>';
                            }
                            
                            const user = await getUserById(userId);
                            
                            NotificationManager.show({
                                title: 'Friend Request Sent',
                                message: `Friend request sent to ${user?.display_name}`,
                                type: 'success',
                                duration: 3000
                            });
                        }
                    } catch (error) {
                        console.error("Error sending friend request:", error);
                        NotificationManager.show({
                            title: 'Error',
                            message: 'Failed to send friend request',
                            type: 'error',
                            duration: 3000
                        });
                    }
                    // reload friend requests to update request count display
                    this.loadFriendRequests();
                });
            });
        } catch (error) {
            console.error("Error searching for users:", error);
            searchResults.innerHTML = '<div class="error">Error searching for users. Please try again later.</div>';
        }
    }

    destroy(): void {
        this.element = null;
    }
}
