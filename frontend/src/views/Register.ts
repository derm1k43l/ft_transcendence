import { Router } from '../core/router.js';
import * as Auth from '../services/auth.js';
import { NotificationManager } from '../components/Notification.js';
import { UserProfile } from '../types/index.js';
import { api } from '../services/api.js'

//temp
import { getUserById } from '../services/UserService.js';


export class RegisterView {
    private element: HTMLElement | null = null;
    private router: Router;

    constructor(router: Router) {
        this.router = router;
    }

    render(rootElement: HTMLElement): void {

        // // temporary API test start
        // console.log('auth token: ', localStorage.getItem('auth_token'));

        // console.log("\n\ncurrent user: ");
        // const tmp1 = await Auth.getCurrentUser();
        // console.log(tmp1);

        // console.log("\n\nall users");
        // const tmp = (await api.get('/users')).data as UserProfile[];
        // for (const user of tmp)
        //     console.log(user);

        // console.log("\n\nuser with name 'user1'");
        // const tmp2 = await Auth.findUserByUsername('user1');
        // console.log(tmp2);

        // console.log("\n\nuser with email 'test@gmail.com'");
        // const tmp3 = await Auth.findUserByEmail('test@gmail.com');
        // console.log(tmp3);

        // console.log("\n\nuser with ID '2'");
        // const tmp4 = await getUserById(1);
        // console.log(tmp4);

        // console.log("\n\nuser with ID '42'");
        // const tmp5 = await getUserById(42);
        // console.log(tmp5);
        // // temporary API test end



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
                    <input type="text" id="register-display-name" name="display_name" required>
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
    
    private async handleRegister(event: Event): Promise<void> {
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
        const display_name = displayNameInput.value.trim() || username;
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        const avatar_url = `https://placehold.co/300x300/1d1f21/ffffff?text=${display_name}`;
        const cover_photo_url = `https://placehold.co/1200x300/7c00e3/ffffff?text=User+Profile`;

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

        try {
            const newUser = await Auth.register({
                username,
                email,
                password,
                display_name,
                avatar_url,
                cover_photo_url,
            });

            console.log("User registered:", newUser);
            
            NotificationManager.show({
                title: 'Registration Successful',
                message: 'Your account has been created. You can login.',
                type: 'success',
                duration: 5000
            });
            
            window.location.hash = '#/';
        } catch(error: any) {
            if (errorElement) {
                errorElement.textContent = error;
                errorElement.style.display = 'block';
            }
            return;
        }
    }

    destroy(): void {
        this.element?.remove();
        this.element = null;
    }
}
