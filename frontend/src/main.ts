import { Router } from './core/router.js';
import { GameView } from './views/Game.js';
import { ProfileView } from './views/Profile.js';
import { ChatView } from './views/Chat.js';
import { FriendsView } from './views/Friends.js';
import { SettingsView } from './views/Settings.js';
import { AboutView } from './views/About.js';
import { TournamentView } from './views/Tournament.js';
import { RegisterView } from './views/Register.js';
import { DashboardView } from './views/Dashboard.js';
import { NotificationManager } from './components/Notification.js';
import { findUserByUsername, getUserById } from './data/UserService.js';
import { UserProfile } from './data/Types.js';
import { GoogleSignIn } from './views/GoogleSignIn.js';

// --- State ---
let isLoggedIn = false;
let currentUser: UserProfile | null = null; // Store logged-in user details

// --- DOM Elements ---
let loginViewElement: HTMLElement | null;
let appViewElement: HTMLElement | null;
let appContentRoot: HTMLElement | null;
let sidebarLinks: NodeListOf<HTMLAnchorElement>;
let logoutButton: HTMLAnchorElement | null;
let sidebarUsernameElement: HTMLElement | null;
let sidebarAvatarElement: HTMLImageElement | null;
let loginFormContainer: HTMLElement | null;
let sidebar: HTMLElement | null;
let menuToggle: HTMLButtonElement | null;
let sidebarOverlay: HTMLElement | null;

// About modal elements
let aboutLink: HTMLElement | null;
let aboutModal: HTMLElement | null;
let aboutContent: HTMLElement | null;
let closeAboutButton: HTMLElement | null;

// --- Router ---
let router: Router;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Get main view containers
    loginViewElement = document.getElementById('login-view');
    appViewElement = document.getElementById('app-view');
    appContentRoot = document.getElementById('app-content-root');
    loginFormContainer = document.querySelector('.login-form-container');

    // Get sidebar elements
    sidebar = document.querySelector('.sidebar');
    sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-view]');
    logoutButton = document.getElementById('logout-button') as HTMLAnchorElement;
    sidebarUsernameElement = document.querySelector('.sidebar .user-profile .username');
    sidebarAvatarElement = document.querySelector('.sidebar .user-profile .avatar');

    // Get about elements
    aboutLink = document.getElementById('about-link');
    aboutModal = document.getElementById('about-modal');
    aboutContent = document.getElementById('about-content');
    closeAboutButton = document.querySelector('.close-about');

    if (!loginViewElement || !appViewElement || !appContentRoot || 
        !logoutButton || !sidebarUsernameElement || !sidebarAvatarElement) {
        console.error('Essential layout elements not found!');
        return;
    }

    console.log('App Initializing...');

    // Setup Router - Targets the app's content area
    router = new Router(appContentRoot);

    // --- Define Routes for the main app content area ---
    router.addRoute('/', DashboardView); // Default IS profile
    router.addRoute('/profile', ProfileView);

    // Add parameterized routes for profile/:id and chat/:id
    router.addParamRoute('/profile/:id', ProfileView);
    router.addParamRoute('/chat/:id', ChatView);

    router.addRoute('/chat', ChatView);
    router.addRoute('/friends', FriendsView);
    router.addRoute('/game', GameView);
    router.addRoute('/tournament', TournamentView);
    router.addRoute('/settings', SettingsView);

    // --- Setup Responsive UI Elements ---
    setupResponsiveElements();

    // --- Event Listeners ---
    setupEventListeners();
    setupAboutModal();
    setupResponsiveNavigation();
    NotificationManager.initialize();

    // --- Initial UI State ---
    updateUI(); // Show login or app view based on initial state

    // Check for register route
    if (window.location.hash === '#/register' && loginFormContainer) {
        // Create and render register view
        const registerView = new RegisterView(router);
        
        // Hide login form elements first
        const loginFormElements = loginFormContainer.querySelectorAll(':not(.register-view)');
        loginFormElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
        });
        
        // Render register view
        registerView.render(loginFormContainer);
    }

    // Handle initial deep linking or back/forward navigation if logged in
    if (isLoggedIn) {
        if (window.location.hash && router.hasRoute(window.location.hash.substring(1))) {
            router.handleRouteChange();
        } else {
            router.navigate('/profile');
        }
        updateSidebarLinks(window.location.hash);
    }

    // Listen for hash changes to update main content
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        console.log(`Hash changed to: ${hash}`);
        
        if (isLoggedIn) {
            router.handleRouteChange();
            updateSidebarLinks(window.location.hash);
        } else if (hash === '#/register' && loginFormContainer) {
            // Handle register route
            
            // Clear existing content
            while (loginFormContainer.firstChild) {
                loginFormContainer.removeChild(loginFormContainer.firstChild);
            }
            
            // Create and render register view
            const registerView = new RegisterView(router);
            registerView.render(loginFormContainer);
        } else if (hash === '' || hash === '#/') {
            // Reset to login form
            window.location.reload(); // Simple approach to reset the login form
        }
    });
});

