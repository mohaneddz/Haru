import { createSignal, createEffect } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

export function useNotes() {
	const [currLine, setCurrLine] = createSignal(0);
	const [lineText, setLineText] = createSignal(Array(20).fill(''));
	const [currFile, setCurrFile] = createSignal('');

	const linesCount = 20;
	const lineIndices = Array.from({ length: linesCount }, (_, i) => i);

	// handle keyboard events

	document.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowDown' || e.key === 'Enter') {
			setCurrLine((prev) => Math.min(prev + 1, linesCount - 1));
		} else if (e.key === 'ArrowUp') {
			setCurrLine((prev) => Math.max(prev - 1, 0));
		}
	});

	async function loadFileContent(filePath: string) {
		try {
			// directly invoke the Rust command and get a string back
			const content: string = await invoke('read_file', { path: filePath });
			const lines = content.split('\n');

			setLineText(lines.slice(0, linesCount));
			setCurrLine(0);
		} catch (error) {
			console.error('Error reading file:', error);
			setLineText(Array(linesCount).fill(''));
		}
	}

	createEffect(() => {
		// selec the id
		const selectedLine = document.getElementById(`line-${currLine()}`);
		if (selectedLine) {
			selectedLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
			selectedLine.focus();
		}
	});

	createEffect(() => {
		console.log(currFile());
		if (currFile() && typeof currFile() === 'string') {
			loadFileContent(currFile());
		}
	});

	return {
		currLine,
		lineText,
		setCurrLine,
		setLineText,
		lineIndices,
		currFile,
		setCurrFile,
	};
}
