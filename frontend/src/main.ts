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
import { Language } from './views/Translate.js';

// --- State ---
let isLoggedIn = false;
export let currentUser: UserProfile | null = null; // Store logged-in user details

// --- DOM Elements ---
let loginViewElement: HTMLElement | null;
let appViewElement: HTMLElement | null;
let appContentRoot: HTMLElement | null;
let sidebarLinks: NodeListOf<HTMLAnchorElement> | null;
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
    currentUser = await Auth.getCurrentUser();
    if (currentUser) isLoggedIn = true;

    // Proceed with the rest of the initialization
    initializeApp();
});

function initializeApp(): void {
    // Get main view containers
    loginViewElement = document.getElementById('login-view');
    appViewElement = document.getElementById('app-view');
    loginFormContainer = document.querySelector('.login-form-container');

    // Get about elements
    aboutLink = document.getElementById('about-link');
    aboutModal = document.getElementById('about-modal');
    aboutContent = document.getElementById('about-content');
    closeAboutButton = document.querySelector('.close-about');

    if (!loginViewElement || !appViewElement) {
        console.error('Essential layout elements not found!');
        return;
    }

    // Create a temporary div element to initialize the router
    const tempElement = document.createElement('div');
    router = new Router(tempElement);

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

    // --- Setup About Modal ---
    setupAboutModal();
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
        
        if (isLoggedIn) {
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
    if (!menuToggle || !sidebarOverlay || !sidebar) return;
    
    // Toggle sidebar when hamburger menu is clicked
    menuToggle.addEventListener('click', () => {
        if (!sidebar || !sidebarOverlay || !menuToggle) return;
        
        const isActive = sidebar.classList.contains('active');
        
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
        if (!sidebar || !sidebarOverlay || !menuToggle) return;
        
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
            if (!sidebar || !sidebarOverlay || !menuToggle) return;
            
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
        if (!sidebar || !sidebarOverlay || !menuToggle) return;
        
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            sidebar.style.transform = 'translateX(-100%)';
            menuToggle.setAttribute('aria-expanded', 'false');
            sidebar.setAttribute('aria-hidden', 'true');
        }
    });

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
    logoutButton?.addEventListener('click', async (event) => {
        event.preventDefault();
        isLoggedIn = false;
        currentUser = null;
        await Auth.logout();
        updateUI();

        NotificationManager.show({
            title: 'Logged Out',
            message: 'You have successfully logged out.',
            type: 'success',
            duration: 3000
        });

        window.location.hash = '#';
        router.reload();
    });
}

function updateUI(): void {
    if (isLoggedIn && currentUser) {
        // Create app view if it hasn't been created yet
        if (!appContentRoot) {
            createAppView();
        } else {
            // Just update the profile info if view already exists
            if (sidebarUsernameElement) {
                sidebarUsernameElement.textContent = sanitizeInput(currentUser.display_name);
            }
            if (sidebarAvatarElement) {
                sidebarAvatarElement.src = currentUser.avatar_url as string;
                sidebarAvatarElement.alt = `${sanitizeInput(currentUser.display_name)}'s avatar`;
            }
        }
        
        loginViewElement?.classList.remove('active');
        appViewElement?.classList.add('active');

        // Apply responsive layout
        updateResponsiveLayout();
        if (!window.location.hash || window.location.hash === '#/') {
            router.navigate('/');
        }
    } else {
        loginViewElement?.classList.add('active');
        if (appViewElement) {
            appViewElement.classList.remove('active');
            // Clear app content when logged out
            appViewElement.innerHTML = '';
        }
        
        if (window.location.hash && window.location.hash !== '#/') {
            if (window.location.hash !== '#/register') {
                history.pushState("", document.title, window.location.pathname + window.location.search);
            }
        }
        
        // Reset references
        appContentRoot = null;
        sidebar = null;
        sidebarLinks = null as any;
        logoutButton = null;
        sidebarUsernameElement = null;
        sidebarAvatarElement = null;
        menuToggle = null;
        sidebarOverlay = null;
    }
}

