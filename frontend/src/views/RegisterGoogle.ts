import { Router } from '../core/router.js';
import { findUserByUsername, findUserByEmail, createUser } from '../data/UserService.js';
import { NotificationManager } from '../components/Notification.js';

export class RegisterView {
    private element: HTMLElement | null = null;
    private router: Router;
    private email: string;

    constructor(router: Router, email: string) {
        this.router = router;
        this.email = email;
    }

    render(rootElement: HTMLElement): void {
        this.element = document.createElement('div');
        this.element.classList.add('register-view');
        this.element.innerHTML = `
            <h2>Create Your Account</h2>
            <form id="register-form" class="auth-form">
                <div class="form-group">
                    <label for="register-username">Username</label>
                    <input type="text" id="register-username" name="username" required>
                    <small class="form-hint">This will be your login name and must be unique</small>
                </div>
                
                <div class="form-group">
                    <label for="register-display-name">Display Name</label>
                    <input type="text" id="register-display-name" name="displayName" required>
                    <small class="form-hint">This is how others will see you in tournaments</small>
                </div>
                
                <div id="register-error" class="error-message"></div>
                <button type="submit" class="button login-button">Create Account</button>
            </form>
            <div class="auth-alternate">
                <p>Already have an account? <a href="#" id="back-to-login">Login here</a></p>
            </div>
        `;

        rootElement.appendChild(this.element);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        if (!this.element) return;
    
        const registerForm = this.element.querySelector('#register-form');
        registerForm?.addEventListener('submit', (e) => this.handleRegister(e));

        const backToLoginLink = this.element.querySelector('#back-to-login');
        backToLoginLink?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#/';
        });
    }
    
    private handleRegister(event: Event): void {
        event.preventDefault();
        
        // Get form elements
        const usernameInput = document.getElementById('register-username') as HTMLInputElement;
        const displayNameInput = document.getElementById('register-display-name') as HTMLInputElement;
        const confirmInput = document.getElementById('register-confirm') as HTMLInputElement;
        const errorElement = document.getElementById('register-error');
        
        // Get values
        const username = usernameInput.value.trim();
        const displayName = displayNameInput.value.trim() || username;

        
        const existingUser = findUserByUsername(username);
        if (existingUser) {
            if (errorElement) {
                errorElement.textContent = "Username already exists";
                errorElement.style.display = 'block';
            }
            return;
        }

        const newUser = createUser({
            username,
            email: this.email,
            displayName
        });

        console.log("User registered:", newUser);
        
        NotificationManager.show({
            title: 'Registration Successful',
            message: 'Your account has been created. You can login.',
            type: 'success',
            duration: 5000
        });
        
        window.location.hash = '#/';
    }

    destroy(): void {
        this.element = null;
    }
}