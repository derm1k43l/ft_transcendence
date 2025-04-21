import { Router } from '../core/router.js';
import { getUserById, updateUserProfile } from '../data/UserService.js';
import { NotificationManager } from '../components/Notification.js';

export class ProfileView {
    private element: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = 1; // default logged-in user
    private profileUserId: number;

    constructor(router: Router, userId?: string) {
        this.router = router;
        
        // If userId is provided as a string parameter from the router, convert it to number
        // Otherwise view the current user's profile
        this.profileUserId = userId ? parseInt(userId) : this.currentUserId;
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
                        `<button class="app-button" id="profile-edit-btn">
                            <i class="fas fa-edit"></i> Edit Profile
                        </button>` : 
                        `<button class="app-button" id="add-friend-btn">
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
                                <i class="fas fa-medal"></i>
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
        </div>
        `;
        
        rootElement.appendChild(this.element);

        // Setup event listeners
        this.setupEventListeners(isOwnProfile, user);
    }
        
    private setupEventListeners(isOwnProfile: boolean, user: any): void {
        if (!this.element) return;
        
        if (isOwnProfile) {
            // Edit profile button
            const editBtn = this.element.querySelector('#profile-edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.showEditProfileModal(user);
                });
            }
        } else {
            // Add friend button for other users' profiles
            const addFriendBtn = this.element.querySelector('#add-friend-btn');
            addFriendBtn?.addEventListener('click', () => {
                // In a real app, this would send a friend request
                // For now, just show a notification
                NotificationManager.show({
                    title: 'Friend Request Sent',
                    message: `A friend request has been sent to ${user.displayName}.`,
                    type: 'success',
                    duration: 3000
                });
            });
        }
        
        // Load more matches button
        const loadMoreBtn = this.element.querySelector('#load-more-matches');
        loadMoreBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadMoreMatches(user);
        });
    }
    
    private loadMoreMatches(user: any): void {
        if (!this.element) return;
        
        const matchList = this.element.querySelector('#match-list');
        const loadMoreBtn = this.element.querySelector('#load-more-matches');
        
        if (!matchList || !loadMoreBtn) return;
        
        // Get current number of matches displayed
        const currentMatchCount = matchList.querySelectorAll('.activity-item').length;
        
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
        `).join('');
        
        // Append to the match list
        matchList.insertAdjacentHTML('beforeend', matchesHTML);
        
        // Disable button if no more matches
        if (currentMatchCount + nextMatches.length >= user.matchHistory.length) {
            loadMoreBtn.textContent = 'No More Matches';
            loadMoreBtn.setAttribute('disabled', 'true');
        }
    }
    
    // Modal for editing profile including cover photo
    private showEditProfileModal(user: any): void {
        if (!this.element) return;
        
        // Create modal if it doesn't exist yet
        let modal = document.getElementById('profile-edit-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'profile-edit-modal';
            modal.className = 'modal';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Profile</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="profile-edit-form">
                            <!-- Cover Photo -->
                            <div class="cover-upload-container">
                                <div class="cover-preview" style="background-image: url('${user.coverPhotoUrl || 'https://placehold.co/1200x300/7c00e3/ffffff?text=Cover+Photo'}');">
                                    <div class="cover-overlay">
                                        <label for="cover-upload" class="upload-btn">
                                            <i class="fas fa-camera"></i> Change Cover
                                        </label>
                                    </div>
                                </div>
                                <input type="file" id="cover-upload" accept="image/*" style="display:none;">
                            </div>
                            
                            <!-- Avatar -->
                            <div class="avatar-upload-container">
                                <img src="${user.avatarUrl || 'https://placehold.co/150x150/1d1f21/ffffff?text=User'}" alt="${user.displayName}" class="edit-avatar-preview">
                                <div class="avatar-overlay">
                                    <label for="avatar-upload" class="upload-btn">
                                        <i class="fas fa-camera"></i>
                                    </label>
                                </div>
                                <input type="file" id="avatar-upload" accept="image/*" style="display:none;">
                            </div>
                            
                            <!-- User Info -->
                            <div class="form-group">
                                <label for="displayName">Display Name</label>
                                <input type="text" id="displayName" name="displayName" value="${user.displayName}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="bio">Bio</label>
                                <textarea id="bio" name="bio" rows="4">${user.bio || ''}</textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="app-button secondary" id="cancel-edit">Cancel</button>
                                <button type="submit" class="app-button" id="save-profile">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
        
        // Show modal
        modal.style.display = 'flex';
        
        // Get form elements
        const form = document.getElementById('profile-edit-form') as HTMLFormElement;
        const coverUpload = document.getElementById('cover-upload') as HTMLInputElement;
        const avatarUpload = document.getElementById('avatar-upload') as HTMLInputElement;
        const coverPreview = modal.querySelector('.cover-preview') as HTMLElement;
        const avatarPreview = modal.querySelector('.edit-avatar-preview') as HTMLImageElement;
        const closeButton = modal.querySelector('.modal-close') as HTMLButtonElement;
        const cancelButton = document.getElementById('cancel-edit') as HTMLButtonElement;
        
        // Handle file uploads for preview
        coverUpload?.addEventListener('change', function(e) {
            const fileInput = e.target as HTMLInputElement;
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (coverPreview && e.target) {
                        coverPreview.style.backgroundImage = `url(${e.target.result})`;
                    }
                };
                reader.readAsDataURL(fileInput.files[0]);
            }
        });
        
        avatarUpload?.addEventListener('change', function(e) {
            const fileInput = e.target as HTMLInputElement;
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (avatarPreview && e.target) {
                        avatarPreview.src = e.target.result as string;
                    }
                };
                reader.readAsDataURL(fileInput.files[0]);
            }
        });
        
        // Handle form submission
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const displayName = (document.getElementById('displayName') as HTMLInputElement).value;
            const bio = (document.getElementById('bio') as HTMLTextAreaElement).value;
            
            // In a real app, you would upload the files to a server and then update the user profile with the URLs
            
            // For demo purposes, we'll create object URLs from the files
            let avatarUrl = user.avatarUrl;
            let coverPhotoUrl = user.coverPhotoUrl;
            
            if (avatarUpload.files && avatarUpload.files[0]) {
                avatarUrl = URL.createObjectURL(avatarUpload.files[0]);
            }
            
            if (coverUpload.files && coverUpload.files[0]) {
                coverPhotoUrl = URL.createObjectURL(coverUpload.files[0]);
            }
            
            // Update the user profile
            const updatedProfile = {
                displayName,
                bio,
                avatarUrl,
                coverPhotoUrl
            };
            
            // Call your update service
            updateUserProfile(user.id, updatedProfile);
            
            // Show notification
            NotificationManager.show({
                title: 'Profile Updated',
                message: 'Your profile has been updated successfully.',
                type: 'success',
                duration: 3000
            });
            
            // Close modal
            modal!.style.display = 'none';
            
            if (modal) {
                modal.style.display = 'none';
            } else {
                console.error('Modal element is null');
            }
        });
        
        // Close modal when clicking the close button
        closeButton?.addEventListener('click', () => {
            modal!.style.display = 'none';
        });
        
        // Close modal when clicking the cancel button
        cancelButton?.addEventListener('click', () => {
            modal!.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal!.style.display = 'none';
            }
        });
    }

    destroy(): void {
        this.element = null;
    }
}