import { createSignal, onMount } from 'solid-js';
import { loadDefinitions } from '@/utils/home/dictionary/definitionUtils';
import { saveFile } from '@/utils/core/appdata';

export function useDefinitions() {
	const [definitions, setDefinitions] = createSignal<Definition[]>([]);
	const [selectedIndices, setSelectedIndices] = createSignal<number[]>([]);
	const [showDeleteModal, setShowDeleteModal] = createSignal(false);
	const [showAddModal, setShowAddModal] = createSignal(false);
	const [filtered, setFiltered] = createSignal<Definition[]>([]);
	const [sortField, setSortField] = createSignal<keyof Definition>('dateAdded');

	// Load definitions on mount
	onMount(async () => {
		const data = await loadDefinitions();
		setDefinitions(data);
		setFiltered(data);
		sortDefinitions('dateAdded', 'asc');
	});

	// Sort filtered definitions
	const sortDefinitions = (field: keyof Definition, order: 'asc' | 'desc') => {
		setSortField(field);
		setFiltered((prev) =>
			[...prev].sort((a, b) => {
				if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
				if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
				return 0;
			})
		);
	};

	// Search definitions
	const searchForTerm = (term: string) => {
		const lower = term.toLowerCase();
		setFiltered(
			definitions().filter(
				(def) =>
					def.term.toLowerCase().includes(lower) ||
					def.definition.toLowerCase().includes(lower)
			)
		);
	};

	// Toggle selection
	const toggleSelect = (idx: number) => {
		setSelectedIndices((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
	};

	// Delete selected definitions
	const deleteSelected = () => {
		const newDefinitions = definitions().filter((_, i) => !selectedIndices().includes(i));
		setDefinitions(newDefinitions);
		setFiltered(newDefinitions);
		setSelectedIndices([]);
		setShowDeleteModal(false);
		saveFile('definitions.json', JSON.stringify(newDefinitions, null, 2));
	};

	// Add a new definition
	const addDefinition = (term: string, definition: string) => {
		if (!term || !definition) return;

		const newDefinition: Definition = {
			dateAdded: new Date().toISOString(),
			term,
			definition,
		};

		const updatedDefinitions = [...definitions(), newDefinition];
		setDefinitions(updatedDefinitions);
		setFiltered(updatedDefinitions);
		setSelectedIndices((prev) => [...prev, updatedDefinitions.length - 1]);
		setShowAddModal(false);
		saveFile('definitions.json', JSON.stringify(updatedDefinitions, null, 2));
	};

	const refreshDefinitions = async () => {
		const data = await loadDefinitions();
		setDefinitions(data);
		setFiltered(data);
		sortDefinitions('dateAdded', 'asc');
	};

	return {
		definitions,
		selectedIndices,
		setSelectedIndices,
		showDeleteModal,
		setShowDeleteModal,
		showAddModal,
		setShowAddModal,
		filtered,
		sortField,
		sortDefinitions,
		searchForTerm,
		toggleSelect,
		deleteSelected,
		addDefinition,
		refreshDefinitions,
	};
}
