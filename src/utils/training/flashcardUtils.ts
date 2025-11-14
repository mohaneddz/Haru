import { invoke } from '@tauri-apps/api/core';

export const loadFlashDecks = async () => {
    try {
        // read the decks.json
        const data = await invoke('read_file', { path: 'D:\\Programming\\Tauri\\haru\\src-tauri\\documents\\Flashcards\\decks.json' }) as string;
        console.log(`Loaded flash decks data: ${data}`);
        const decks = JSON.parse(data);
        console.log(`Loaded flash decks: ${JSON.stringify(decks)}`);
        return decks;
    } catch (error) {
        console.error(`Failed to fetch flash decks: ${error}`);
        return [];
    }
};

export const loadFlashcards = async (id: number) => {
    try {
        const csvText = await invoke('read_file', { path: `D:\\Programming\\Tauri\\haru\\src-tauri\\documents\\Flashcards\\${id}.csv` }) as string;
        const lines = csvText.trim().split('\n');

        // Skip the header line
        const flashcards = lines.slice(1).map(line => {
            const [id, type, question, answer, duration, numCorr, numWrong, lastDone] = line.split(',');
            return {
                id: Number(id),
                type,
                question,
                answer,
                duration: Number(duration),
                numCorr: Number(numCorr),
                numWrong: Number(numWrong),
                lastDone
            };
        });
        return flashcards;
    } catch (error) {
        console.error(`Failed to fetch flashcards: ${error}`);
        return [];
    }
};
