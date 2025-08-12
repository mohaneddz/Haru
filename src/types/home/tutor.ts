export interface MessageProps {
	id?: number;
	text: string;
	user: boolean;
}

export interface SourceData {
	path?: string;
	score_range?: [number, number];
	prompt_indices?: number[];
	title?: string;
	url?: string;
}

// Main interface for chat messages, now includes optional sources
export interface MessageData {
	id: number;
	text: string;
	user: boolean;
	rawText?: string;
	images?: string[]; 
	sources?: SourceData[];
}
