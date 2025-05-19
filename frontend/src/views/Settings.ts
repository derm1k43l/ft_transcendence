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
import { DEFAULT_ACHIEVEMENTS, DEFAULT_GAME_SETTINGS } from '../constants/defaults.js';

export class SettingsView {
    private element: HTMLElement | null = null;
    private router: Router;
    private currentUserId: number = currentUser?.id || -1;
    private gameSettings: GameSettings = DEFAULT_GAME_SETTINGS;

    constructor(router: Router) {
        this.router = router;
        // Initialize with default settings, will be replaced with actual settings when loaded
    }

    async render(rootElement: HTMLElement): Promise<void> {
        this.element = document.createElement('div');
        this.element.className = 'settings-view';
        this.gameSettings = await getUserGameSettings(this.currentUserId);
        
        // Show loading state
        if (!this.element)
            return;
        this.element.innerHTML = '<div class="loading-spinner">Loading settings...</div>';
        rootElement.appendChild(this.element);
        
        try {
            const user = await Auth.getCurrentUser();
            // const user = currentUser;
            if (!user) {
                this.element.innerHTML = '<div class="error">User not found</div>';
                return;
            }
            await this.updateGameSettings();
    
            this.element.innerHTML = `
                <div class="settings-header">
                    <h2>Settings</h2>
                    <p>Customize your experience and manage account settings</p>
                </div>
                
                <div class="settings-container">
                    <div class="settings-sidebar">
                        <ul class="settings-nav">
                            <li><a href="#game" class="active">Game Preferences</a></li>
                            <li><a href="#security">Security & Privacy</a></li>
                        </ul>
                    </div>
                    
                    <div class="settings-content">
                        
                        <!-- Game Preferences Panel -->
                        <div id="game" class="settings-panel active">
                            <h3>Game Preferences</h3>
                            
                            <div class="settings-section">
                                <h4>Visual Settings</h4>
                                <div class="settings-form">
                                    <div class="form-group color-picker">
                                        <label for="board-color">Board Color</label>
                                        <div class="color-preview">
                                            <input type="color" id="board-color" value="${this.gameSettings.board_color}">
                                            <span class="color-value">${this.gameSettings.board_color}</span>
                                        </div>
                                    </div>
                                    <div class="form-group color-picker">
                                        <label for="paddle-color">Paddle Color</label>
                                        <div class="color-preview">
                                            <input type="color" id="paddle-color" value="${this.gameSettings.paddle_color}">
                                            <span class="color-value">${this.gameSettings.paddle_color}</span>
                                        </div>
                                    </div>
                                    <div class="form-group color-picker">
                                        <label for="ball-color">Ball Color</label>
                                        <div class="color-preview">
                                            <input type="color" id="ball-color" value="${this.gameSettings.ball_color}">
                                            <span class="color-value">${this.gameSettings.ball_color}</span>
                                        </div>
                                    </div>
                                    <div class="form-group color-picker">
                                        <label for="score-color">Score Color</label>
                                        <div class="color-preview">
                                            <input type="color" id="score-color" value="${this.gameSettings.score_color}">
                                            <span class="color-value">${this.gameSettings.score_color}</span>
                                        </div>
                                    </div>
                                    <div class="toggle-setting">
                                        <div>
                                            <h5>Power-Up</h5>
                                        </div>
                                        <label class="toggle">
                                            <input type="checkbox" id="powerup" ${this.gameSettings.powerup ? 'checked' : ''}>
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div class="keybind-hint">
                                        <span class="key">D</span> (Left Player)
                                        <br>
                                        <br>
                                        <span class="key">←</span> (Right Player)
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
                                        <small class="form-hint">Use at least 8 characters</small>
                                    </div>
                                    <div class="form-group">
                                        <label for="confirm-password">Confirm New Password</label>
                                        <input type="password" id="confirm-password" required>
                                    </div>
                                    <button type="submit" class="app-button">Change Password</button>
                                </form>
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
            await this.updateGameSettings();
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
            link.addEventListener('click', async (e) => {
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
                await this.updateGameSettings();
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
        
        // Password form submission
        const passwordForm = this.element.querySelector('#password-form');
        passwordForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const oldPassword = (this.element?.querySelector('#current-password') as HTMLInputElement)?.value;
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
            if (newPassword.length < 8) {
                NotificationManager.show({
                    title: 'Password Error',
                    message: 'Password must be at least 8 characters.',
                    type: 'error',
                    duration: 3000
                });
                return;
            }
            
            try {
                // API call to update password
                const success = await Auth.updateUserPassword(this.currentUserId, oldPassword, newPassword);
                
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
        
        // Color pickers with value display
        const colorPickers = this.element.querySelectorAll('input[type="color"]');
        colorPickers.forEach(picker => {
            picker.addEventListener('input', async (e) => {
                const target = e.target as HTMLInputElement;
                const valueDisplay = target.parentElement?.querySelector('.color-value');
                if (valueDisplay) {
                    valueDisplay.textContent = target.value;
                }
                if (!this.element)
                    return;
                this.gameSettings.board_color = (this.element.querySelector('#board-color') as HTMLInputElement)?.value;
                this.gameSettings.paddle_color = (this.element.querySelector('#paddle-color') as HTMLInputElement)?.value;
                this.gameSettings.ball_color = (this.element.querySelector('#ball-color') as HTMLInputElement)?.value;
                this.gameSettings.score_color = (this.element.querySelector('#score-color') as HTMLInputElement)?.value;

                this.renderGamePreview();
            });
        });
        
        // Power-Up checkbox
        const powerUpCheckbox = this.element.querySelector('input[type="checkbox"]') as HTMLInputElement;
        powerUpCheckbox?.addEventListener('input', () => {
            if (!this.element || !powerUpCheckbox)
                return;
            this.gameSettings.powerup = powerUpCheckbox.checked;
        });

        // Save game settings
        const saveGameSettingsBtn = this.element.querySelector('#save-game-settings');
        saveGameSettingsBtn?.addEventListener('click', async () => {
            await this.saveGameSettings();
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
    
    private async updateGameSettings(): Promise<void> {
        if (!this.element) return;
        
        const board_color = (this.element.querySelector('#board-color') as HTMLInputElement)?.value;
        const paddle_color = (this.element.querySelector('#paddle-color') as HTMLInputElement)?.value;
        const ball_color = (this.element.querySelector('#ball-color') as HTMLInputElement)?.value;
        const score_color = (this.element.querySelector('#score-color') as HTMLInputElement)?.value;

        this.renderGamePreview();
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
        ctx.fillStyle = this.gameSettings.board_color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw center line
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        
        // Draw paddles
        ctx.fillStyle = this.gameSettings.paddle_color;
        // Left paddle
        ctx.fillRect(10, (canvas.height / 2) - 25, 10, 50);
        // Right paddle
        ctx.fillRect(canvas.width - 20, (canvas.height / 2) - 25, 10, 50);
        
        // Draw ball
        ctx.fillStyle = this.gameSettings.ball_color;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw scores
        ctx.fillStyle = this.gameSettings.score_color;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('3', (canvas.width / 2) - 40, 30);
        ctx.fillText('2', (canvas.width / 2) + 40, 30);
    }

    destroy(): void {
        this.element?.remove();
        this.element = null;
    }
}
