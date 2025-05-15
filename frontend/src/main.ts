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
import { LoginView } from './views/Login.js';
import { UserProfile } from './types/index.js';
import * as Auth from './services/auth.js';

// --- State ---
let isLoggedIn = false;
export let currentUser: UserProfile | null = null; // Store logged-in user details

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
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing application...');

    // Initialize user before proceeding
    await initializeUser();

    // Proceed with the rest of the initialization
    initializeApp();
});

async function initializeUser(): Promise<void> {
    currentUser = await Auth.initializeAuth();
    if (currentUser)
        isLoggedIn = true;
}

function initializeApp(): void {
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

    // Handle routes for login/register when not logged in
    if (!isLoggedIn) {
        if (window.location.hash === '#/register' && loginFormContainer) {
            handleRegisterView();
        } else if (loginFormContainer) {
            handleLoginView();
        }
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


    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        console.log(`Hash changed to: ${hash}`);
        
    if (isLoggedIn) {
        // Handle case where hash is exactly '#'
        if (hash === '#') {
            router.navigate('/');
        } else {
            router.handleRouteChange();
        }
        updateSidebarLinks(window.location.hash);
    } else if (hash === '#/register' && loginFormContainer) {
        handleRegisterView();
    } else if ((hash === '' || hash === '#' || hash === '#/') && loginFormContainer) {
        handleLoginView();
    }
    });
}

// New function to handle login view rendering
function handleLoginView(): void {
    if (!loginFormContainer) return;
    
    // Clear existing content
    loginFormContainer.innerHTML = '';
    
    // Create and render login view
    const loginView = new LoginView(router, (user) => {
        currentUser = user;
        isLoggedIn = true;
        updateUI();
    });
    
    loginView.render(loginFormContainer);
    
    // Update URL without triggering another reload
    if (window.location.hash !== '#/') {
        history.pushState(null, document.title, '#/');
    }
}

// New function to handle register view rendering
function handleRegisterView(): void {
    if (!loginFormContainer) return;
    
    // Clear existing content
    loginFormContainer.innerHTML = '';
    
    // Create and render register view
    const registerView = new RegisterView(router);
    registerView.render(loginFormContainer);
    
    // Update URL without triggering another reload
    if (window.location.hash !== '#/register') {
        history.pushState(null, document.title, '#/register');
    }
}

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
    // Logout Button
    logoutButton?.addEventListener('click', (event) => {
        event.preventDefault();
        isLoggedIn = false;
        currentUser = null;
        Auth.logout();
        updateUI();

        NotificationManager.show({
            title: 'Logged Out',
            message: 'You have successfully logged out.',
            type: 'success',
            duration: 3000
        });

        window.location.reload();
        //or?
        window.location.hash = '#';
    });
}

function updateUI(): void {
    if (isLoggedIn && currentUser) {
        loginViewElement?.classList.remove('active');
        appViewElement?.classList.add('active');

        // Update sidebar profile info
        if (sidebarUsernameElement) {
            sidebarUsernameElement.textContent = currentUser.display_name;
        }
        if (sidebarAvatarElement && currentUser.avatar_url) {
            sidebarAvatarElement.src = currentUser.avatar_url || 'https://placehold.co/80x80/1d1f21/ffffff?text=User'; // Default avatar
            sidebarAvatarElement.alt = `${currentUser.display_name}'s avatar`;
        }

        // Apply responsive layout
        updateResponsiveLayout();
        if (!window.location.hash || window.location.hash === '#/') {
            router.navigate('/');
        }

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
