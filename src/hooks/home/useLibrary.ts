import { createSignal, onMount } from 'solid-js';
import type { FilterState } from '@/types/misc/filters';
import type { Section, CourseContentResponse } from '@/types/home/library';
import { loadCourses, loadCoursesSections } from '@/utils/home/courses/courseUtils';
import { invoke } from '@tauri-apps/api/core';

export default function useLibrary() {
	// filters signal holds the latest requested filter state
	const [filters, _setFilters] = createSignal<FilterState>({
		searchQuery: '',
		selectedTags: [],
		selectedFields: [],
		selectedTypes: [],
	});
	// allSections keeps the canonical data from disk; sections is the derived (filtered) view
	const [allSections, setAllSections] = createSignal<Section[]>([]);
	const [sections, setSections] = createSignal<Section[]>([]);
	const [closedSections, setClosedSections] = createSignal<Set<string>>(new Set());
	const [addModal, setAddModal] = createSignal<boolean>(false);

	const availableTags = ['machine-learning', 'deep-learning', 'computer-vision', 'nlp', 'reinforcement-learning'];
	const availableFields = ['Artificial Intelligence', 'Mathematics', 'Signal Processing', 'Data Science'];
	const availableDifficulties = [
		{ label: 'Beginner', value: 1 },
		{ label: 'Intermediate', value: 2 },
		{ label: 'Advanced', value: 3 },
	];

	// Form state
	const [title, setTitle] = createSignal('');
	const [overview, setOverview] = createSignal('');
	const [description, setDescription] = createSignal('');
	const [tags, setTags] = createSignal<string[]>([]);
	const [fieldVals, setFieldVals] = createSignal<string>('');
	const [difficulty, setDifficulty] = createSignal<number>(1);
	const [duration, setDuration] = createSignal<number>(0);
	const [prerequisites, setPrerequisites] = createSignal<string[]>([]);
	const [topics, setTopics] = createSignal<string[]>([]);

	// UI state
	const [isContentLoading, setIsContentLoading] = createSignal(false);
	const [isSaving, setIsSaving] = createSignal(false);

	const loadAllSections = async () => {
		try {
			const loadedSections = await loadCoursesSections();
			const allSectionsArr = [];
			for (const section of loadedSections) {
				const courses = await loadCourses(section);
				allSectionsArr.push({
					name: section,
					courses: courses.map((course) => ({
						...course,
						field: section,
						tags: course.tags || [],
						difficulty: (course.difficulty ? course.difficulty : 'Beginner') as
							| 'Beginner'
							| 'Intermediate'
							| 'Advanced',
					})),
				});
			}
			console.log('Loaded sections:', allSectionsArr);
			// populate canonical store and apply current filters
			setAllSections(allSectionsArr);
			applyFilters(filters());
		} catch (error) {
			console.error('Error loading sections:', error);
		}
	};

	onMount(loadAllSections);

	// Apply provided filters to the canonical allSections and update sections()
	const applyFilters = (f: FilterState) => {
		const q = (f.searchQuery || '').trim().toLowerCase();
		const tagsFilter = (f.selectedTags || []).map(t => t.toLowerCase());
		const fieldsFilter = (f.selectedFields || []).map(s => s.toLowerCase());
		const typesFilter = (f.selectedTypes || []).map(s => s.toLowerCase());

		const filtered = allSections().reduce<Section[]>((acc, section) => {
			// If fields filter specified, skip whole section if it doesn't match
			if (fieldsFilter.length && !fieldsFilter.includes(section.name.toLowerCase())) {
				return acc;
			}

			const filteredCourses = (section.courses || []).filter(course => {
				// normalize course values
				const titleStr = (course.title || '').toString().toLowerCase();
				const descStr = (course.description || '').toString().toLowerCase();
				const courseTags = (course.tags || []).map((t: string) => t.toLowerCase());
				const difficultyStr = (course.difficulty || '').toString().toLowerCase();

				// Search query: match title OR description OR tags
				if (q) {
					const matchesSearch = titleStr.includes(q) || descStr.includes(q) || courseTags.join(' ').includes(q);
					if (!matchesSearch) return false;
				}

				// Tags: if tagsFilter specified, require ANY match (at least one selected tag present)
				if (tagsFilter.length && !tagsFilter.some(t => courseTags.includes(t))) return false;

				// Types/difficulty: if specified, require course difficulty in typesFilter
				if (typesFilter.length && !typesFilter.includes(difficultyStr)) return false;

				return true;
			});

			if (filteredCourses.length) {
				acc.push({
					...section,
					courses: filteredCourses,
				});
			}
			return acc;
		}, []);

		setSections(filtered);
	};

	// function exposed to consumers (UniversalFilter) to update filters
	const setFilters = (newFilters: FilterState) => {
		_setFilters(newFilters);
		applyFilters(newFilters);
	};

	const GetCourseContent = async () => {
		if (!title().trim()) {
			alert('Please enter a course title first.');
			return;
		}
		setIsContentLoading(true);
		try {
			const response = await fetch('http://localhost:4999/module-info', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ module_name: title() }),
			});
			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || 'Failed to fetch course content');
			}
			const data: CourseContentResponse = await response.json();
			const difficultyMap: { [key: string]: number } = { Beginner: 1, Intermediate: 2, Advanced: 3 };
			setOverview(data.overview);
			setDescription(data.description);
			setTags(data.tags || []);
			setDuration(data.duration);
			setDifficulty(difficultyMap[data.difficulty] || 1);
			setPrerequisites(data.prerequisites || []);
			setTopics(data.topics && data.topics[0] ? data.topics[0]['what we will learn'] : []);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
			alert(`An error occurred: ${errorMessage}`);
		} finally {
			setIsContentLoading(false);
		}
	};

	const resetForm = () => {
		setTitle('');
		setOverview('');
		setDescription('');
		setTags([]);
		setFieldVals('');
		setDifficulty(1);
		setDuration(0);
		setPrerequisites([]);
		setTopics([]);
	};

	const saveCourse = async () => {
		if (!title().trim()) {
			alert('Course title is required.');
			return;
		}
		if (fieldVals().length === 0) {
			alert('At least one field (for the parent folder) is required.');
			return;
		}

		setIsSaving(true);
		try {
			const parentFolder = fieldVals()[0];
			const courseFolder = title();
			const baseModulesPath = 'D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules';

			const difficultyMap: { [key: number]: string } = {
				1: 'Beginner',
				2: 'Intermediate',
				3: 'Advanced',
			};

			// --- MODIFIED ---
			// Assemble the metadata object with the new topics structure.
			const metadata = {
				title: courseFolder,
				description: description(),
				difficulty: difficultyMap[difficulty()],
				duration: `${duration()} weeks`,
				overview: overview(),
				prerequisites: prerequisites(),
				topics: [topics()],
				tags: tags(),
				img: '',
				syllabus: '',
			};

			const parentPath = `${baseModulesPath}\\${parentFolder}`;
			const finalCoursePath = `${parentPath}\\${courseFolder}`;
			const metadataPath = `${finalCoursePath}\\metadata.json`;

			const parentExists = (await invoke('verify_folder', { path: parentPath })) as boolean;
			if (!parentExists) {
				alert(
					`Parent folder "${parentFolder}" does not exist. Please create it first or select an existing field.`
				);
				setIsSaving(false);
				return;
			}

			const tempFolderPath = (await invoke('create_folder', { dir: parentPath })) as string;
			await invoke('rename_path', { oldPath: tempFolderPath, newPath: finalCoursePath });
			await invoke('save_file', {
				path: metadataPath,
				content: JSON.stringify(metadata, null, 2),
			});

			alert(`Course "${courseFolder}" saved successfully!`);

			await loadAllSections();
			setAddModal(false);
			resetForm();
		} catch (error) {
			console.error('Failed to save course:', error);
			alert(`An error occurred while saving: ${error}`);
		} finally {
			setIsSaving(false);
		}
	};

	return {
		sections,
		isContentLoading,
		isSaving,
		addModal,
		setAddModal,
		title,
		overview,
		description,
		tags,
		fieldVals,
		difficulty,
		duration,
		prerequisites,
		topics,
		setTitle,
		setOverview,
		setDescription,
		setTags,
		setFieldVals,
		setDifficulty,
		setDuration,
		setPrerequisites,
		setTopics,
		resetForm,
		saveCourse,
		availableTags,
		availableFields,
		availableDifficulties,
		// setFilters is a function that accepts the FilterState from UniversalFilter
		setFilters,
		setClosedSections,
		closedSections,
        GetCourseContent
	};
}
