import { Router } from '../core/router.js';
import { Listener, addListener, removeListener, removeListeners } from '../services/listener.js';
import { getUserById, updateUserProfile, setAchievements, setMatchHistory, setUserStats, uploadAvatar, uploadCover, getFriendsList, getFriendStatus } from '../services/UserService.js';
import { UserProfile } from '../types/index.js';
import { NotificationManager } from '../components/Notification.js';
import { currentUser} from '../main.js';
import { DEFAULT_ACHIEVEMENTS } from '../constants/defaults.js';
import { applyTranslations } from './Translate.js';

export class ProfileView {
    private element: HTMLElement | null = null;
    private modal: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = currentUser?.id || -1;
    private profileUserId: number;

    private boundListeners: Listener[] = [];
    private addListener(l: Listener) { addListener(l, this.boundListeners); }
    private removeListeners() { removeListeners(this.boundListeners); this.boundListeners = []; }



    constructor(router: Router, userId?: string) {
        console.log("--- CONSTRUCTING PROFILE VIEW ---");
        this.router = router;
        this.profileUserId = userId ? parseInt(userId) : this.currentUserId;
    }

    async render(rootElement: HTMLElement): Promise<void> {
        try {
            this.element = document.createElement('div');
            this.element.className = 'profile-view';
            
            // Show loading state
            this.element.innerHTML = '<div class="loading-spinner">Loading profile...</div>';
            rootElement.appendChild(this.element);

            const user: UserProfile | null = await getUserById(this.profileUserId);
            
            
            if (!this.element) return;
            if (!user) {
                this.element.innerHTML = '<div class="profile-error"><h2>User Not Found</h2><p>The requested profile could not be found.</p></div>';
                return;
            }



            // user.match_history = await setMatchHistory(user);
            // user.achievements = await setAchievements(user);
            // user.stats = await setUserStats(user);
            if (!this.element || !user.stats) return;

            // Check if viewing own profile
            const isOwnProfile = this.profileUserId === this.currentUserId;
            const isFriend = await getFriendStatus(this.currentUserId, this.profileUserId);

            this.element.innerHTML = `
            <div class="profile-view">
                <div class="profile-header">
                    <div class="profile-cover" style="background-image: url('${user.cover_photo_url || 'https://placehold.co/1200x300/7c00e3/ffffff?text=User+Profile'}');">
                        <div class="profile-avatar-container">
                            <img src="${user.avatar_url || 'https://placehold.co/150x150/1d1f21/ffffff?text=User'}" alt="${user.display_name}" class="profile-avatar">
                        </div>
                    </div>
                    <div class="profile-info">
                        <div class="profile-info-main">
                            <h2 data-i18n="userName">${user.display_name}</h2>
                            <p class="username">@${user.username}</p>
                            <p class="bio" ${user.bio ? `` : `data-i18n="bioEmpty"`}>${user.bio || 'No bio yet'}</p>
                            <div class="profile-meta">
                                <span><i class="fas fa-calendar-alt"></i> <span data-i18n="memberSince">Member since:</span> ${user.join_date || 'Unknown'}</span>
                                <span><i class="fas fa-envelope"></i>    <span data-i18n="emailText">${user.email || 'No email provided'}</span></span>
                            </div>
                        </div>
                        ${isOwnProfile ? 
                            `<button class="app-button" id="profile-edit-btn">
                                <i class="fas fa-edit"></i> <span data-i18n="editProfile">Edit Profile</span>
                            </button>` :
                            `${isFriend?
                                `` : `<button class="app-button" id="add-friend-btn">
                                    <i class="fas fa-user-plus"></i> <span data-i18n="addFriend">Add Friend</span>
                                </button>`
                            }`
                        }
                    </div>
                </div>
                
                <div class="profile-content dashboard-content">
                    <!-- Player Stats (left column) -->
                    <div class="quick-stats card" style="grid-column: span 6;">
                        <div class="quick-stats-grid">
                            <div class="quick-stat">
                                <div class="stat-icon rank" style="color: ${
                                        user.stats.rank === 'Bronze'  ? `#cd7f32` : `` +
                                        user.stats.rank === 'Silver'  ? `#dadada` : `` +
                                        user.stats.rank === 'Gold'    ? `#f3a50f` : `` +
                                        user.stats.rank === 'Diamond' ? `#1eb8dc` : ``
                                    }; background-color: ${
                                        user.stats.rank === 'Bronze'  ? `#cd7f3233` : `` +
                                        user.stats.rank === 'Silver'  ? `#dadada33` : `` +
                                        user.stats.rank === 'Gold'    ? `#f3a50f33` : `` +
                                        user.stats.rank === 'Diamond' ? `#1eb8dc33` : ``
                                    }"
                                    >
                                    <i class="fas fa-medal"></i>
                                </div>
                                <div class="stat-info">
                                    <h4 data-i18n="rank">Rank</h4>
                                    <div class="stat-value">${user.stats?.rank || '-'}</div>
                                </div>
                            </div>
                            <div class="quick-stat">
                                <div class="stat-icon level">
                                    <i class="fas fa-level-up-alt"></i>
                                </div>
                                <div class="stat-info">
                                    <h4 data-i18n="level">Level</h4>
                                    <div class="stat-value">${user.stats?.level || 1}</div>
                                </div>
                            </div>
                            <div class="quick-stat">
                                <div class="stat-icon games">
                                    <i class="fas fa-gamepad"></i>
                                </div>
                                <div class="stat-info">
                                    <h4 data-i18n="games">Games</h4>
                                    <div class="stat-value">${user.stats.played}</div>
                                </div>
                            </div>
                            <div class="quick-stat">
                                <div class="stat-icon winrate">
                                    <i class="fas fa-percentage"></i>
                                </div>
                                <div class="stat-info">
                                    <h4 data-i18n="winRate">Win Rate</h4>
                                    <div class="stat-value">${user.stats.winrate}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Achievements (right column) -->
                    <div class="profile-achievements card" style="grid-column: span 6;">
                        <div class="card-header">
                            <h3 data-i18n="achievements">Achievements</h3>
                            <div class="card-actions">
                                <span class="progress-text">
                                    ${user.achievements ? 
                                        `${user.achievements.filter(a => a.completed).length} / ${DEFAULT_ACHIEVEMENTS.length}` : `0 / ${DEFAULT_ACHIEVEMENTS.length}`}
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
                                            <h4 data-i18n="achievementName">${achievement.name}</h4>
                                            <p data-i18n="achievementDesc">${achievement.description}</p>
                                            ${achievement.dateCompleted ? 
                                                `<small data-i18n="completedOn">Completed on ${achievement.dateCompleted}</small>` : ''}
                                        </div>
                                        <div class="achievement-status ${achievement.completed ? 'completed' : 'incomplete'}">
                                            <i class="fas ${achievement.completed ? 'fa-check-circle' : 'fa-clock'}"></i>
                                        </div>
                                    </div>
                                `).join('') :
                                '<p class="no-achievements" data-i18n="noAchievements">No achievements yet</p>'
                            }
                        </div>
                    </div>
                    
                    <!-- Match History (full width below) -->
                    <div class="profile-match-history card recent-activity" style="grid-column: span 12;">
                        <div class="card-header">
                            <h3 data-i18n="matchHistory">Match History</h3>
                        </div>
                        <div class="activity-list" id="match-list">
                            ${user.match_history && user.match_history.length > 0 ? 
                                user.match_history.slice(0, 5).map(match => `
                                    <div class="activity-item ${match.result}">
                                        <div class="activity-icon">
                                            <i class="fas fa-${match.result === 'win' ? 'trophy' : 'times'}"></i>
                                        </div>
                                        <div class="activity-details">
                                            <div class="activity-primary">
                                                <span class="game-result" data-i18n="gameResult">${match.result === 'win' ? 'Won' : 'Lost'} against ${match.opponent_name}</span>
                                                <span class="game-score">${match.score}</span>
                                            </div>
                                            <div class="activity-meta">
                                                <span class="game-date">${match.date}</span>
                                                ${match.game_mode ? `<span class="game-mode">${match.game_mode}</span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : 
                                '<p class="no-activity" data-i18n="noMatches">No matches played yet</p>'
                            }
                        </div>
                        ${user.match_history && user.match_history.length > 5 ? 
                            `<a href="#" class="view-all-link" id="load-more-matches" data-i18n="loadMoreMatches">Load More Matches</a>` : ''}
                    </div>
                </div>
            </div>
            `;
        applyTranslations(window.currentLanguage || "english");
        // Setup event listeners
        this.setupEventListeners(isOwnProfile, user);
        } catch (error) {
            console.error("Error rendering profile:", error);
            if (this.element)
                this.element.innerHTML = '<div class="profile-error"><h2>Error Loading Profile</h2><p>There was an error loading this profile. Please try again later.</p></div>';
        }
    }

