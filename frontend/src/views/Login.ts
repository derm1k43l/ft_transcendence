import { Router } from '../core/router.js';
import { NotificationManager } from '../components/Notification.js';
import { UserProfile } from '../types/index.js';
import * as Auth from '../services/auth.js';

export class LoginView {
    private element: HTMLElement | null = null;
    private router: Router;
    private onLoginSuccess: (user: UserProfile) => void;

    constructor(router: Router, onLoginSuccess: (user: UserProfile) => void) {
        this.router = router;
        this.onLoginSuccess = onLoginSuccess;
    }

    async render(rootElement: HTMLElement): Promise<void> {
        this.element = document.createElement('div');
        this.element.classList.add('login-view');
        this.element.innerHTML = `
            <form id="login-form" class="auth-form" onsubmit="return false;" method="post">
                <div class="form-group">
                    <label for="login-username">Username</label>
                    <input type="text" id="login-username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" name="password" required>
                </div>
                
                <div id="login-error" class="error-message"></div>
                <button type="submit" class="button login-button">Login</button>
            </form>
            
            <div class="social-login">
                <p>Or login with:</p>
                <div class="social-buttons">
                    <button class="social-button google">
                        <i class="fab fa-google"></i>
                        <span>Google</span>
                    </button>
                </div>
            </div>
            
            <div class="auth-alternate">
                <p>Don't have an account? <a href="#" id="go-to-register">Register here</a></p>
            </div>
        `;

        rootElement.appendChild(this.element);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        if (!this.element) return;
    
        const loginForm = this.element.querySelector('#login-form');
        loginForm?.addEventListener('submit', (e) => this.handleLogin(e));

        const registerLink = this.element.querySelector('#go-to-register');
        registerLink?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#/register';
        });
        const googleButton = this.element.querySelector('.social-button.google');
        googleButton?.addEventListener('click', async () => {
            console.log('Google login button clicked');
            // try {
            //     await Auth.socialLogin('google');
            // } catch (error) {
                NotificationManager.show({
                    title: 'Google Login',
                    message: 'Google login is not implemented yet.',
                    type: 'info',
                    duration: 3000
                });
            // }
        });
    }
    
    private async handleLogin(event: Event): Promise<void> {
        event.preventDefault();
        
        // Get form elements
        const usernameInput = this.element?.querySelector('#login-username') as HTMLInputElement;
        const passwordInput = this.element?.querySelector('#login-password') as HTMLInputElement;
        const errorElement = this.element?.querySelector('#login-error');
        
        if (!usernameInput || !passwordInput) {
            console.error("Login form inputs not found");
            return;
        }
        
        // Get values
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        console.log(`Login attempt with username: "${username}" and password: "${password}"`);
        
        try {
            // Use Auth service for login
            const user = await Auth.login({ username, password });
            if (!user) { window.location.reload(); return; }
            console.log(`Login successful`);

            
            const sidebarAvatar = document.querySelector('.avatar');
            if (sidebarAvatar && user.avatar_url)
                sidebarAvatar.setAttribute('src', user.avatar_url);
            
            
            NotificationManager.show({
                title: 'Welcome',
                message: `Welcome back, ${user.display_name}!`,
                type: 'info',
                duration: 3000
            });
            
            // Call the login success callback
            this.onLoginSuccess(user);
            window.location.hash = '#';
        } catch (error: any) {
            console.log('Login failed:', error);
            
            if (errorElement) {
                (errorElement as HTMLElement).textContent = error || 'Invalid username or password';
                (errorElement as HTMLElement).style.display = 'block';
            }
            
            NotificationManager.show({
                title: 'Login Failed',
                message: error || 'Invalid username or password',
                type: 'error',
                duration: 5000
            });
        }
        passwordInput.value = '';
    }
    destroy(): void {
        this.element = null;
    }
}
