export interface Flashcard {
    id: number;
    question: string;
    answer: string;
    lastModified: string; // time and date of last modification in format : YYYY-MM-DD-HH:mm:ss
    accuracy: string; 
    attempts: string;
    type: 'input' | 'tf' | 'multi-choice'; 
}
