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

    addRoute(path: string, handler: SimpleRouteHandler): void {
        // Normalize path correctly
        const normalizedPath = path === '/' || path === '' ? '/' : `/${path.replace(/^\/|\/$/g, '')}`;
        this.routes.set(normalizedPath, handler);
    }

    addParamRoute(pattern: string, handler: ParamRouteHandler): void {
        // Replace :param placeholders with regex capture groups
        const regexPattern = pattern.replace(/:([^\s/]+)/g, '([^/]+)');

        // Ensure leading slash is preserved, remove trailing slash if any, escape slashes
        const escapedPattern = regexPattern
            .replace(/\/$/, '')          // Remove trailing slash if present
            .replace(/\//g, '\\/');      // Escape all slashes for regex

        // Create the final regex with ^ and $ anchors
        const regex = new RegExp(`^${escapedPattern}$`);

        this.paramRoutes.push({
            pattern: regex,
            handler
        });
    }


    hasRoute(path: string): boolean {
        // Normalize path for checking
        const normalizedPath = path === '/' || path === '' ? '/' : `/${path.replace(/^\/|\/$/g, '')}`;
        
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


    navigate(path: string): void {
        // Handle empty path or root path
        if (path === '/' || path === '') {
            window.location.hash = '#';
            return;
        }
        
        // Make sure path starts with '/' and strip trailing '/'
        const normalizedPath = `/${path.replace(/^\/|\/$/g, '')}`;
        window.location.hash = normalizedPath;
    }

    handleRouteChange(): void {
        try {
            // Get the path from the hash, default to '/'
            const hash = window.location.hash;
            
            // Handle different hash formats
            let path: string;
            if (!hash || hash === '#') {
                path = '/';
            } else {
                // Remove leading '#' and ensure it starts with '/'
                path = hash.startsWith('#/') ? hash.substring(2) : hash.substring(1);
                path = path || '/'; // Default to root if empty after removing '#'
            }
            
            // Normalize path for route matching
            const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}`;

            console.log(`Router: Handling route change to "${normalizedPath}"`);

            // Clean up previous view
            if (this.currentView?.destroy) {
                try {
                    this.currentView.destroy();
                } catch (error) {
                    console.error("Error destroying previous view:", error);
                }
            }
            this.currentView = null;
            
            // Clear only the content root if it exists
            if (this.rootElement) {
                this.rootElement.innerHTML = '';
            } else {
                console.error("Router: Root element is null or undefined");
                return;
            }

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
        } catch (error) {
            console.error("Unhandled error in router:", error);
            if (this.rootElement) {
                this.rootElement.innerHTML = `<h2>Application Error</h2><p>An unexpected error occurred.</p>`;
            }
        }
    }

    onNavigate(listener: () => void): void {
        this.navigationListeners.push(listener);
    }

    private notifyNavigationListeners(): void {
        this.navigationListeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error("Error in navigation listener:", error);
            }
        });
    }

    init(): void {
        this.handleRouteChange();
    }
}