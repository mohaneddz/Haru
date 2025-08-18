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

export interface oldNode {
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

export interface Node{
	id: string;
	name: string;
	description: string;
	dependencies?: string[];
	sub_topic_num?: string;
	learnedDate?: Date;
}

export interface Connection {
	fromNodeId: string;
	toNodeId: string;
}
