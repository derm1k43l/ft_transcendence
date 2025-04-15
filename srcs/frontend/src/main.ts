import { Router } from './core/router.js';
import { ProfileView } from './views/Profile.js';
import { AboutView } from './views/About.js';

// Import mock data
import { UserProfile, findUserByUsername } from './data/mock_data.js';

// --- State ---
let isLoggedIn = false;
let currentUser: UserProfile | null = null;

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

});

function showAboutModal(): void {
    if (!aboutModal || !aboutContent) return;
    
    // Create and render the AboutView
    const aboutView = new AboutView(router);
    aboutContent.innerHTML = ''; // Clear previous content
    aboutView.render(aboutContent);
    
    // Show the modal
    aboutModal.style.display = 'flex';
}
