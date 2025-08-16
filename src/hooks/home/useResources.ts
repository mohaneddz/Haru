import { createSignal, onMount } from 'solid-js';
import type { FilterState } from '@/types/misc/filters';

import { loadVideos, loadTools, loadDocuments } from '@/utils/home/courses/resourcessUtils';
import type { Document, Video, Tool } from '@/types/home/resource';

export default function useResources() {

	const [showDocuments, setShowDocuments] = createSignal(true);
	const [showVideos, setShowVideos] = createSignal(true);
	const [showTools, setShowTools] = createSignal(true);

	const [filteredDocuments, setFilteredDocuments] = createSignal<Document[] | null>([]);
	const [filteredVideos, setFilteredVideos] = createSignal<Video[] | null>([]);
	const [filteredTools, setFilteredTools] = createSignal<Tool[] | null>([]);

	const [moduleName, setModuleName] = createSignal<string>('');

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
		console.log(path);

		const pathParts = path.split('/');
		const modulename = pathParts.pop();
		const parentname = pathParts.pop();
		setModuleName(modulename || '');

		console.log(modulename);
		console.log(parentname);

		const videos = await loadVideos(parentname || 'defaultParent', modulename || 'defaultModule');
		const tools = await loadTools(parentname || 'defaultParent', modulename || 'defaultModule');
		const documents = await loadDocuments(parentname || 'defaultParent', modulename || 'defaultModule');

		setFilteredDocuments(documents);
		setFilteredVideos(videos);
		setFilteredTools(tools);
	}

	async function searchResources(setIsLoading: (loading: boolean) => void, setDocuments: (docs: Document[]) => void, setError: (error: string | null) => void) {
		// 1. Reset previous state and activate loading indicator
		setIsLoading(true);
		setError(null);
		setDocuments([]); // Clear previous results

		if (!moduleName() || moduleName().trim() === '') {
			setError('Module name cannot be empty.');
			setIsLoading(false);
			return;
		}

		// 2. Define the API endpoint and request configuration
		const API_URL = 'http://127.0.0.1:4999/module-documents'; // Your backend URL
		const requestOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				module_name: moduleName,
			}),
		};

		try {
			// 3. Make the API call
			const response = await fetch(API_URL, requestOptions);

			// 4. Handle non-successful responses (e.g., 404, 500)
			if (!response.ok) {
				// Try to parse the error message from the backend
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
			}
			// 5. Handle successful response
			const data = await response.json();

			setDocuments(data);
			console.log('Successfully fetched documents:', data);
		} catch (err) {
			// 6. Handle network errors or errors thrown from the response check
			console.error('Failed to search for resources:', err);
			setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
		} finally {
			// 7. Deactivate loading indicator regardless of outcome
			setIsLoading(false);
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
		searchResources
	};
}
