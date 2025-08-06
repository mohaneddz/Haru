import { onMount } from 'solid-js';
import { Setter } from 'solid-js';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { createSignal } from 'solid-js';
import { getStoreValue, setStoreValue } from '@/config/store';

export default function usePaths() {
	const [indexLocation, setIndexLocation] = createSignal('/path/to/default/index');
	const [NotesLocation, setNotesLocation] = createSignal('/path/to/default/notes');
	const [QuicknotesLocation, setQuicknotesLocation] = createSignal('/path/to/default/quicknotes');
	const [DocumentsLocation, setDocumentsLocation] = createSignal('/path/to/default/documents');
	const [RAGLocation, setRAGLocation] = createSignal(['/path/to/default/rag1']);

	// Function to add a new RAG location
	const addRAGLocation = () => {
		setRAGLocation([...RAGLocation(), `/path/to/new/rag${RAGLocation().length + 1}`]);
	};

	// Function to remove the last RAG location
	const removeRAGLocation = () => {
		if (RAGLocation().length > 1) {
			setRAGLocation(RAGLocation().slice(0, RAGLocation().length - 1));
		}
	};

	async function selectFolder(locationSetter: Setter<string>) {
		const result = await open({ directory: true });
		if (result) {
			locationSetter(result);
		}
	}

	onMount(async () => {
		const storedNotesLocation = await getStoreValue('notesLocation');
		const storedQuicknotesLocation = await getStoreValue('quicknotesLocation');
		const storedDocumentsLocation = await getStoreValue('documentsLocation');
		const storedRAGLocations = await getStoreValue('ragLocations');
		const storedIndexLocation = await getStoreValue('indexLocation');

		storedNotesLocation && typeof storedNotesLocation === 'string' && setNotesLocation(storedNotesLocation);
		storedQuicknotesLocation &&
			typeof storedQuicknotesLocation === 'string' &&
			setQuicknotesLocation(storedQuicknotesLocation);
		storedDocumentsLocation &&
			typeof storedDocumentsLocation === 'string' &&
			setDocumentsLocation(storedDocumentsLocation);
		Array.isArray(storedRAGLocations) &&
			storedRAGLocations.every((loc) => typeof loc === 'string') &&
			setRAGLocation(storedRAGLocations);
		storedIndexLocation && typeof storedIndexLocation === 'string' && setIndexLocation(storedIndexLocation);
	});

	async function validatePath(paths: string[]): Promise<boolean> {
		try {
			for (const path of paths) {
				if (await invoke('verify_folder', { path })) {
					return true;
				}
			}
		} catch (error) {
			console.error('Error validating path:', error);
		}
		return false;
	}

	async function saveSettings() {
		if (
			!(await validatePath([NotesLocation()])) ||
			!(await validatePath([QuicknotesLocation()])) ||
			!(await validatePath([DocumentsLocation()])) ||
			!(await validatePath([indexLocation()]))
		) {
			alert('One or more paths are invalid. Please check your settings.');
			return;
		}

		await setStoreValue('notesLocation', NotesLocation());
		await setStoreValue('quicknotesLocation', QuicknotesLocation());
		await setStoreValue('documentsLocation', DocumentsLocation());
		await setStoreValue('ragLocations', RAGLocation());
		await setStoreValue('indexLocation', indexLocation());
	}

	return {
		NotesLocation,
		selectFolder,
		setNotesLocation,
		QuicknotesLocation,
		setQuicknotesLocation,
		DocumentsLocation,
		setDocumentsLocation,
		RAGLocation,
		setRAGLocation,
		addRAGLocation,
		removeRAGLocation,
		saveSettings,
		indexLocation,
		setIndexLocation,
	};
}
