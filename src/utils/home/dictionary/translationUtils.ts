import { invoke } from '@tauri-apps/api/core';

export const loadTranslations = async () => {
    try {
        const csvText = await invoke('read_file', { path: 'D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Dictionary\\translations.csv' }) as string;
        const lines = csvText.trim().split('\n');

        // Skip the header line
        const translations = lines.slice(1).map(line => {
            const firstComma = line.indexOf(',');
            const secondComma = line.indexOf(',', firstComma + 1);
            const dateAdded = line.slice(0, firstComma).replace(/^"|"$/g, '');
            const term = line.slice(firstComma + 1, secondComma).replace(/^"|"$/g, '');
            const translation = line.slice(secondComma + 1).replace(/^"|"$/g, '');
            return { dateAdded, term, translation };
        });
        return translations;
    } catch (error) {
        console.error(`Failed to fetch translation: ${error}`);
        return [];
    }
};
