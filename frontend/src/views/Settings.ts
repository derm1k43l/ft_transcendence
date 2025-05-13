import { Router } from '../core/router.js';
import { 
    getUserById, 
    getUserGameSettings, 
    updateUserGameSettings, 
    updateUserProfile, 
    resetUserStats,
} from '../services/UserService.js';
import { NotificationManager } from '../components/Notification.js';
import { GameSettings } from '../types/index.js';
import { currentUser } from '../main.js';
import * as Auth from '../services/auth.js';

export class SettingsView {
    private element: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = 1; // get session
    private gameSettings: GameSettings = {
        boardColor: "#000000",
        paddleColor: "#FFFFFF",
        ballColor: "#FFFFFF",
        scoreColor: "#FFFFFF"
    };
    
    constructor(router: Router) {
        this.router = router;
        // Initialize with default settings, will be replaced with actual settings when loaded
    }

    async render(rootElement: HTMLElement): Promise<void> {
        this.element = document.createElement('div');
        this.element.className = 'settings-view';
        
        // Show loading state
        this.element.innerHTML = '<div class="loading-spinner">Loading settings...</div>';
        rootElement.appendChild(this.element);
        
        try {
            // Load user and game settings in parallel
            const [user, gameSettings] = await Promise.all([
                getUserById(this.currentUserId),
                getUserGameSettings(this.currentUserId)
            ]);
            
            if (!user) {
                this.element.innerHTML = '<div class="error">User not found</div>';
                return;
            }
            
            // Store game settings for later use
            this.gameSettings = gameSettings || this.gameSettings;
    
            this.element.innerHTML = `
                <div class="settings-header">
                    <h2>Settings</h2>
                    <p>Customize your experience and manage account settings</p>
                </div>
                
                <div class="settings-container">
                    <div class="settings-sidebar">
                        <ul class="settings-nav">
                            <li><a href="#account" class="active">Account Settings</a></li>
                            <li><a href="#security">Security & Privacy</a></li>
                            <li><a href="#game">Game Preferences</a></li>
                            <li><a href="#notifications">Notifications</a></li>
                        </ul>
                    </div>
                    
                    <div class="settings-content">
                        <!-- Account Settings Panel -->
                        <div id="account" class="settings-panel active">
                            <h3>Account Settings</h3>
                            
                            <div class="settings-section">
                                <h4>Account Information</h4>
                                <form id="profile-form" class="settings-form">
                                    <div class="form-group">
                                        <label for="settings-username">Username</label>
                                        <input type="text" id="settings-username" value="${user.username}" disabled>
                                        <small>Username cannot be changed</small>
                                    </div>
                                    <div class="form-group">
                                        <label for="settings-displayname">Display Name</label>
                                        <input type="text" id="settings-displayname" value="${user.display_name}">
                                    </div>
                                    <div class="form-group">
                                        <label for="settings-bio">Bio</label>
                                        <textarea id="settings-bio" rows="3">${user.bio || ''}</textarea>
                                    </div>
                                    <button type="submit" class="app-button">Save Changes</button>
                                </form>
                            </div>
                            
                            <div class="settings-section danger-zone">
                                <h4>Account Management</h4>
                                <div class="danger-action">
                                    <div>
                                        <h5>Reset Account Stats</h5>
                                        <p>This will reset all your game statistics and achievements. This action cannot be undone.</p>
                                    </div>
                                    <button class="app-button danger" id="reset-stats-btn">Reset Stats</button>
                                </div>
                                <div class="danger-action">
                                    <div>
                                        <h5>Delete Account</h5>
                                        <p>This will permanently delete your account and all associated data. This action cannot be undone.</p>
                                    </div>
                                    <button class="app-button danger" id="delete-account-btn">Delete Account</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Security Panel -->
                        <div id="security" class="settings-panel">
                            <h3>Security & Privacy</h3>

                            <div class="settings-section">
                                <h4>Email Address</h4>
                                <form id="email-form" class="settings-form">
                                    <div class="form-group">
                                        <label for="settings-email">Email</label>
                                        <input type="email" id="settings-email" value="${user.email || ''}">
                                        <small>Your email is used for important account notifications and security features</small>
                                    </div>
                                    <button type="submit" class="app-button">Update Email</button>
                                </form>
                            </div>
                            
                            <div class="settings-section">
                                <h4>Password</h4>
                                <form id="password-form" class="settings-form">
                                    <div class="form-group">
                                        <label for="current-password">Current Password</label>
                                        <input type="password" id="current-password" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="new-password">New Password</label>
                                        <input type="password" id="new-password" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="confirm-password">Confirm New Password</label>
                                        <input type="password" id="confirm-password" required>
                                    </div>
                                    <button type="submit" class="app-button">Change Password</button>
                                </form>
                            </div>
                            
                            <div class="settings-section">
                                <h4>Two-Factor Authentication</h4>
                                <div class="toggle-setting">
                                    <div>
                                        <h5>Email Authentication</h5>
                                        <p>Receive a verification code via email when logging in from a new device.</p>
                                    </div>
                                    <label class="toggle">
                                        <input type="checkbox" id="email-2fa" ${user.has_two_factor_auth ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                
                                <div id="verification-code-container" style="display: none; margin-top: 1rem;">
                                    <p>We've sent a verification code to <strong>${user.email || 'your email'}</strong></p>
                                    <div class="verification-code-input">
                                        <input type="text" id="verification-code" maxlength="6" placeholder="Enter 6-digit code">
                                        <button type="button" class="app-button" id="verify-code-btn">Verify</button>
                                    </div>
                                    <div class="verification-options">
                                        <small>The code will expire in 10 minutes</small>
                                        <button type="button" class="text-button" id="resend-code-btn">Resend code</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h4>Privacy</h4>
                                <div class="toggle-setting">
                                    <div>
                                        <h5>Show Online Status</h5>
                                        <p>Allow other users to see when you are online.</p>
                                    </div>
                                    <label class="toggle">
                                        <input type="checkbox" id="show-online" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="toggle-setting">
                                    <div>
                                        <h5>Show Game History</h5>
                                        <p>Allow other users to view your game history.</p>
                                    </div>
                                    <label class="toggle">
                                        <input type="checkbox" id="show-history" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Game Preferences Panel -->
                        <div id="game" class="settings-panel">
                            <h3>Game Preferences</h3>
                            
                            <div class="settings-section">
                                <h4>Visual Settings</h4>
                                <div class="settings-form">
                                    <div class="form-group color-picker">
                                        <label for="board-color">Board Color</label>
                                        <div class="color-preview">
                                            <input type="color" id="board-color" value="${this.gameSettings.boardColor}">
                                            <span class="color-value">${this.gameSettings.boardColor}</span>
                                        </div>
                                    </div>
                                    <div class="form-group color-picker">
                                        <label for="paddle-color">Paddle Color</label>
                                        <div class="color-preview">
                                            <input type="color" id="paddle-color" value="${this.gameSettings.paddleColor}">
                                            <span class="color-value">${this.gameSettings.paddleColor}</span>
                                        </div>
                                    </div>
                                    <div class="form-group color-picker">
                                        <label for="ball-color">Ball Color</label>
                                        <div class="color-preview">
                                            <input type="color" id="ball-color" value="${this.gameSettings.ballColor}">
                                            <span class="color-value">${this.gameSettings.ballColor}</span>
                                        </div>
                                    </div>
                                    <div class="form-group color-picker">
                                        <label for="score-color">Score Color</label>
                                        <div class="color-preview">
                                            <input type="color" id="score-color" value="${this.gameSettings.scoreColor}">
                                            <span class="color-value">${this.gameSettings.scoreColor}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="game-preview">
                                        <h5>Preview</h5>
                                        <div class="game-preview-container" id="game-preview">
                                            <!-- Game preview will be rendered here -->
                                        </div>
                                    </div>
                                    
                                    <button type="button" class="app-button" id="save-game-settings">Save Game Settings</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Notifications Panel -->
                        <div id="notifications" class="settings-panel">
                            <h3>Notifications</h3>
                            
                            <div class="settings-section">
                                <h4>Notification Preferences</h4>
                                <div class="toggle-setting">
                                    <div>
                                        <h5>Game Invites</h5>
                                        <p>Receive notifications when someone invites you to play a game.</p>
                                    </div>
                                    <label class="toggle">
                                        <input type="checkbox" id="notify-invites" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="toggle-setting">
                                    <div>
                                        <h5>Friend Requests</h5>
                                        <p>Receive notifications for new friend requests.</p>
                                    </div>
                                    <label class="toggle">
                                        <input type="checkbox" id="notify-friends" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="toggle-setting">
                                    <div>
                                        <h5>Tournament Updates</h5>
                                        <p>Receive notifications about tournament schedules and results.</p>
                                    </div>
                                    <label class="toggle">
                                        <input type="checkbox" id="notify-tournaments" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <button type="button" class="app-button" id="save-notification-settings">Save Notification Settings</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Confirmation Modal -->
                <div class="settings-modal" id="confirm-modal">
                    <div class="settings-modal-content">
                        <div class="settings-modal-header">
                            <h3 id="confirm-modal-title">Confirmation</h3>
                            <button class="settings-modal-close">&times;</button>
                        </div>
                        <div class="settings-modal-body">
                            <p id="confirm-modal-message">Are you sure you want to proceed?</p>
                        </div>
                        <div class="settings-modal-footer">
                            <button class="app-button" id="confirm-modal-cancel">Cancel</button>
                            <button class="app-button danger" id="confirm-modal-confirm">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Set up event listeners
            this.setupEventListeners();
            this.renderGamePreview();
        } catch (error) {
            console.error("Error rendering settings:", error);
            this.element.innerHTML = '<div class="error">Failed to load settings. Please try again later.</div>';
        }
    }
    
    private setupEventListeners(): void {
        if (!this.element) return;
        
        // Tab navigation
        const navLinks = this.element.querySelectorAll('.settings-nav a');
        const panels = this.element.querySelectorAll('.settings-panel');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href')?.substring(1);
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Show target panel, hide others
                panels.forEach(panel => {
                    if (panel.id === targetId) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
            });
        });
        
        // Email form submission
        const emailForm = this.element.querySelector('#email-form');
        emailForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = this.element?.querySelector('#settings-email') as HTMLInputElement;
            const email = emailInput?.value;
            
            if (!email || !email.includes('@')) {
                NotificationManager.show({
                    title: 'Invalid Email',
                    message: 'Please enter a valid email address.',
                    type: 'error',
                    duration: 3000
                });
                return;
            }
            
            try {
                // API call to update email
                await updateUserProfile(this.currentUserId, { email });
                
                NotificationManager.show({
                    title: 'Email Updated',
                    message: 'Your email address has been updated successfully.',
                    type: 'success',
                    duration: 3000
                });
            } catch (error) {
                console.error("Error updating email:", error);
                NotificationManager.show({
                    title: 'Update Failed',
                    message: 'Failed to update email. Please try again.',
                    type: 'error',
                    duration: 3000
                });
            }
        });
        
        // Profile form submission
        const profileForm = this.element.querySelector('#profile-form');
        profileForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const displayName = (this.element?.querySelector('#settings-displayname') as HTMLInputElement)?.value;
            const bio = (this.element?.querySelector('#settings-bio') as HTMLTextAreaElement)?.value;
            
            try {
                // API call to update profile
                await updateUserProfile(this.currentUserId, { 
                    display_name: displayName,
                    bio
                });
                
                NotificationManager.show({
                    title: 'Profile Updated',
                    message: 'Your profile information has been updated successfully.',
                    type: 'success',
                    duration: 3000
                });
            } catch (error) {
                console.error("Error updating profile:", error);
                NotificationManager.show({
                    title: 'Update Failed', 
                    message: 'Failed to update profile. Please try again.',
                    type: 'error',
                    duration: 3000
                });
            }
        });
        
        // Password form submission
        const passwordForm = this.element.querySelector('#password-form');
        passwordForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = (this.element?.querySelector('#current-password') as HTMLInputElement)?.value;
            const newPassword = (this.element?.querySelector('#new-password') as HTMLInputElement)?.value;
            const confirmPassword = (this.element?.querySelector('#confirm-password') as HTMLInputElement)?.value;
            
            if (newPassword !== confirmPassword) {
                NotificationManager.show({
                    title: 'Password Error',
                    message: 'New passwords do not match.',
                    type: 'error',
                    duration: 3000
                });
                return;
            }
            
            try {
                // API call to update password
                const success = await Auth.updateUserPassword(this.currentUserId, currentPassword, newPassword);
                
                if (success) {
                    NotificationManager.show({
                        title: 'Password Updated',
                        message: 'Your password has been changed successfully.',
                        type: 'success',
                        duration: 3000
                    });
                    
                    // Clear form
                    (passwordForm as HTMLFormElement).reset();
                } else {
                    throw new Error('Password update failed');
                }
            } catch (error) {
                console.error("Error updating password:", error);
                NotificationManager.show({
                    title: 'Password Error',
                    message: 'Failed to update password. Current password may be incorrect.',
                    type: 'error',
                    duration: 3000
                });
            }
        });
        
        // 2FA toggle and verification
        const email2faToggle = this.element.querySelector('#email-2fa') as HTMLInputElement;
        const verificationCodeContainer = this.element.querySelector('#verification-code-container') as HTMLElement;
        
        // Handle 2FA toggle change
        email2faToggle?.addEventListener('change', async () => {
            try {
                if (email2faToggle.checked) {
                    // Get user to check if they have an email
                    const user = await getUserById(this.currentUserId);
                    if (!user?.email) {
                        NotificationManager.show({
                            title: 'Email Required',
                            message: 'Please add an email address first.',
                            type: 'warning',
                            duration: 3000
                        });
                        email2faToggle.checked = false;
                        return;
                    }
                    
                    // Show verification container
                    verificationCodeContainer.style.display = 'block';
                    
                    // API call to send verification code would go here
                    // For now, just show notification
                    NotificationManager.show({
                        title: 'Verification Code Sent',
                        message: 'A verification code has been sent to your email.',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    // If unchecking, hide verification container and disable 2FA
                    verificationCodeContainer.style.display = 'none';
                    
                    // Update user setting
                    await updateUserProfile(this.currentUserId, { has_two_factor_auth: false });
                    
                    NotificationManager.show({
                        title: '2FA Disabled',
                        message: 'Two-factor authentication has been disabled.',
                        type: 'info',
                        duration: 3000
                    });
                }
            } catch (error) {
                console.error("Error with 2FA toggle:", error);
                NotificationManager.show({
                    title: 'Error',
                    message: 'Failed to update 2FA settings.',
                    type: 'error',
                    duration: 3000
                });
                email2faToggle.checked = !email2faToggle.checked; // Revert the toggle
            }
        });
        
        // Verification code submit button
        const verifyCodeBtn = this.element.querySelector('#verify-code-btn');
        verifyCodeBtn?.addEventListener('click', async () => {
            const codeInput = this.element?.querySelector('#verification-code') as HTMLInputElement;
            const code = codeInput?.value;
            
            if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
                NotificationManager.show({
                    title: 'Invalid Code',
                    message: 'Please enter a valid 6-digit code.',
                    type: 'error',
                    duration: 3000
                });
                return;
            }
            
            try {
                // For demo purposes, consider "123456" as the valid code
                // In real app, you'd call an API to verify the code
                if (code === "123456") {
                    // Update user with 2FA enabled
                    await updateUserProfile(this.currentUserId, { has_two_factor_auth: true });
                    
                    // Hide verification container
                    verificationCodeContainer.style.display = 'none';
                    
                    NotificationManager.show({
                        title: '2FA Enabled',
                        message: 'Two-factor authentication has been successfully enabled.',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    NotificationManager.show({
                        title: 'Invalid Code',
                        message: 'The verification code you entered is invalid. Please try again.',
                        type: 'error',
                        duration: 3000
                    });
                }
            } catch (error) {
                console.error("Error verifying 2FA code:", error);
                NotificationManager.show({
                    title: 'Error',
                    message: 'Failed to verify code. Please try again.',
                    type: 'error',
                    duration: 3000
                });
            }
        });
        
        // Color pickers with value display
        const colorPickers = this.element.querySelectorAll('input[type="color"]');
        colorPickers.forEach(picker => {
            picker.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const valueDisplay = target.parentElement?.querySelector('.color-value');
                if (valueDisplay) {
                    valueDisplay.textContent = target.value;
                }
                
                this.updateGameSettings();
                this.renderGamePreview();
            });
        });
        
        // Save game settings
        const saveGameSettingsBtn = this.element.querySelector('#save-game-settings');
        saveGameSettingsBtn?.addEventListener('click', async () => {
            await this.saveGameSettings();
        });
        
        // Save notification settings
        const saveNotificationSettingsBtn = this.element.querySelector('#save-notification-settings');
        saveNotificationSettingsBtn?.addEventListener('click', async () => {
            try {
                const gameInvites = (this.element?.querySelector('#notify-invites') as HTMLInputElement)?.checked;
                const friendRequests = (this.element?.querySelector('#notify-friends') as HTMLInputElement)?.checked;
                const tournamentUpdates = (this.element?.querySelector('#notify-tournaments') as HTMLInputElement)?.checked;
                
                // In a real app, you'd update the user preferences
                // This is just a placeholder showing the intent
                await updateUserProfile(this.currentUserId, {
                    // notification_preferences: {
                    //     game_invites: gameInvites,
                    //     friend_requests: friendRequests,
                    //     tournament_updates: tournamentUpdates
                    // }
                });
                
                NotificationManager.show({
                    title: 'Settings Saved',
                    message: 'Your notification preferences have been saved.',
                    type: 'success',
                    duration: 3000
                });
            } catch (error) {
                console.error("Error saving notification settings:", error);
                NotificationManager.show({
                    title: 'Error',
                    message: 'Failed to save notification settings.',
                    type: 'error',
                    duration: 3000
                });
            }
        });
        
        // Danger zone buttons
        const resetStatsBtn = this.element.querySelector('#reset-stats-btn');
        resetStatsBtn?.addEventListener('click', () => {
            this.showConfirmModal(
                'Reset Stats', 
                'This will reset all your game statistics and achievements. This action cannot be undone. Are you sure?',
                async () => {
                    try {
                        const success = await resetUserStats(this.currentUserId);
                        
                        if (success) {
                            NotificationManager.show({
                                title: 'Stats Reset',
                                message: 'Your game statistics have been reset.',
                                type: 'success',
                                duration: 3000
                            });
                        } else {
                            throw new Error('Failed to reset stats');
                        }
                    } catch (error) {
                        console.error("Error resetting stats:", error);
                        NotificationManager.show({
                            title: 'Error',
                            message: 'Failed to reset statistics. Please try again.',
                            type: 'error',
                            duration: 3000
                        });
                    }
                }
            );
        });
        
        const deleteAccountBtn = this.element.querySelector('#delete-account-btn');
        deleteAccountBtn?.addEventListener('click', () => {
            this.showConfirmModal(
                'Delete Account', 
                'This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?',
                async () => {
                    try {
                        const userId = currentUser?.id || -1;

                        if (!userId) {
                            throw new Error("User not logged in or user ID not available.");
                        }

                        const numericUserId = Number(userId);
                        if (isNaN(numericUserId)) {
                        throw new Error("User ID is not a valid number.");
                        }

                        const result = await Auth.deleteUserAccount(numericUserId);
                        if (!result) {
                            throw new Error("Failed to delete account.");
                        }

                        NotificationManager.show({
                            title: 'Account Deleted',
                            message: 'Your account has been deleted.',
                            type: 'success',
                            duration: 3000
                        });
                        
                        // Add small delay before redirect
                        setTimeout(() => {
                            // Redirect to login
                            window.location.hash = '';
                        }, 1500);
                    } catch (error) {
                        console.error("Error deleting account:", error);
                        NotificationManager.show({
                            title: 'Error',
                            message: 'Failed to delete account. Please try again.',
                            type: 'error',
                            duration: 3000
                        });
                    }
                }
            );
        });
        
        // Confirmation modal
        const confirmModalClose = this.element.querySelector('#confirm-modal .settings-modal-close');
        const confirmModalCancel = this.element.querySelector('#confirm-modal-cancel');
        const confirmModal = this.element.querySelector('#confirm-modal');
        
        [confirmModalClose, confirmModalCancel].forEach(btn => {
            btn?.addEventListener('click', () => {
                confirmModal?.classList.remove('active');
            });
        });
        
        // Close modal when clicking outside
        confirmModal?.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.classList.remove('active');
            }
        });
    }
    
    private updateGameSettings(): void {
        if (!this.element) return;
        
        const boardColor = (this.element.querySelector('#board-color') as HTMLInputElement)?.value;
        const paddleColor = (this.element.querySelector('#paddle-color') as HTMLInputElement)?.value;
        const ballColor = (this.element.querySelector('#ball-color') as HTMLInputElement)?.value;
        const scoreColor = (this.element.querySelector('#score-color') as HTMLInputElement)?.value;
        
        this.gameSettings = {
            boardColor: boardColor || '#000000',
            paddleColor: paddleColor || '#FFFFFF',
            ballColor: ballColor || '#FFFFFF',
            scoreColor: scoreColor || '#FFFFFF',
        };
    }
    
    private async saveGameSettings(): Promise<void> {
        try {
            // Save to user's settings in the database 
            const success = await updateUserGameSettings(this.currentUserId, this.gameSettings);
            
            if (success) {
                NotificationManager.show({
                    title: 'Settings Saved',
                    message: 'Your game preferences have been saved.',
                    type: 'success',
                    duration: 3000
                });
            } else {
                throw new Error("Failed to save game settings");
            }
        } catch (error) {
            console.error("Error saving game settings:", error);
            NotificationManager.show({
                title: 'Error',
                message: 'Failed to save game settings. Please try again.',
                type: 'error',
                duration: 3000
            });
        }
    }
    
    private renderGamePreview(): void {
        if (!this.element) return;
        
        const previewContainer = this.element.querySelector('#game-preview');
        if (!previewContainer) return;
        
        // Create a canvas for preview
        previewContainer.innerHTML = '';
    
        // Create a canvas for preview with proper sizing
        const canvas = document.createElement('canvas');

        // Set the canvas dimensions to match the container
        const containerWidth = previewContainer.clientWidth;
        canvas.width = containerWidth;
        canvas.height = Math.min(containerWidth * 0.66, 300);

        previewContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Draw game board
        ctx.fillStyle = this.gameSettings.boardColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw center line
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        
        // Draw paddles
        ctx.fillStyle = this.gameSettings.paddleColor;
        // Left paddle
        ctx.fillRect(10, (canvas.height / 2) - 25, 10, 50);
        // Right paddle
        ctx.fillRect(canvas.width - 20, (canvas.height / 2) - 25, 10, 50);
        
        // Draw ball
        ctx.fillStyle = this.gameSettings.ballColor;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw scores
        ctx.fillStyle = this.gameSettings.scoreColor;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('3', (canvas.width / 2) - 40, 30);
        ctx.fillText('2', (canvas.width / 2) + 40, 30);
    }
    
    private showConfirmModal(title: string, message: string, onConfirm: () => void): void {
        if (!this.element) return;
        
        const modal = this.element.querySelector('#confirm-modal');
        const titleElement = this.element.querySelector('#confirm-modal-title');
        const messageElement = this.element.querySelector('#confirm-modal-message');
        const confirmButton = this.element.querySelector('#confirm-modal-confirm');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        
        // Remove existing event listeners
        const newConfirmButton = confirmButton?.cloneNode(true);
        if (confirmButton?.parentNode && newConfirmButton) {
            confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
            
            // Add new event listener
            newConfirmButton.addEventListener('click', () => {
                onConfirm();
                modal?.classList.remove('active');
            });
        }
        
        // Show modal
        modal?.classList.add('active');
    }

    destroy(): void {
        this.element = null;
    }
}