// --- Functions ---
function setupResponsiveElements(): void {
    // Get menu toggle and overlay elements
    menuToggle = document.querySelector('.menu-toggle');
    sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    // Initialize responsive layout
    updateResponsiveLayout();
    
    // Listen for window resize events
    window.addEventListener('resize', updateResponsiveLayout);
}

function updateResponsiveLayout(): void {
    const isDesktop = window.innerWidth > 992;
    
    // Only apply these changes when logged in
    if (!isLoggedIn) return;
    
    if (menuToggle) {
        menuToggle.style.display = isDesktop ? 'none' : 'flex';
    }
    
    if (sidebar) {
        // Desktop: expanded sidebar
        if (isDesktop) {
            sidebar.style.transform = 'translateX(0)';
            sidebar.style.width = '250px';
            
            if (appContentRoot && appContentRoot.parentElement) {
                appContentRoot.parentElement.style.marginLeft = '250px';
                appContentRoot.parentElement.style.width = 'calc(100% - 250px)';
            }
        } 
        // Tablet/Mobile: hidden by default
        else {
            // Only hide if not currently active
            if (!sidebar.classList.contains('active')) {
                sidebar.style.transform = 'translateX(-100%)';
            }
            sidebar.style.width = '250px'; // Full width sidebar when it appears
            
            if (appContentRoot && appContentRoot.parentElement) {
                appContentRoot.parentElement.style.marginLeft = '0';
                appContentRoot.parentElement.style.width = '100%';
            }
        }
    }
    
    // Update accessibility state
    if (sidebar) {
        sidebar.setAttribute('aria-hidden', isDesktop ? 'false' : sidebar.classList.contains('active') ? 'false' : 'true');
    }
}