    private async sendFriendRequest(user: UserProfile) {
        try {
            // Import dynamically to avoid circular dependencies
            const { sendFriendRequest } = await import('../services/UserService.js');
            
            const success = await sendFriendRequest(this.currentUserId, this.profileUserId);
            
            if (success) {
                NotificationManager.show({
                    title: 'Friend Request Sent',
                    message: `A friend request has been sent to ${user.display_name}.`,
                    type: 'success',
                    duration: 3000
                });
                
                // Update button to show pending
                const addFriendButton = this.element?.querySelector('#add-friend-btn');
                if (addFriendButton) {
                    addFriendButton.innerHTML = '<i class="fas fa-clock"></i> Request Pending';
                    addFriendButton.setAttribute('disabled', 'true');
                }
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
    }

    private setupEventListeners(isOwnProfile: boolean, user: any): void {
        if (!this.element) return;
        
        if (isOwnProfile) {
            this.addListener({
                element: this.element.querySelector('#profile-edit-btn'),
                event: 'click',
                handler: () => { this.showEditProfileModal(user); }
            });
        } else {
            this.addListener({
                element: this.element.querySelector('#add-friend-btn'),
                event: 'click',
                handler: () => { this.sendFriendRequest(user); }
            });
        }

        this.addListener({
            element: this.element.querySelector('#load-more-matches'),
            event: 'click',
            handler: (e) => { e.preventDefault(); this.loadMoreMatches(user); }
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
        const nextMatches = user.match_history.slice(currentMatchCount, currentMatchCount + 5);
        
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
                        <span class="game-result">${match.result === 'win' ? 'Won' : 'Lost'} against ${match.opponent_name}</span>
                        <span class="game-score">${match.score}</span>
                    </div>
                    <div class="activity-meta">
                        <span class="game-date">${match.date}</span>
                        ${match.game_mode ? `<span class="game-mode">${match.game_mode}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Append to the match list
        matchList.insertAdjacentHTML('beforeend', matchesHTML);
        
        // Disable button if no more matches
        if (currentMatchCount + nextMatches.length >= user.match_history.length) {
            loadMoreBtn.textContent = 'No More Matches';
            loadMoreBtn.setAttribute('disabled', 'true');
        }
    }

    private initEditProfileModal(user: any): void {
        console.log("INIT MODAL");
        this.modal = document.createElement('div');
        this.modal.id = 'profile-edit-modal';
        this.modal.className = 'modal';
        
        this.modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Profile</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="profile-edit-form">
                        <!-- Cover Photo -->
                        <div class="cover-upload-container">
                            <div class="cover-preview" style="background-image: url('${user.cover_photo_url || 'https://placehold.co/1200x300/7c00e3/ffffff?text=Cover+Photo'}');">
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
                            <img src="${user.avatar_url || 'https://placehold.co/150x150/1d1f21/ffffff?text=User'}" alt="${user.display_name}" class="edit-avatar-preview">
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
                            <input type="text" id="displayName" name="displayName" value="${user.display_name}" required>
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
        document.body.appendChild(this.modal);

        // set up modal event listeners only once

        // Get form elements
        const form = document.getElementById('profile-edit-form') as HTMLFormElement;
        const coverUpload = document.getElementById('cover-upload') as HTMLInputElement;
        const avatarUpload = document.getElementById('avatar-upload') as HTMLInputElement;
        const coverPreview = this.modal.querySelector('.cover-preview') as HTMLElement;
        const avatarPreview = this.modal.querySelector('.edit-avatar-preview') as HTMLImageElement;
        const closeButton = this.modal.querySelector('.modal-close') as HTMLButtonElement;
        const cancelButton = document.getElementById('cancel-edit') as HTMLButtonElement;

        if (coverUpload)
            console.log(' add listener: coverUpload');
        else
            console.log('not exist: coverUpload');
        this.addListener({
            element: coverUpload,
            event: 'change',
            handler: async (e) => {
                const fileInput = e.target as HTMLInputElement;
                if (!fileInput.files || !fileInput.files[0]) return;
                const file = fileInput?.files[0];
                const url = await uploadCover(user.id, file);
                document.querySelector('.cover-preview')?.setAttribute('style', `background-image: url(${url})`);
                document.querySelector('.profile-cover')?.setAttribute('style', `background-image: url(${url})`); console.log('called listener: coverUpload');
            }
        });

        if (avatarUpload)
            console.log(' add listener: avatarUpload');
        else
            console.log('not exist: avatarUpload');
        this.addListener({
            element: avatarUpload,
            event: 'change',
            handler: async (e) => {
                const fileInput = e.target as HTMLInputElement;
                if (!fileInput.files || !fileInput.files[0]) return;
                const file = fileInput.files[0];
                const url = await uploadAvatar(user.id, file);
                document.querySelector('.avatar')?.setAttribute('src', url);
                document.querySelector('.profile-avatar')?.setAttribute('src', url);
                document.querySelector('.edit-avatar-preview')?.setAttribute('src', url); console.log('called listener: avatarUpload');
            }
        });

        if (form)
            console.log(' add listener: form');
        else
            console.log('not exist: form');
        this.addListener({
            element: form,
            event: 'submit',
            handler: async (e) => {
                e.preventDefault();
                const saveButton = form.querySelector('#save-profile');
                if (saveButton) {
                    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                    saveButton.setAttribute('disabled', 'true');
                }

                const displayName = (document.getElementById('displayName') as HTMLInputElement).value;
                const bio = (document.getElementById('bio') as HTMLTextAreaElement).value;
                if (await updateUserProfile(user.id, { display_name: displayName, bio: bio })) {
                    NotificationManager.show({
                        title: 'Profile Updated',
                        message: 'Your profile has been updated successfully.',
                        type: 'success',
                        duration: 3000
                    });
                    if (this.modal) this.modal.style.display = 'none';
                    // this.router.reload();
                    const bioElement = document.querySelector('.bio')!;
                    bioElement.innerHTML = bio ? bio : 'No bio yet';
                    if (bio)
                        bioElement.removeAttribute('data-i18n');
                    else
                        bioElement.setAttribute('data-i18n', 'bioEmpty');
                    document.querySelector('.user-profile > .username')!.innerHTML = displayName;
                    document.querySelector('.profile-info-main > h2')!.innerHTML = displayName;
                    applyTranslations(window.currentLanguage || "english");
                } else {
                    NotificationManager.show({
                        title: 'Error',
                        message: 'Failed to update profile. Please try again.',
                        type: 'error',
                        duration: 3000
                    });
                }

                if (saveButton) {
                    saveButton.innerHTML = 'Save Changes';
                    saveButton.removeAttribute('disabled');
                }
             console.log('called listener: form');}
        });

        if (closeButton)
            console.log(' add listener: closeButton');
        else
            console.log('not exist: closeButton');
        this.addListener({
            element: closeButton,
            event: 'click',
            handler: async () => {this.modal!.style.display = 'none'; console.log('called listener: closeButton');}
        });

        if (cancelButton)
            console.log(' add listener: cancelButton');
        else
            console.log('not exist: cancelButton');
        this.addListener({
            element: cancelButton,
            event: 'click',
            handler: async () => {this.modal!.style.display = 'none'; console.log('called listener: cancelButton');}
        });

        if (window)
            console.log(' add listener: window');
        else
            console.log('not exist: window');
        this.addListener({
            element: window,
            event: 'click',
            handler: async (e) => {if (e.target === this.modal) {this.modal!.style.display = 'none'; console.log('called listener: window');}}
        });
    }

    // Modal for editing profile
    private showEditProfileModal(user: any): void {
        if (!this.element) return;
        // let modal = document.getElementById('profile-edit-modal'); // Select modal
        if (!this.modal) { this.initEditProfileModal(user); } // Create modal if it doesn't exist yet
        if (this.modal) this.modal.style.display = 'flex'; // Show modal

        document.querySelector('.cover-preview')?.setAttribute('style', `background-image: url(${user.cover_photo_url})`);
        document.querySelector('.edit-avatar-preview')?.setAttribute('src', user.avatar_url);
        // (document.getElementById('displayName') as HTMLTextAreaElement).value = user.displayName;
        const nameBox = document.getElementById('displayName') as HTMLInputElement;
        const bioBox = document.getElementById('bio') as HTMLTextAreaElement;
        if (nameBox) nameBox.value = user.display_name;
        if (bioBox) bioBox.value = user.bio ? user.bio : '';
    }

    destroy(): void {
        console.log("--- DESTROYING PROFILE VIEW ---");
        this.removeListeners();
        this.modal?.remove();
        this.modal = null;
        this.element?.remove();
        this.element = null;
    }
}
