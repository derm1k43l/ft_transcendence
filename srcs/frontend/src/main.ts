import { Router } from './core/router.js';
import { ProfileView } from './views/Profile.js';
import { AboutView } from './views/About.js';

// --- DOM Elements ---
let loginViewElement: HTMLElement | null;
let appViewElement: HTMLElement | null;
let appContentRoot: HTMLElement | null;
let sidebarLinks: NodeListOf<HTMLAnchorElement>;
let sidebarUsernameElement: HTMLElement | null;
let sidebarAvatarElement: HTMLImageElement | null;
let socialButtons: NodeListOf<HTMLButtonElement>;
// About modal elements
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

    // Get sidebar elements
    sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-view]');
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

    if (!loginViewElement || !appViewElement || !appContentRoot) {
        console.error('Essential layout elements not found!');
        return;
    }

    console.log('App Initializing...');

    // Setup Router - Targets the app's content area
    router = new Router(appContentRoot);

    // --- Define Routes for the main app content area ---
    router.addRoute('/', ProfileView);          // Changed default to profile
    router.addRoute('/profile', ProfileView);
    
    // Setup event listeners
    setupEventListeners();
    setupAboutModal();
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

function setupEventListeners(): void {
    // About modal handlers
    aboutLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showAboutModal();
    });
    
    registerAboutLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showAboutModal();
    });
    
    closeAboutButton?.addEventListener('click', () => {
        if (aboutModal) {
            aboutModal.style.display = 'none';
        }
    });
    
    // Close modal when clicking outside
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
    
    // Login form handling
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    loginForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        // Handle login logic here
        console.log('Login submitted');
    });
}

function showAboutModal(): void {
    if (!aboutModal || !aboutContent) {
        console.error('About modal elements not found');
        return;
    }
    
    // Create and render the AboutView - remove the router parameter
    const aboutView = new AboutView();
    aboutContent.innerHTML = ''; // Clear previous content
    aboutView.render(aboutContent);
    
    // Show the modal
    aboutModal.style.display = 'flex';
}