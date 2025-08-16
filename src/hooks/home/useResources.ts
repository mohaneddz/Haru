import { createSignal, onMount } from 'solid-js';
import type { FilterState } from '@/types/misc/filters';

import { loadVideos, loadTools, loadDocuments, AppendDocumentsFile, AppendVideosFile, AppendToolsFile } from '@/utils/home/courses/resourcessUtils';
import type { Document, Video, Tool } from '@/types/home/resource';

export default function useResources() {

	const [showDocuments, setShowDocuments] = createSignal(true);
	const [showVideos, setShowVideos] = createSignal(true);
	const [showTools, setShowTools] = createSignal(true);

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
				"module_name": moduleName(),
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
			setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
		} finally {
			// 7. Deactivate loading indicator regardless of outcome
			setIsLoading(false);
		}
	}

	async function appendDocuments() {
		const newDocuments = await searchResources();
		const fullDocuments = Array.from(
			new Map(
				[...(filteredDocuments() || []), ...newDocuments].map(doc => [doc.link, doc])
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
			setError(err instanceof Error ? err.message : 'An unexpected error occurred while saving documents.');
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
			setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	}

	async function appendVideos() {
		const newVideos = await searchVideos();
		if (!newVideos || !Array.isArray(newVideos)) return;

		const fullVideos = Array.from(
			new Map(
				[...(filteredVideos() || []), ...newVideos].map((v: Video) => [v.link, v])
			).values()
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
			setError(err instanceof Error ? err.message : 'An unexpected error occurred while saving videos.');
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
			setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	}

	async function appendTools() {
		const newTools = await searchTools();
		if (!newTools || !Array.isArray(newTools)) return;

		const fullTools = Array.from(
			new Map(
				[...(filteredTools() || []), ...newTools].map((t: Tool) => [t.link, t])
			).values()
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
			setError(err instanceof Error ? err.message : 'An unexpected error occurred while saving tools.');
		}
	}

	const availableTags = [
		'fundamentals',
		'course',
		'exercise',
		'supplement',
		'reference',
		'advanced',
		'beginner',
		'matlab',
		'python',
		'lab',
		'theory',
		'practical',
		'audio',
		'biomedical',
		'communication',
		'image',
		'radar',
		'sensors',
		'speech',
		'wireless',
		'fourier',
		'filtering',
		'sampling',
		'transform',
		'spectral',
		'adaptive',
		'tutorial',
		'software',
		'tools',
		'programming',
		'simulation',
	];

	const availableFields = [
		'Signal Processing',
		'Digital Communications',
		'Biomedical Engineering',
		'Audio Processing',
		'Image Processing',
		'Radar Systems',
		'Machine Learning',
		'Software Development',
		'Mathematics',
		'Programming',
	];

	const availableTypes = [
		'Exercises',
		'Book',
		'Sheet',
		'Paper',
		'Notes',
		'Video',
		'Playlist',
		'Software',
		'Tool',
	];

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
		appendedTools
	};
}
