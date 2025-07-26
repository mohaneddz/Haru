// Interfaces for better type safety
export interface Transform {
	x: number;
	y: number;
	scale: number;
}

export interface MousePosition {
	x: number;
	y: number;
}

export interface Node {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	text: string;
	learned?: boolean;
	learnedDate?: Date;
	details?: string;
}

export interface Connection {
	fromNodeId: string;
	toNodeId: string;
}
