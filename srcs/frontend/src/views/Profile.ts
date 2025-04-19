import { Router } from '../core/router.js';
import { getUserById, getRankIcon, getRankTitle} from '../data/UserService.js';
import { NotificationManager } from '../components/Notification.js';

export class ProfileView {
    private element: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = 1; // get real one
    private profileUserId: number;

    // we need wil deccide later if id or user
    constructor(router: Router, userId?: number) {
        this.router = router;
        // If userId is provided, view that user's profile
        // Otherwise view the current user's profile
        this.profileUserId = userId || this.currentUserId;
    }

    render(rootElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.className = 'profile-view';
    
        const user = getUserById(this.profileUserId);
        if (!user) {
            this.element.innerHTML = '<div class="profile-error"><h2>User Not Found</h2><p>The requested profile could not be found.</p></div>';
            rootElement.appendChild(this.element);
            return;
        }

        // Check if viewing own profile
        const isOwnProfile = this.profileUserId === this.currentUserId;

        // Calculate stats
        const totalGames = (user.stats?.wins || 0) + (user.stats?.losses || 0);
        const winRate = totalGames > 0 ? ((user.stats?.wins || 0) / totalGames * 100) : 0;
    
        this.element.innerHTML = `
        <div class="profile-view">
            <div class="profile-header">
                <div class="profile-cover" style="background-image: url('${user.coverPhotoUrl || 'https://placehold.co/1200x300/7c00e3/ffffff?text=User+Profile'}');">
                    <div class="profile-avatar-container">
                        <img src="${user.avatarUrl || 'https://placehold.co/150x150/1d1f21/ffffff?text=User'}" alt="${user.displayName}" class="profile-avatar">
                    </div>
                </div>
                <div class="profile-info">
                    <div class="profile-info-main">
                        <h2>${user.displayName}</h2>
                        <p class="username">@${user.username}</p>
                        <p class="bio">${user.bio || 'No bio yet'}</p>
                        <div class="profile-meta">
                            <span><i class="fas fa-calendar-alt"></i> Member since: ${user.joinDate || 'Unknown'}</span>
                            <span><i class="fas fa-envelope"></i> ${user.email || 'No email provided'}</span>
                        </div>
                    </div>
                    ${isOwnProfile ? 
                        `<button class="profile-edit-button" id="profile-edit-btn">
                            <i class="fas fa-edit"></i> Edit Profile
                        </button>` : 
                        `<button class="profile-friend-button" id="add-friend-btn">
                            <i class="fas fa-user-plus"></i> Add Friend
                        </button>`
                    }
                </div>
            </div>
            
            <div class="profile-content dashboard-content">
                <!-- Player Stats (left column) -->
                <div class="quick-stats card" style="grid-column: span 6;">
                    <div class="quick-stats-grid">
                        <div class="quick-stat">
                            <div class="stat-icon rank">
                                ${getRankIcon(user.stats?.rank || '-')}
                            </div>
                            <div class="stat-info">
                                <h4>Rank</h4>
                                <div class="stat-value">${user.stats?.rank || '-'}</div>
                            </div>
                        </div>
                        <div class="quick-stat">
                            <div class="stat-icon level">
                                <i class="fas fa-level-up-alt"></i>
                            </div>
                            <div class="stat-info">
                                <h4>Level</h4>
                                <div class="stat-value">${user.stats?.level || 1}</div>
                            </div>
                        </div>
                        <div class="quick-stat">
                            <div class="stat-icon games">
                                <i class="fas fa-gamepad"></i>
                            </div>
                            <div class="stat-info">
                                <h4>Games</h4>
                                <div class="stat-value">${totalGames}</div>
                            </div>
                        </div>
                        <div class="quick-stat">
                            <div class="stat-icon winrate">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="stat-info">
                                <h4>Win Rate</h4>
                                <div class="stat-value">${winRate.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Achievements (right column) -->
                <div class="profile-achievements card" style="grid-column: span 6;">
                    <div class="card-header">
                        <h3>Achievements</h3>
                        <div class="card-actions">
                            <span class="progress-text">
                                ${user.achievements ? 
                                    `${user.achievements.filter(a => a.completed).length} / ${user.achievements.length}` : '0 / 0'}
                            </span>
                        </div>
                    </div>
                    <div class="achievements-grid">
                        ${user.achievements && user.achievements.length > 0 ? 
                            user.achievements.map(achievement => `
                                <div class="achievement-item ${achievement.completed ? 'completed' : 'incomplete'}">
                                    <div class="achievement-icon">
                                        <i class="${achievement.icon}"></i>
                                    </div>
                                    <div class="achievement-info">
                                        <h4>${achievement.name}</h4>
                                        <p>${achievement.description}</p>
                                        ${achievement.dateCompleted ? 
                                            `<small>Completed on ${achievement.dateCompleted}</small>` : ''}
                                    </div>
                                    <div class="achievement-status ${achievement.completed ? 'completed' : 'incomplete'}">
                                        <i class="fas ${achievement.completed ? 'fa-check-circle' : 'fa-clock'}"></i>
                                    </div>
                                </div>
                            `).join('') :
                            '<p class="no-achievements">No achievements yet</p>'
                        }
                    </div>
                </div>
                
                <!-- Match History (full width below) -->
                <div class="profile-match-history card recent-activity" style="grid-column: span 12;">
                    <div class="card-header">
                        <h3>Match History</h3>
                    </div>
                    <div class="activity-list" id="match-list">
                        ${user.matchHistory && user.matchHistory.length > 0 ? 
                            user.matchHistory.slice(0, 5).map(match => `
                                <div class="activity-item ${match.result}">
                                    <div class="activity-icon">
                                        <i class="fas fa-${match.result === 'win' ? 'trophy' : 'times'}"></i>
                                    </div>
                                    <div class="activity-details">
                                        <div class="activity-primary">
                                            <span class="game-result">vs ${match.opponent}</span>
                                            <span class="game-score">${match.score}</span>
                                        </div>
                                        <div class="activity-meta">
                                            <span class="game-date">${match.date}</span>
                                            ${match.gameMode ? `<span class="game-mode">${match.gameMode}</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('') : 
                            '<p class="no-activity">No matches played yet</p>'
                        }
                    </div>
                    ${user.matchHistory && user.matchHistory.length > 5 ? 
                        `<a href="#" class="view-all-link" id="load-more-matches">Load More Matches</a>` : ''}
                </div>
            </div>
            
            ${isOwnProfile ? `
                <!-- Edit Profile Modal -->
                <div class="profile-modal" id="profile-edit-modal">
                    <div class="profile-modal-content">
                        <div class="profile-modal-header">
                            <h3>Edit Profile</h3>
                            <button class="profile-modal-close" id="profile-modal-close">&times;</button>
                        </div>
                        <div class="profile-modal-body">
                            <div class="profile-avatar-edit">
                                <img src="${user.avatarUrl || 'https://placehold.co/150x150/1d1f21/ffffff?text=User'}" alt="Profile Avatar" class="profile-avatar-preview">
                                <button class="app-button">Change Avatar</button>
                            </div>
                            <form class="profile-edit-form">
                                <div class="profile-edit-field">
                                    <label for="display-name">Display Name</label>
                                    <input type="text" id="display-name" value="${user.displayName}">
                                </div>
                                <div class="profile-edit-field">
                                    <label for="bio">Bio</label>
                                    <textarea id="bio">${user.bio || ''}</textarea>
                                </div>
                                <div class="profile-edit-actions">
                                    <button type="button" class="app-button" id="cancel-edit">Cancel</button>
                                    <button type="submit" class="app-button">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
        
        rootElement.appendChild(this.element);

        // Setup event listeners
        this.setupEventListeners(isOwnProfile, user);
    }
        
    private setupEventListeners(isOwnProfile: boolean, user: any): void {
        if (!this.element) return;
        
        if (isOwnProfile) {
            // Setup edit profile
            const editBtn = this.element.querySelector('#profile-edit-btn');
            const modal = this.element.querySelector('#profile-edit-modal');
            const closeBtn = this.element.querySelector('#profile-modal-close');
            const cancelBtn = this.element.querySelector('#cancel-edit');
            
            editBtn?.addEventListener('click', () => {
                modal?.classList.add('active');
            });
            
            closeBtn?.addEventListener('click', () => {
                modal?.classList.remove('active');
            });
            
            cancelBtn?.addEventListener('click', () => {
                modal?.classList.remove('active');
            });
            
            // Close modal when clicking outside
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        } else {
            // Add friend button for other users' profiles
            const addFriendBtn = this.element.querySelector('#add-friend-btn');
            addFriendBtn?.addEventListener('click', () => {
                // In a real app, this would send a friend request
                // For now, just show a notification
                console.log('Add friend clicked');
                // Use NotificationManager if available
                if (typeof NotificationManager !== 'undefined') {
                    (window as any).NotificationManager.show({
                        title: 'Friend Request Sent',
                        message: `A friend request has been sent to ${user.displayName}.`,
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    alert(`Friend request sent to ${user.displayName}`);
                }
            });
        }
        
        // Load more matches button
        const loadMoreBtn = this.element.querySelector('#load-more-matches');
        loadMoreBtn?.addEventListener('click', () => {
            this.loadMoreMatches(user);
        });
    }
    
    private loadMoreMatches(user: any): void {
        if (!this.element) return;
        
        const matchList = this.element.querySelector('#match-list');
        const loadMoreBtn = this.element.querySelector('#load-more-matches');
        
        if (!matchList || !loadMoreBtn) return;
        
        // Get current number of matches displayed
        const currentMatchCount = matchList.querySelectorAll('.match-item').length;
        
        // Get next batch of matches (5 more)
        const nextMatches = user.matchHistory.slice(currentMatchCount, currentMatchCount + 5);
        
        if (nextMatches.length === 0) {
            // No more matches to display
            loadMoreBtn.textContent = 'No More Matches';
            loadMoreBtn.setAttribute('disabled', 'true');
            return;
        }
        
        // Create matches HTML
        const matchesHTML = nextMatches.map((match: any) => `
            <div class="match-item ${match.result}">
                <div class="match-opponent">
                    <span class="match-result-indicator"></span>
                    <span>vs ${match.opponent}</span>
                </div>
                <div class="match-details">
                    <div class="match-score">${match.score}</div>
                    <div class="match-date">${match.date}</div>
                    ${match.gameMode ? `<div class="match-mode">${match.gameMode}</div>` : ''}
                </div>
            </div>
        `).join('');
        
        // Append to the match list
        matchList.insertAdjacentHTML('beforeend', matchesHTML);
        
        // Disable button if no more matches
        if (currentMatchCount + nextMatches.length >= user.matchHistory.length) {
            loadMoreBtn.textContent = 'No More Matches';
            loadMoreBtn.setAttribute('disabled', 'true');
        }
    }

    destroy(): void {
        this.element = null;
    }
}