import { createSignal, createEffect } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { onCleanup } from "solid-js";

export function useNotes() {
	const [editing, setEditing] = createSignal(false);
	const [currFile, setCurrFile] = createSignal('');
	const [content, setContent] = createSignal('');

	let editorContainerRef: HTMLDivElement | undefined;

	async function loadFileContent(filePath: string) {
		try {
			const content: string = await invoke('read_file', { path: filePath });
			setCurrFile(filePath);
			setContent(content);
		} catch (error) {
			console.error('Error reading file:', error);
		}
	}

	createEffect(() => {
		console.log(currFile());
		if (currFile() && typeof currFile() === 'string') {
			loadFileContent(currFile());
		}
	});

	// Handle click outside and Escape key
	function handleClickOutside(e: MouseEvent) {
		if (editing() && editorContainerRef && !editorContainerRef.contains(e.target as Node)) {
			setEditing(false);
		}
	}
	function handleEsc(e: KeyboardEvent) {
		if (editing() && e.key === 'Escape') {
			setEditing(false);
		}
	}

	// Setup event listeners
	if (typeof window !== 'undefined') {
		window.addEventListener('mousedown', handleClickOutside);
		window.addEventListener('keydown', handleEsc);
		onCleanup(() => {
			window.removeEventListener('mousedown', handleClickOutside);
			window.removeEventListener('keydown', handleEsc);
		});
	}

	const openObsidian = () => {
		if (currFile()) {
			// use obsidian's url :
			// obsidian://open?path=FULL_FILE_PATH
			const obsidianUrl = `obsidian://open?path=${encodeURIComponent(currFile())}`;
			window.open(obsidianUrl, '_blank');
		}
	};

	return {
		content,
		currFile,
		setCurrFile,
		editing,
		setEditing,
		setContent,
        editorContainerRef,
		openObsidian
	};
}
