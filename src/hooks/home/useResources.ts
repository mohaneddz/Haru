import { createSignal, onMount } from 'solid-js';
import type { FilterState } from '@/types/misc/filters';
import {availableTags, availableFields, availableTypes} from '@/config/resourcesFilters';

import {
	loadVideos,
	loadTools,
	loadDocuments,
	AppendDocumentsFile,
	AppendVideosFile,
	AppendToolsFile,
	DeleteDocumentsFile,
	DeleteVideosFile,
	DeleteToolsFile,
} from '@/utils/home/courses/resourcessUtils';
import type { Document, Video, Tool } from '@/types/home/resource';

export default function useResources() {
	const [showDocuments, setShowDocuments] = createSignal(true);
	const [showVideos, setShowVideos] = createSignal(true);
	const [showTools, setShowTools] = createSignal(true);

	const [selection, setSelection] = createSignal<boolean>(false);
	const [selectedDocuments, setSelectedDocuments] = createSignal<string[]>([]);
	const [selectedVideos, setSelectedVideos] = createSignal<string[]>([]);
	const [selectedTools, setSelectedTools] = createSignal<string[]>([]);

	const [filteredDocuments, setFilteredDocuments] = createSignal<Document[] | null>([]);
	const [filteredVideos, setFilteredVideos] = createSignal<Video[] | null>([]);
	const [filteredTools, setFilteredTools] = createSignal<Tool[] | null>([]);

	const [moduleName, setModuleName] = createSignal<string>('');
	const [parentFolder, setParentFolder] = createSignal<string>('');

	const [_, setIsLoading] = createSignal(false);
	const [__, setError] = createSignal<string | null>(null);

	const [appendedDocuments, setAppendedDocuments] = createSignal<boolean>(false);
	const [appendedVideos, setAppendedVideos] = createSignal<boolean>(false);
	const [appendedTools, setAppendedTools] = createSignal<boolean>(false);

	const [filters, setFilters] = createSignal<FilterState>({
		searchQuery: '',
		selectedTags: [],
		selectedFields: [],
		selectedTypes: [],
	});

	onMount(async () => {
		await loadResources();
	});

	async function loadResources() {
		const path = window.location.pathname;
		// console.log(path);

		const pathParts = path.split('/');
		const modulename = pathParts.pop();
		const parentname = pathParts.pop();
		setModuleName(modulename || '');
		setParentFolder(parentname || '');

		// console.log(modulename);
		// console.log(parentname);

		const videos = await loadVideos(parentname || 'defaultParent', modulename || 'defaultModule');
		const tools = await loadTools(parentname || 'defaultParent', modulename || 'defaultModule');
		const documents = await loadDocuments(parentname || 'defaultParent', modulename || 'defaultModule');

		setFilteredDocuments(documents);
		setFilteredVideos(videos);
		setFilteredTools(tools);
	}

	async function searchResources() {
		// 1. Reset previous state and activate loading indicator
		setIsLoading(true);
		setError(null);

		if (!moduleName() || moduleName().trim() === '') {
			setError('Module name cannot be empty.');
			setIsLoading(false);
			return;
		}

		const API_URL = 'http://127.0.0.1:4999/module-documents'; // Your backend URL
		const requestOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				module_name: moduleName(),
			}),
		};
		try {
			const response = await fetch(API_URL, requestOptions);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
			}
			const data = await response.json();
			console.log('Successfully fetched documents:', data);
			console.log('Current documents:', filteredDocuments());
			return data;
		} catch (err) {
			// 6. Handle network errors or errors thrown from the response check
			console.error('Failed to search for resources:', err);
			setError(
				err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
			);
		} finally {
			// 7. Deactivate loading indicator regardless of outcome
			setIsLoading(false);
		}
	}

	async function appendDocuments() {
		const newDocuments = await searchResources();
		if (!newDocuments || !Array.isArray(newDocuments)) return;

		const fullDocuments = Array.from(
			new Map(
				[...(filteredDocuments() || []), ...newDocuments].map((doc: Document) => [String(doc.link ?? ''), doc])
			).values()
		);
		setFilteredDocuments(fullDocuments);
		setAppendedDocuments(true);
	}

	async function saveDocuments() {
		const documents = filteredDocuments();
		if (!documents || documents.length === 0) {
			setError('No documents to save.');
			return;
		}

		try {
			await AppendDocumentsFile(parentFolder(), moduleName(), documents);
			console.log('Documents saved successfully');
			setAppendedDocuments(false);
		} catch (err) {
			console.error('Failed to save documents:', err);
			setError(
				err instanceof Error
					? err.message
					: 'An unexpected error occurred while saving documents.'
			);
		}
	}

	async function searchVideos() {
		setIsLoading(true);
		setError(null);

		if (!moduleName() || moduleName().trim() === '') {
			setError('Module name cannot be empty.');
			setIsLoading(false);
			return;
		}

		const API_URL = 'http://127.0.0.1:4999/module-videos';
		const requestOptions = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ module_name: moduleName() }),
		};

		try {
			const response = await fetch(API_URL, requestOptions);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
			}
			const data = await response.json();
			console.log('Successfully fetched videos:', data);
			return data;
		} catch (err) {
			console.error('Failed to search for videos:', err);
			setError(
				err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
			);
		} finally {
			setIsLoading(false);
		}
	}

	async function appendVideos() {
		const newVideos = await searchVideos();
		if (!newVideos || !Array.isArray(newVideos)) return;

		const fullVideos = Array.from(
			new Map([...(filteredVideos() || []), ...newVideos].map((v: Video) => [String(v.link ?? ''), v])).values()
		);
		setFilteredVideos(fullVideos);
		setAppendedVideos(true);
	}

	async function saveVideos() {
		const videos = filteredVideos();
		if (!videos || videos.length === 0) {
			setError('No videos to save.');
			return;
		}

		try {
			await AppendVideosFile(parentFolder(), moduleName(), videos);
			console.log('Videos saved successfully');
			setAppendedVideos(false);
		} catch (err) {
			console.error('Failed to save videos:', err);
			setError(
				err instanceof Error ? err.message : 'An unexpected error occurred while saving videos.'
			);
		}
	}

	async function searchTools() {
		setIsLoading(true);
		setError(null);

		if (!moduleName() || moduleName().trim() === '') {
			setError('Module name cannot be empty.');
			setIsLoading(false);
			return;
		}

		const API_URL = 'http://127.0.0.1:4999/module-tools';
		const requestOptions = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ module_name: moduleName() }),
		};

		try {
			const response = await fetch(API_URL, requestOptions);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
			}
			const data = await response.json();
			console.log('Successfully fetched tools:', data);
			return data as Tool[];
		} catch (err) {
			console.error('Failed to search for tools:', err);
			setError(
				err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
			);
		} finally {
			setIsLoading(false);
		}
	}

	async function appendTools() {
		const newTools = await searchTools();
		if (!newTools || !Array.isArray(newTools)) return;

		const fullTools = Array.from(
			new Map([...(filteredTools() || []), ...newTools].map((t: Tool) => [String(t.link ?? ''), t])).values()
		);
		setFilteredTools(fullTools);
		setAppendedTools(true);
	}

	async function saveTools() {
		const tools = filteredTools();
		if (!tools || tools.length === 0) {
			setError('No tools to save.');
			return;
		}

		try {
			await AppendToolsFile(parentFolder(), moduleName(), tools);
			console.log('Tools saved successfully');
			setAppendedTools(false);
		} catch (err) {
			console.error('Failed to save tools:', err);
			setError(
				err instanceof Error ? err.message : 'An unexpected error occurred while saving tools.'
			);
		}
	}

	async function DeleteDocument() {
		const links = selectedDocuments();
		if (!links || links.length === 0) {
			setError('No documents selected for deletion.');
			return;
		}
		try {
			await DeleteDocumentsFile(parentFolder(), moduleName(), links);
			// prune from UI (only remove when item has a link and it matches a selected link)
			setFilteredDocuments((prev) => (prev ?? []).filter(d => !(d.link && links.includes(String(d.link)))));
			setSelectedDocuments([]);
			console.log('Documents deleted successfully');
		} catch (err) {
			console.error('Failed to delete documents:', err);
			setError(err instanceof Error ? err.message : 'An unexpected error occurred while deleting documents.');
		}
	}

	async function DeleteVideos() {
		const links = selectedVideos();
		if (!links || links.length === 0) return;
		try {
			await DeleteVideosFile(parentFolder(), moduleName(), links);
			setFilteredVideos((prev) => (prev ?? []).filter(v => !(v.link && links.includes(String(v.link)))));
			setSelectedVideos([]);
			console.log('Videos deleted successfully');
		} catch (err) {
			console.error('Failed to delete videos:', err);
			setError(err instanceof Error ? err.message : 'An unexpected error occurred while deleting videos.');
		}
	}

	async function DeleteTools() {
		const links = selectedTools();
		if (!links || links.length === 0) return;
		try {
			await DeleteToolsFile(parentFolder(), moduleName(), links);
			setFilteredTools((prev) => (prev ?? []).filter(t => !(t.link && links.includes(String(t.link)))));
			setSelectedTools([]);
			console.log('Tools deleted successfully');
		} catch (err) {
			console.error('Failed to delete tools:', err);
			setError(err instanceof Error ? err.message : 'An unexpected error occurred while deleting tools.');
		}
	}

	async function DeleteSelection() {
		await Promise.all([DeleteDocument(), DeleteVideos(), DeleteTools()]);
		setSelection(false);
	}

	return {
		showDocuments,
		setShowDocuments,
		showVideos,
		setShowVideos,
		showTools,
		setShowTools,
		filters,
		setFilters,
		availableTags,
		availableFields,
		availableTypes,
		filteredDocuments,
		setFilteredDocuments,
		filteredVideos,
		setFilteredVideos,
		filteredTools,
		setFilteredTools,
		loadResources,
		searchResources,
		appendDocuments,
		saveDocuments,
		searchVideos,
		appendVideos,
		saveVideos,
		appendTools,
		saveTools,
		appendedDocuments,
		appendedVideos,
		appendedTools,
		selection,
		setSelection,
		DeleteSelection,
		selectedDocuments, setSelectedDocuments,
		selectedVideos, setSelectedVideos,
		selectedTools, setSelectedTools,
	};
}
