import { JSX } from 'solid-js';

export interface FilterState {
	searchQuery: string;
	selectedTags: string[];
	selectedFields: string[];
	selectedTypes: string[];
}

export interface UniversalFilterProps {
	onFilterChange: (filters: FilterState) => void;
	title: string;
	icon: JSX.Element;
	placeholder: string;
	availableTags?: string[];
	tagsLabel?: string;
	availableFields?: string[];
	fieldsLabel?: string;
	availableTypes?: string[];
	typesLabel?: string;
	class?: string;
}