function setupResponsiveNavigation(): void {
    if (!menuToggle || !sidebarOverlay) return;
    
    // Toggle sidebar when hamburger menu is clicked
    menuToggle.addEventListener('click', () => {
        if (!menuToggle || !sidebarOverlay || !sidebar) return;

        const isActive = sidebar?.classList.contains('active');
        
        // Toggle active class
        if (isActive) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            sidebar.style.transform = 'translateX(-100%)';
        } else {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            sidebar.style.transform = 'translateX(0)';
        }
        
        // Toggle aria-expanded for accessibility
        menuToggle.setAttribute('aria-expanded', isActive ? 'false' : 'true');
        menuToggle.setAttribute('aria-label', isActive ? 'Open menu' : 'Close menu');
        sidebar.setAttribute('aria-hidden', isActive ? 'true' : 'false');
    });
    
    // Close sidebar when overlay is clicked
    sidebarOverlay.addEventListener('click', () => {
        if (!menuToggle || !sidebarOverlay || !sidebar) return;

        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        sidebar.style.transform = 'translateX(-100%)';
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
        sidebar.setAttribute('aria-hidden', 'true');
    });
    
    // Close sidebar when clicking sidebar links (on mobile)
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (!menuToggle || !sidebarOverlay || !sidebar) return;

            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                sidebar.style.transform = 'translateX(-100%)';
                menuToggle.setAttribute('aria-expanded', 'false');
                sidebar.setAttribute('aria-hidden', 'true');
            }
        });
    });

    // Close sidebar when escape key is pressed
    document.addEventListener('keydown', (e) => {
        if (!menuToggle || !sidebarOverlay || !sidebar) return;
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            sidebar.style.transform = 'translateX(-100%)';
            menuToggle.setAttribute('aria-expanded', 'false');
            sidebar.setAttribute('aria-hidden', 'true');
        }
    });
    if (!menuToggle || !sidebarOverlay || !sidebar) return; // whY???????
    // Initialize ARIA attributes for accessibility
    sidebar.setAttribute('id', 'sidebar');
    sidebar.setAttribute('aria-hidden', window.innerWidth <= 992 ? 'true' : 'false');
    menuToggle.setAttribute('aria-controls', 'sidebar');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
}

function setupAboutModal(): void {
    // Set up click handlers for about links
    aboutLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showAboutModal();
    });

    // Set up close button
    closeAboutButton?.addEventListener('click', () => {
        if (aboutModal) {
            aboutModal.style.display = 'none';
        }
    });
    
    // Close when clicking outside the modal content
    aboutModal?.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            if (aboutModal) {
                aboutModal.style.display = 'none';
            }
        }
    });
    
    // Close with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && aboutModal && aboutModal.style.display === 'flex') {
            aboutModal.style.display = 'none';
        }
    });
}

function showAboutModal(): void {
    if (!aboutModal || !aboutContent) return;
    
    // Create and render the AboutView
    const aboutView = new AboutView();
    aboutContent.innerHTML = ''; // Clear previous content
    aboutView.render(aboutContent);
    
    // Show the modal
    aboutModal.style.display = 'flex';
}

