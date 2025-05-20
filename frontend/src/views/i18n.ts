export type Language = "english" | "spanish" | "german";

export const translations: Record<Language, Record<string, string>> = {
    english: {
        language: "Language",
        playButton: "Play",
        settings: "Settings",
    },
    spanish: {
        language: "Idioma",
        playButton: "Jugar",
        settings: "Configuraciones",
    },
    german: {
        language: "Sprache",
        playButton: "Spielen",
        settings: "Einstellungen",
    }
};

// Type guard to ensure selected value is a valid Language
export function isLanguage(value: string): value is Language {
    return ["english", "spanish", "german"].includes(value);
}

// Applies translations to all elements with [data-i18n]
export function applyTranslations(language: Language) {
    const elements = document.querySelectorAll<HTMLElement>("[data-i18n]");
    elements.forEach(el => {
        const key = el.dataset.i18n!;
        const translatedText = translations[language][key] || translations["english"][key] || key;
        el.textContent = translatedText;
    });
}
