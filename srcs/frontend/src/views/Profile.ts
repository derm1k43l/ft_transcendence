import { Router } from '../core/router.js';
import { getUserById } from '../data/UserService.js';

export class ProfileView {
    private element: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = 1; // get real one

    constructor(router: Router) {
        this.router = router;
    }

    render(rootElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.className = 'profile-view';
    
        const user = getUserById(this.currentUserId);
        if (!user) {
            this.element.innerHTML = '<p>User not found</p>';
            rootElement.appendChild(this.element);
            return;
        }
    
        this.element.innerHTML = `
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
                        <p class="member-since">Member since: ${user.joinDate || 'Unknown'}</p>
                    </div>
                    <button class="profile-edit-button" id="profile-edit-btn">
                        <i class="fas fa-edit"></i> Edit Profile
                    </button>
                </div>
            </div>
            
            <div class="profile-content">
                <div class="profile-stats card">
                    <h3>Player Stats</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${user.stats?.wins || 0}</div>
                            <div class="stat-label">Wins</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${user.stats?.losses || 0}</div>
                            <div class="stat-label">Losses</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${((user.stats?.wins || 0) / ((user.stats?.wins || 0) + (user.stats?.losses || 0)) * 100 || 0).toFixed(1)}%</div>
                            <div class="stat-label">Win Rate</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${user.stats?.rank || '-'}</div>
                            <div class="stat-label">Ranking</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${user.stats?.level || 1}</div>
                            <div class="stat-label">Level</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${((user.stats?.wins || 0) + (user.stats?.losses || 0))}</div>
                            <div class="stat-label">Total Games</div>
                        </div>
                    </div>
                </div>
                
                <div class="profile-match-history card">
                    <h3>Recent Matches</h3>
                    <div class="match-list">
                        ${user.matchHistory && user.matchHistory.length > 0 ? 
                            user.matchHistory.map(match => `
                                <div class="match-item ${match.result}">
                                    <div class="match-opponent">
                                        <span class="match-result-indicator"></span>
                                        <span>vs ${match.opponent}</span>
                                    </div>
                                    <div class="match-score">${match.score}</div>
                                    <div class="match-date">${match.date}</div>
                                </div>
                            `).join('') : 
                            '<p>No matches played yet</p>'
                        }
                    </div>
                </div>
                
                <div class="profile-achievements card">
                    <h3>Achievements</h3>
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
                            '<p>No achievements yet</p>'
                        }
                    </div>
                </div>
            </div>
            
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
        `;
    
        rootElement.appendChild(this.element);
        
        // Set up event listeners for edit profile
        const editBtn = this.element.querySelector('#profile-edit-btn');
        const modal = this.element.querySelector('#profile-edit-modal');
        const closeBtn = this.element.querySelector('#profile-modal-close');
        const cancelBtn = this.element.querySelector('#cancel-edit');
        
        // will add logic for real change here
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
    }

    destroy(): void {
        this.element = null;
    }
}