// Simple Hash-based Router for SPA content area

// Define the structure for a view component
interface ViewComponent {
    render(element: HTMLElement): void; // Renders the view content into the element
    destroy?(): void; // Optional: Cleans up when navigating away
}

// Type for the class constructor of a view component
type RouteHandler = new (router: Router) => ViewComponent;

export class Router {
    private routes: Map<string, RouteHandler> = new Map();
    private currentView: ViewComponent | null = null;
    private rootElement: HTMLElement; // The element where views are rendered
    private navigationListeners: (() => void)[] = [];

    constructor(rootElement: HTMLElement) {
        this.rootElement = rootElement;
    }

    /**
     * Adds a route mapping a path (without '#') to a view component constructor.
     */
    addRoute(path: string, handler: RouteHandler): void {
        // Ensure path starts with '/' and remove trailing '/' if present
        const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}`;
        this.routes.set(normalizedPath, handler);
    }

    /**
     * Checks if a route exists for the given path (without '#').
     */
    hasRoute(path: string): boolean {
         const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}`;
         return this.routes.has(normalizedPath);
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
        const path = hash.startsWith('#/') ? hash.substring(1) : '/';

        const Handler = this.routes.get(path);

        // Clean up previous view
        if (this.currentView?.destroy) {
            try {
                this.currentView.destroy();
            } catch (error) {
                console.error("Error destroying previous view:", error);
            }
        }
        this.currentView = null;
        // Clear only the content root, not the entire body or app layout
        this.rootElement.innerHTML = '';

        if (Handler) {
            try {
                // Instantiate the new view, passing the router instance
                this.currentView = new Handler(this);
                // Render the new view into the root element
                this.currentView.render(this.rootElement);
                this.notifyNavigationListeners(); // Notify listeners AFTER rendering
            } catch (error) {
                 console.error(`Error rendering route ${path}:`, error);
                 this.rootElement.innerHTML = `<h2>Error</h2><p>Could not load this page.</p>`;
            }
        } else {
            // Handle 404 Not Found for the main content area
            this.rootElement.innerHTML = `<h2>404 - Not Found</h2><p>The page for route "${path}" could not be found within the app.</p>`;
            console.warn(`No route handler found for path: ${path}`);
            this.notifyNavigationListeners(); // Still notify for link updates etc.
        }
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
}