function setupEventListeners(): void {
    const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
    loginForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('Login attempt...');

        const usernameInput = document.getElementById('username') as HTMLInputElement | null;
        const passwordInput = document.getElementById('password') as HTMLInputElement | null;

        if (!usernameInput || !passwordInput) {
            console.error("Login form inputs not found");
            return;
        }

        const username = usernameInput.value;
        const password = passwordInput.value;

        // Debug login attempt keepf or databse user testing
        console.log(`Login attempt with username: "${username}" and password: "${password}"`);

        // Find user in mock data
        const foundUser = findUserByUsername(username);
        console.log("Found user:", foundUser);

        // Check password
        if (foundUser && foundUser.password === password) {
            console.log(`Login successful for ${foundUser.displayName}`);
            isLoggedIn = true;
            currentUser = foundUser;
            updateUI();
            router.navigate('/'); // Navigate to Dashboard (root now..) after successful login

            // delete this later or keep 1
            NotificationManager.show({
                title: 'Welcome',
                message: `Welcome back, ${foundUser.displayName}!`,
                type: 'info',
                duration: 3000
            });
            
            setTimeout(() => {
                NotificationManager.show({
                    title: 'Login Successful',
                    message: 'You have successfully logged in.',
                    type: 'success',
                    duration: 5000
                });
            }, 2000);
        } else {
            console.log('Login failed: Invalid username or password');
            // alert('Login failed: Invalid username or password');
            NotificationManager.show({
                title: 'Login Failed',
                message: 'Invalid username or password.',
                type: 'error',
                duration: 5000
            });
            passwordInput.value = '';
        }
    });

    // Register link
    const registerLink = document.querySelector('.register-link a');
    if (registerLink) {
        // Remove any existing event listeners
        const newRegisterLink = registerLink.cloneNode(true);
        if (registerLink.parentNode) {
            registerLink.parentNode.replaceChild(newRegisterLink, registerLink);
        }
        
        // Add our new event listener
        newRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Register link clicked, navigating to register view");
            
            // Get the login form elements to hide
            const loginForm = document.getElementById('login-form');
            const socialLogin = document.querySelector('.social-login');
            const registerLinkContainer = document.querySelector('.register-link');
            
            // Hide them
            if (loginForm) (loginForm as HTMLElement).style.display = 'none';
            if (socialLogin) (socialLogin as HTMLElement).style.display = 'none';
            if (registerLinkContainer) (registerLinkContainer as HTMLElement).style.display = 'none';
            
            // Clear existing content from the container
            if (loginFormContainer) {
                // Clear all content
                loginFormContainer.innerHTML = '';
                
                // Create and render register view
                const registerView = new RegisterView(router);
                registerView.render(loginFormContainer);
            }
            
            // Update URL without triggering another reload
            history.pushState(null, document.title, '#/register');
        });
    }

    // Social login buttons
    const fortytwoButton = document.querySelector('.social-button.fortytwo');
    fortytwoButton?.addEventListener('click', () => {
        console.log('fortytwoButton was pressed');
        NotificationManager.show({
            title: '42 Login',
            message: '42 is not implemented.',
            type: 'info',
            duration: 3000
        });
    });
    const googleButton = document.querySelector('.social-button.google');
    googleButton?.addEventListener('click', () => {
        // this will redirect to Google OAuth
        console.log('Google login clicked');
        // NotificationManager.show({
        //     title: 'Google Login',
        //     message: 'Google login would be implemented here. ',
        //     type: 'info',
        //     duration: 3000
        // });
        GoogleSignIn(router);
    });

    // Logout Button
    logoutButton?.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Logout');
        isLoggedIn = false;
        currentUser = null;
        updateUI();

        NotificationManager.show({
            title: 'Logged Out',
            message: 'You have successfully logged out.',
            type: 'success',
            duration: 3000
        });

    });
}

function updateUI(): void {
    if (isLoggedIn && currentUser) {
        loginViewElement?.classList.remove('active');
        appViewElement?.classList.add('active');

        // Update sidebar profile info
        if (sidebarUsernameElement) {
            sidebarUsernameElement.textContent = currentUser.displayName;
        }
        if (sidebarAvatarElement && currentUser.avatarUrl) {
            sidebarAvatarElement.src = currentUser.avatarUrl || 'https://placehold.co/80x80/1d1f21/ffffff?text=User'; // Default avatar
            sidebarAvatarElement.alt = `${currentUser.displayName}'s avatar`;
        }

        // Apply responsive layout
        updateResponsiveLayout();

    } else {
        loginViewElement?.classList.add('active');
        appViewElement?.classList.remove('active');
        if (window.location.hash && window.location.hash !== '#/') {
            if (window.location.hash !== '#/register') {
                history.pushState("", document.title, window.location.pathname + window.location.search);
            }
        }
        if (appContentRoot) appContentRoot.innerHTML = '';
        if (sidebarUsernameElement) sidebarUsernameElement.textContent = 'User Name';
        if (sidebarAvatarElement) sidebarAvatarElement.src = 'https://placehold.co/80x80/1d1f21/ffffff?text=User';
        
        // Hide hamburger menu and sidebar when logged out
        if (menuToggle) {
            menuToggle.style.display = 'none';
        }
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
    }
}

function updateSidebarLinks(currentHash: string): void {
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Basic matching for exact URLs
        if (href === currentHash) {
            link.classList.add('active');
        } 
        // Match parameterized routes (e.g. /profile/123 should match /profile/:id)
        else if (href && currentHash.startsWith(href + '/')) {
            link.classList.add('active');
        }
        else {
            link.classList.remove('active');
        }
    });
}