function updateSidebarLinks(currentHash: string): void {
    if (!sidebarLinks) return;
    
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

// Add this function to your main.ts
function createAppView(): void {
  if (!appViewElement || !currentUser) return;
  
  // Clear any existing content
  appViewElement.innerHTML = '';
  
  const appHTML = `
  <div class="app-layout-container">
      <div class="app-layout">
          <aside class="sidebar">
              <div class="user-profile">
                <img src="${currentUser.avatar_url || 'https://placehold.co/80x80/1d1f21/ffffff?text=User'}" 
                     alt="${sanitizeInput(currentUser.display_name)}'s avatar" 
                     class="avatar">
                <span class="username">${sanitizeInput(currentUser.display_name)}</span>
              </div>
              <nav class="sidebar-nav">
                  <ul>
                      <li><a href="#/" data-view="dashboard"><i class="fas fa-chart-line"></i> <span data-i18n="dashboard">Dashboard</span></a></li>
                      <li><a href="#/profile" data-view="profile"><i class="fas fa-user"></i> <span data-i18n="profile">Profile</span></a></li>
                      <li><a href="#/chat" data-view="chat"><i class="fas fa-comments"></i> <span data-i18n="chat">Chat</span></a></li>
                      <li><a href="#/friends" data-view="friends"><i class="fas fa-user-friends"></i> <span data-i18n="friends">Friends</span></a></li>
                      <li><a href="#/game" data-view="game"><i class="fas fa-gamepad"></i> <span data-i18n="game">Game</span></a></li>
                      <li><a href="#/tournament" data-view="tournament"><i class="fas fa-trophy"></i> <span data-i18n="tournament">Tournament</span></a></li>
                      <li><a href="#/settings" data-view="settings"><i class="fas fa-cog"></i> <span data-i18n="settings">Settings</span></a></li>
                      <li><a href="#" id="logout-button"><i class="fas fa-sign-out-alt"></i> <span data-i18n="logout">Logout</span></a></li>
                  </ul>
              </nav>
          </aside>
          <main class="main-content" id="app-content-root"> 
              <!-- Dynamic content will go here -->
          </main>
      </div>
  </div>
  <button class="menu-toggle" aria-controls="sidebar" aria-expanded="false" aria-label="Open menu">
      <i class="fas fa-bars"></i>
  </button>
  <div class="sidebar-overlay"></div>
`;

  
  // Set the HTML
  appViewElement.innerHTML = appHTML;
  
  // Update references to DOM elements
  appContentRoot = document.getElementById('app-content-root');
  sidebar = document.querySelector('.sidebar');
  sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-view]');
  logoutButton = document.getElementById('logout-button') as HTMLAnchorElement;
  sidebarUsernameElement = document.querySelector('.sidebar .user-profile .username');
  sidebarAvatarElement = document.querySelector('.sidebar .user-profile .avatar');
  menuToggle = document.querySelector('.menu-toggle');
  sidebarOverlay = document.querySelector('.sidebar-overlay');
  
  // Setup now that elements are available
  setupEventListeners();
  setupResponsiveNavigation();
  setupResponsiveElements();
  
  // Set router target now that appContentRoot exists
  setupRouterTarget();
}

// Function to set the router target once appContentRoot exists
function setupRouterTarget(): void {
  if (appContentRoot) {
    router.setTarget(appContentRoot);
  }
}

// XSS simple sanitizer 
function sanitizeInput(input: string | undefined): string {
    if (!input) return '';

    // Step 1: Replace known dangerous characters
    let sanitized = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/&#x27;/g, '&#039;')
        .replace(/&#x2F;/g, '/')
        .replace(/&#x3B;/g, ';')
        .replace(/\u2028/g, '&#x2028;')
        .replace(/\u2029/g, '&#x2029;')
        .replace(/\x00/g, '&#x00;')
        .replace(/\t/g, '&#x09;')
        .replace(/\n/g, '&#x0A;')
        .replace(/\r/g, '&#x0D;');

    // Step 2: Handle obfuscated script injections using Unicode and other patterns
    sanitized = sanitized.replace(/[\u200B\u200C\u200D\u200E\u200F\u202A\u202B\u202C\u202D\u202E]/g, ''); // Zero-width characters

    // Step 3: Block potentially dangerous URLs
    sanitized = sanitized.replace(/javascript:/gi, '')
                         .replace(/data:/gi, '')
                         .replace(/vbscript:/gi, '')
                         .replace(/on\w+=/gi, '');

    return sanitized.trim();
}