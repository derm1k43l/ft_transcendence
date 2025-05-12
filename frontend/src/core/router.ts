// Simple Hash-based Router for SPA content area

// Define the structure for a view component
interface ViewComponent {
    render(element: HTMLElement): void; // Renders the view content into the element
    destroy?(): void; // Optional: Cleans up when navigating away
}

interface RouteParams {
    [key: string]: string;
}
type SimpleRouteHandler = new (router: Router) => ViewComponent;
type ParamRouteHandler = new (router: Router, ...params: any[]) => ViewComponent;

// Type for the class constructor of a view component
type RouteHandler = new (router: Router) => ViewComponent;

// taste wiht databse
type DynamicRouteHandler = (params: Record<string, string>) => ViewComponent;

// wil need to route the ...
interface Route {
    pattern: string;
    handler: RouteHandler | DynamicRouteHandler;
    isDynamic: boolean;
}

export class Router {
    private routes: Map<string, SimpleRouteHandler> = new Map();
    private paramRoutes: { pattern: RegExp; handler: ParamRouteHandler }[] = [];
    private currentView: ViewComponent | null = null;
    private rootElement: HTMLElement; // The element where views are rendered
    private navigationListeners: (() => void)[] = [];

    constructor(rootElement: HTMLElement) {
        this.rootElement = rootElement;
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRouteChange());
    }

    reload() {
        this.handleRouteChange();
    }

    /**
     * Adds a route mapping a path (without '#') to a view component constructor.
     */
    addRoute(path: string, handler: SimpleRouteHandler): void {
        // Ensure path starts with '/' and remove trailing '/' if present
        const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}`;
        this.routes.set(normalizedPath, handler);
    }

    /**
     * Adds a route with parameter support using a regex pattern
     * Example: addParamRoute('/profile/:id', ProfileView);
     */
    addParamRoute(pattern: string, handler: ParamRouteHandler): void {
        // Convert route string with params into a regex pattern
        // e.g., '/profile/:id' becomes /^\/profile\/([^\/]+)$/
        
        // Replace :param placeholders with regex capture groups
        const regexPattern = pattern.replace(/:([^\s/]+)/g, '([^/]+)');
        
        // Create a regex object, ensuring starting slash and proper escapes
        const regex = new RegExp(
            `^${regexPattern.replace(/^\/|\/$/g, '').replace(/\//g, '\\/')}$`
        );
        
        this.paramRoutes.push({
            pattern: regex,
            handler
        });
    }

    /**
     * Checks if a route exists for the given path (without '#').
     */
    hasRoute(path: string): boolean {
        const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}`;
        
        // Check standard routes
        if (this.routes.has(normalizedPath)) {
            return true;
        }
        
        // Check param routes
        for (const paramRoute of this.paramRoutes) {
            if (paramRoute.pattern.test(normalizedPath)) {
                return true;
            }
        }
        
        return false;
    }


    /**
     * Programmatically navigates to a given path (e.g., '/profile').
     */
    navigate(path: string): void {
        const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}`;
        window.location.hash = normalizedPath;
    }

   /**
     * Handles changes in the URL hash to render the correct view.
     * Should be called on initial load and on 'hashchange' events.
     */
   handleRouteChange(): void {
    // Get the path from the hash, default to '/'
    const hash = window.location.hash || '#/';
    // Remove leading '#' and ensure it starts with '/'
    const path = hash.startsWith('#') ? hash.substring(1) : '/';
    
    // Normalize path
    const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}`;

    // Clean up previous view
    if (this.currentView?.destroy) {
        try {
            this.currentView.destroy();
        } catch (error) {
            console.error("Error destroying previous view:", error);
        }
    }
    this.currentView = null;
    // Clear only the content root
    this.rootElement.innerHTML = '';

    // First check standard routes
    const Handler = this.routes.get(normalizedPath);
    if (Handler) {
        try {
            // Instantiate the new view, passing the router instance
            this.currentView = new Handler(this);
            // Render the new view into the root element
            this.currentView.render(this.rootElement);
            this.notifyNavigationListeners();
        } catch (error) {
            console.error(`Error rendering route ${path}:`, error);
            this.rootElement.innerHTML = `<h2>Error</h2><p>Could not load this page.</p>`;
        }
        return;
    }
    
    // If no standard route matched, try param routes
    for (const paramRoute of this.paramRoutes) {
        const match = normalizedPath.match(paramRoute.pattern);
        if (match) {
            // Extract parameters from the match groups
            const params = match.slice(1);
            
            try {
                // Instantiate the new view with router and extracted parameters
                this.currentView = new paramRoute.handler(this, ...params);
                // Render the new view into the root element
                this.currentView.render(this.rootElement);
                this.notifyNavigationListeners();
            } catch (error) {
                console.error(`Error rendering route ${path}:`, error);
                this.rootElement.innerHTML = `<h2>Error</h2><p>Could not load this page.</p>`;
            }
            return;
        }
    }
    
    // Handle 404 Not Found for the main content area
    this.rootElement.innerHTML = `<h2>404 - Not Found</h2><p>The page for route "${path}" could not be found within the app.</p>`;
    console.warn(`No route handler found for path: ${path}`);
    this.notifyNavigationListeners();
}

 /**
  * Registers a listener function to be called after navigation occurs.
  */
 onNavigate(listener: () => void): void {
    this.navigationListeners.push(listener);
}

/**
 * Notifies all registered navigation listeners.
 */
private notifyNavigationListeners(): void {
    this.navigationListeners.forEach(listener => {
        try {
            listener();
        } catch (error) {
            console.error("Error in navigation listener:", error);
        }
    });
}

/**
 * Initializes the router, loading the current route.
 */
init(): void {
    this.handleRouteChange();
}
}