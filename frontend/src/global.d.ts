import type { Language } from "./views/Translate";

// Extend the global `Window` interface
declare global {
    interface Window {
        Chart: any;
        currentLanguage: Language = "english";
    }
}

export {};

// To load the Chart.js in a more TypeScript-friendly way, we can use your global.d.ts to 
// declare the Chart class. 