import { Router } from './core/router.js';
import { GameView } from './views/Game.js';
import { ProfileView } from './views/Profile.js';
import { ChatView } from './views/Chat.js';
import { FriendsView } from './views/Friends.js';
import { SettingsView } from './views/Settings.js';
import { AboutView } from './views/About.js';
import { TournamentView } from './views/Tournament.js';
// Import mock data 
import { UserProfile, findUserByUsername } from './data/mock_data.js';

// --- State ---
let isLoggedIn = false;
let currentUser: UserProfile | null = null; // Store logged-in user details

// --- DOM Elements ---
let loginViewElement: HTMLElement | null;
let appViewElement: HTMLElement | null;
let appContentRoot: HTMLElement | null;
let mainNav: HTMLElement | null;
let sidebarLinks: NodeListOf<HTMLAnchorElement>;
let logoutButton: HTMLAnchorElement | null;
let sidebarUsernameElement: HTMLElement | null;
let sidebarAvatarElement: HTMLImageElement | null;
let socialButtons: NodeListOf<HTMLButtonElement>;
// Add missing elements for the about functionality
let aboutLink: HTMLElement | null;
let registerAboutLink: HTMLElement | null;
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

    // Get header elements
    mainNav = document.querySelector('.main-nav');

    // Get sidebar elements
    sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-view]');
    logoutButton = document.getElementById('logout-button') as HTMLAnchorElement;
    sidebarUsernameElement = document.querySelector('.sidebar .user-profile .username');
    sidebarAvatarElement = document.querySelector('.sidebar .user-profile .avatar');
    
    // Get social buttons
    socialButtons = document.querySelectorAll('.social-button');

    // Get about elements
    aboutLink = document.getElementById('about-link');
    registerAboutLink = document.querySelector('.register-link a');
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
    router.addRoute('/', ProfileView); // Changed default to profile
    router.addRoute('/profile', ProfileView);
    router.addRoute('/chat', ChatView);
    router.addRoute('/friends', FriendsView);
    router.addRoute('/game', GameView);
    router.addRoute('/tournament', TournamentView);
    router.addRoute('/settings', SettingsView);

    // --- Event Listeners ---
    setupEventListeners();
    setupAboutModal();

    // --- Initial UI State ---
    updateUI(); // Show login or app view based on initial state

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
        }
    });
});

// --- Functions ---
function setupAboutModal(): void {
    // Set up click handlers for about links
    aboutLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showAboutModal();
    });
    
    registerAboutLink?.addEventListener('click', (e) => {
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
            // This is where the error occurs - let's fix it
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
            router.navigate('/profile'); // Navigate to profile after successful login
        } else {
            console.log('Login failed: Invalid username or password');
            alert('Login failed: Invalid username or password');
            passwordInput.value = ''; // Clear password field on failure
        }
    });

    // Logout Button
    logoutButton?.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Logout');
        isLoggedIn = false;
        currentUser = null;
        updateUI();
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

    } else {
        loginViewElement?.classList.add('active');
        appViewElement?.classList.remove('active');
        if (window.location.hash && window.location.hash !== '#/') {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
        if (appContentRoot) appContentRoot.innerHTML = ''; // Clear app content
        if (sidebarUsernameElement) sidebarUsernameElement.textContent = 'User Name';
        if (sidebarAvatarElement) sidebarAvatarElement.src = 'https://placehold.co/80x80/1d1f21/ffffff?text=User';
    }
}

function updateSidebarLinks(currentHash: string): void {
    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentHash) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}