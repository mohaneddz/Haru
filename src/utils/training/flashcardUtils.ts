import { readFile, saveFile, createDir } from '@/utils/core/appdata';

// Added: Simple djb2 hash function for generating unique hashes
function djb2Hash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash.toString(36); // Base36 for a shorter string
}

// Added: Generate a unique filename for a flashcard based on its ID and a hash of the current timestamp
export const getFlashcardFilename = (id: number): string => {
    const timestamp = Date.now();
    const input = timestamp.toString() + id.toString();
    const hash = djb2Hash(input);
    return `${hash}.json`; // Use .json extension (can be changed if saving as CSV or other format)
};

export const loadFlashDecks = async () => {
    try {
        await createDir('flashcards');
        const data = await readFile('flashcards/decks.json');
        if (!data) {
            return [];
        }
        const decks = JSON.parse(data);
        console.log(`Loaded flash decks: ${JSON.stringify(decks)}`);
        return decks;
    } catch (error) {
        console.error(`Failed to fetch flash decks: ${error}`);
        return [];
    }
};

export const loadFlashcards = async (deck: { id: number; filename?: string }) => {
    try {
        const filename = deck.filename || `${deck.id}.csv`;
        const csvText = await readFile(`flashcards/${filename}`) as string;
        const lines = csvText.trim().split('\n');

        // Skip the header line
        const flashcards = lines.slice(1).map(line => {
            const [id, type, question, answer, options, correct, duration, numCorr, numWrong, lastDone] = line.split(',');
            return {
                id: Number(id),
                type,
                question,
                answer,
                options: options ? JSON.parse(options) : undefined,
                correct: correct ? Number(correct) : undefined,
                duration: Number(duration),
                numCorr: Number(numCorr),
                numWrong: Number(numWrong),
                lastDone,
                filename: getFlashcardFilename(Number(id)) // Added: Compute and include the filename for each flashcard
            };
        });
        return flashcards;
    } catch (error) {
        console.error(`Failed to fetch flashcards: ${error}`);
        return [];
    }
};

export const saveFlashDecks = async (decks: any[]) => {
    try {
        await createDir('flashcards');
        const data = JSON.stringify(decks, null, 2);
        await saveFile('flashcards/decks.json', data);
        console.log('Saved flash decks');
    } catch (error) {
        console.error(`Failed to save flash decks: ${error}`);
    }
};

export const saveFlashcards = async (deck: { id: number; filename?: string }, flashcards: any[]) => {
    try {
        await createDir('flashcards');
        const filename = deck.filename || `${deck.id}.csv`;
        const header = 'id,type,question,answer,options,correct,duration,numCorr,numWrong,lastDone\n';
        const csvContent = header + flashcards.map(card =>
            `${card.id},${card.type},${card.question},${card.answer},${card.options ? JSON.stringify(card.options) : ''},${card.correct ?? ''},${card.duration},${card.numCorr},${card.numWrong},${card.lastDone}`
        ).join('\n');
        await saveFile(`flashcards/${filename}`, csvContent);
        console.log(`Saved flashcards for deck ${deck.id}`);
    } catch (error) {
        console.error(`Failed to save flashcards: ${error}`);
    }
};
