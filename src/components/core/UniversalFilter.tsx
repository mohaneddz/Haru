import { createSignal, For, Show, JSX } from "solid-js";

import Search from "lucide-solid/icons/search";
import Filter from "lucide-solid/icons/filter";
import X from "lucide-solid/icons/x";
import Tag from "lucide-solid/icons/tag";
import BookOpen from "lucide-solid/icons/book-open";
import Wrench from "lucide-solid/icons/wrench";

import { UniversalFilterProps } from "@/types/misc/filters";

import DropdownFilter from "@/components/core/DropdownFilter";

export default function UniversalFilter(props: UniversalFilterProps) {
  // Signals for managing filter state
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedTags, setSelectedTags] = createSignal<string[]>([]);
  const [selectedFields, setSelectedFields] = createSignal<string[]>([]);
  const [selectedTypes, setSelectedTypes] = createSignal<string[]>([]);

  // Notifies parent component of any filter changes
  const notifyParentOfChange = () => {
    if (props.onFilterChange) {
      // If the parent component doesn't need tags/fields/types
      // (checked by examining if these props were provided)
      if (!props.availableTags && !props.availableFields && !props.availableTypes) {
        // Just send the search query string for simpler use cases
        props.onFilterChange({
          searchQuery: searchQuery(),
          selectedTags: [],
          selectedFields: [],
          selectedTypes: [],
        });
      } else {
        // Send the full filter object for advanced use cases
        props.onFilterChange({
          searchQuery: searchQuery(),
          selectedTags: selectedTags(),
          selectedFields: selectedFields(),
          selectedTypes: selectedTypes(),
        });
      }
    }
  };

  // Handler for the search input
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    notifyParentOfChange();
  };

  // Generic toggle function for any filter category
  const toggleFilter = (
    item: string,
    selectedItems: () => string[],
    setSelectedItems: (items: string[]) => void
  ) => {
    const currentItems = selectedItems();
    const newItems = currentItems.includes(item)
      ? currentItems.filter(i => i !== item)
      : [...currentItems, item];
    setSelectedItems(newItems);
    notifyParentOfChange();
  };

  // Specific handlers for each filter type
  const toggleTag = (tag: string) => toggleFilter(tag, selectedTags, setSelectedTags);
  const toggleField = (field: string) => toggleFilter(field, selectedFields, setSelectedFields);
  const toggleType = (type: string) => toggleFilter(type, selectedTypes, setSelectedTypes);

  // Clears all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSelectedFields([]);
    setSelectedTypes([]);
    notifyParentOfChange();
  };

  // Computed signal to check if any filters are active
  const hasActiveFilters = () =>
    searchQuery().length > 0 ||
    selectedTags().length > 0 ||
    selectedFields().length > 0 ||
    selectedTypes().length > 0;

  return (
    <div class={`mx-auto p-6 bg-[#101827] rounded-lg border border-sidebar-light-3 text-gray-300 ${props.class || ""}`}>

      {/* Header Section */}
      <div class="flex items-center gap-3 mb-4">
        {props.icon}
        <p class="text-2xl font-semibold text-accent">{props.title}</p>
      </div>

      {/* Search Bar */}
      <div class="relative mb-4">
        <Search class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder={props.placeholder}
          value={searchQuery()}
          onInput={(e) => handleSearchInput(e.currentTarget.value)}
          class="w-full pl-12 pr-4 py-3 bg-[#1D293E] border border-sidebar-light-3 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring- transition-all"
        />
      </div>

      <Show when={props.availableTags && props.tagsLabel}>
        {/* Dropdown Filters Row */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DropdownFilter
            icon={<Tag class="w-5 h-5 text-gray-500" />}
            label={props.tagsLabel!}
            items={props.availableTags!}
            selectedItems={selectedTags()}
            onToggleItem={toggleTag}
          />
          <Show when={props.availableFields && props.fieldsLabel}>
            <DropdownFilter
              icon={<Tag class="w-5 h-5 text-gray-500" />}
              label={props.fieldsLabel!}
              items={props.availableFields!}
              selectedItems={selectedFields()}
              onToggleItem={toggleField}
            />
          </Show>
          <Show when={props.availableTypes && props.typesLabel}>
            <DropdownFilter
              icon={<Tag class="w-5 h-5 text-gray-500" />}
              label={props.typesLabel!}
              items={props.availableTypes!}
              selectedItems={selectedTypes()}
              onToggleItem={toggleType}
            />
          </Show>
        </div>
      </Show>

      {/* Active Filters Display */}
      <Show when={hasActiveFilters()}>
        <div class="mt-6 pt-4 border-t border-[#3A4B67]">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-2">
              <Filter class="w-4 h-4 text-accent" />
              <span class="text-sm font-medium text-gray-300">Active Filters:</span>
            </div>
            <button
              onClick={clearAllFilters}
              class="flex items-center gap-1 text-sm text-accent hover:text-white transition-colors"
            >
              <X class="w-4 h-4" />
              Clear All
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <For each={selectedTags()}>
              {(tag) => <ActiveFilterBadge label={tag} icon={<Tag class="w-3 h-3" />} onRemove={() => toggleTag(tag)} />}
            </For>
            <For each={selectedFields()}>
              {(field) => <ActiveFilterBadge label={field} icon={<BookOpen class="w-3 h-3" />} onRemove={() => toggleField(field)} />}
            </For>
            <For each={selectedTypes()}>
              {(type) => <ActiveFilterBadge label={type} icon={<Wrench class="w-3 h-3" />} onRemove={() => toggleType(type)} />}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}

// Badge to display an active filter
const ActiveFilterBadge = (props: { label: string; icon: JSX.Element; onRemove: () => void }) => (
  <span class="flex items-center gap-1.5 px-2.5 py-1 bg-[#66D9EF]/10 text-[#66D9EF] text-xs font-medium rounded-full">
    {props.icon}
    {props.label}
    <button onClick={props.onRemove} class="ml-1 rounded-full hover:bg-white/20" aria-label={`Remove ${props.label} filter`}>
      <X class="w-3 h-3" />
    </button>
  </span>
);