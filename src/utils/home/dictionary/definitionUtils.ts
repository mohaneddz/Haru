import { invoke } from '@tauri-apps/api/core';

export const loadDefinitions = async () => {
    try {
        const csvText = await invoke('read_file', { path: 'D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Dictionary\\definitions.csv' }) as string;
        const lines = csvText.trim().split('\n');

        // Skip the header line
        const definitions = lines.slice(1).map(line => {
            const [dateAdded, term, definition] = line.split(',');
            return { dateAdded, term, definition };
        });
        return definitions;
    } catch (error) {
        console.error(`Failed to fetch definitions: ${error}`);
        return [];
    }
};
