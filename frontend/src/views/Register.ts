import { Router } from '../core/router.js';
import { findUserByUsername, findUserByEmail, createUser } from '../data/UserService.js';
import { NotificationManager } from '../components/Notification.js';
import { UserProfile } from '../data/Types.js';
import { api } from '../services/api.js'

// this only works on localhost. baseURL will have to point to the backend server also when not running on localhost (e.g. accessing through 42 intra on another computer)
// might be easiest to set up a proxy for this purpose to route api request from the browser -> frontend container -> docker network -> backend container

export class RegisterView {
    private element: HTMLElement | null = null;
    private router: Router;

    constructor(router: Router) {
        this.router = router;
    }

    async render(rootElement: HTMLElement): Promise<void> {

        // temporary API test
        const tmp = await api.get('/users/');
        const tmp2 = tmp.data as UserProfile[];
        console.log(tmp2[0].username);
        console.log(tmp2[1].username);



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
                    <label for="register-email">Email Address</label>
                    <input type="email" id="register-email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="register-display-name">Display Name</label>
                    <input type="text" id="register-display-name" name="displayName" required>
                    <small class="form-hint">This is how others will see you in tournaments</small>
                </div>
                
                <div class="form-group">
                    <label for="register-password">Password</label>
                    <input type="password" id="register-password" name="password" required>
                    <small class="form-hint">Use at least 8 characters</small>
                </div>
                
                <div class="form-group">
                    <label for="register-confirm">Confirm Password</label>
                    <input type="password" id="register-confirm" name="confirmPassword" required>
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
        const emailInput = document.getElementById('register-email') as HTMLInputElement;
        const displayNameInput = document.getElementById('register-display-name') as HTMLInputElement;
        const passwordInput = document.getElementById('register-password') as HTMLInputElement;
        const confirmInput = document.getElementById('register-confirm') as HTMLInputElement;
        const errorElement = document.getElementById('register-error');
        
        // Get values
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const displayName = displayNameInput.value.trim() || username;
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        
        // Validation
        if (password !== confirmPassword) {
            if (errorElement) {
                errorElement.textContent = "Passwords don't match";
                errorElement.style.display = 'block';
            }
            return;
        }
        
        if (password.length < 8) {
            if (errorElement) {
                errorElement.textContent = "Password must be at least 8 characters";
                errorElement.style.display = 'block';
            }
            return;
        }
        
        const existingUser = findUserByUsername(username);
        if (existingUser) {
            if (errorElement) {
                errorElement.textContent = "Username already exists";
                errorElement.style.display = 'block';
            }
            return;
        }

        const existingEmail = findUserByEmail(email);
        if (existingEmail) {
            if (errorElement) {
                errorElement.textContent = "Email already registered";
                errorElement.style.display = 'block';
            }
            return;
        }

        const newUser = createUser({
            username,
            email,
            password,
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