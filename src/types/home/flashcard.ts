export interface Flashcard {
    id: number;
    question: string;
    answer: string;
    lastModified: string; // time and date of last modification in format : YYYY-MM-DD-HH:mm:ss
    accuracy: string; 
    attempts: string;
    type: 'input' | 'tf' | 'multi-choice'; 
    options?: string[];
    correct?: number;
    filename?: string; // Added: dynamically generated filename based on ID and hashed timestamp
}
