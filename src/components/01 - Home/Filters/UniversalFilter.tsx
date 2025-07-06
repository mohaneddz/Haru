import { createSignal, For, Show } from "solid-js";
import { Search, Filter, X, Tag, BookOpen, Video, Wrench, GraduationCap } from "lucide-solid";

export interface FilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedFields: string[];
  selectedTypes: string[];
}

interface Props {
  availableTags: string[];
  availableFields?: string[];
  availableTypes?: string[];
  onFilterChange: (filters: FilterState) => void;
  placeholder?: string;
  showFields?: boolean;
  showTypes?: boolean;
  class?: string;
  pageType: 'resources' | 'discover' | 'courses';
}

export default function UniversalFilter(props: Props) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedTags, setSelectedTags] = createSignal<string[]>([]);
  const [selectedFields, setSelectedFields] = createSignal<string[]>([]);
  const [selectedTypes, setSelectedTypes] = createSignal<string[]>([]);
  const [showFilters, setShowFilters] = createSignal(false);

  const updateFilters = () => {
    props.onFilterChange({
      searchQuery: searchQuery(),
      selectedTags: selectedTags(),
      selectedFields: selectedFields(),
      selectedTypes: selectedTypes()
    });
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    updateFilters();
  };

  const toggleTag = (tag: string) => {
    const current = selectedTags();
    const newTags = current.includes(tag) 
      ? current.filter(t => t !== tag)
      : [...current, tag];
    setSelectedTags(newTags);
    updateFilters();
  };

  const toggleField = (field: string) => {
    const current = selectedFields();
    const newFields = current.includes(field) 
      ? current.filter(f => f !== field)
      : [...current, field];
    setSelectedFields(newFields);
    updateFilters();
  };

  const toggleType = (type: string) => {
    const current = selectedTypes();
    const newTypes = current.includes(type) 
      ? current.filter(t => t !== type)
      : [...current, type];
    setSelectedTypes(newTypes);
    updateFilters();
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSelectedFields([]);
    setSelectedTypes([]);
    updateFilters();
  };

  const hasActiveFilters = () => {
    return searchQuery().length > 0 || 
           selectedTags().length > 0 || 
           selectedFields().length > 0 || 
           selectedTypes().length > 0;
  };

  const getPlaceholder = () => {
    if (props.placeholder) return props.placeholder;
    switch (props.pageType) {
      case 'resources': return 'Search documents, videos, and tools...';
      case 'discover': return 'Search courses and content...';
      case 'courses': return 'Search course library...';
      default: return 'Search...';
    }
  };

  const getPageIcon = () => {
    switch (props.pageType) {
      case 'resources': return BookOpen;
      case 'discover': return Video;
      case 'courses': return GraduationCap;
      default: return Search;
    }
  };

  const PageIcon = getPageIcon();

  return (
    <div class={`w-[80%] mx-auto mb-8 p-6 bg-background-light-1/50 backdrop-blur-sm rounded-lg border border-border-light-1 mt-20` + (props.class ? ` ${props.class}` : "")}>
      
      {/* Header with Page Icon and Title */}
      <div class="flex items-center gap-3 mb-4">
        <PageIcon class="w-6 h-6 text-accent" />
        <h2 class="text-xl font-semibold text-accent capitalize">{props.pageType} Filters</h2>
      </div>

      {/* Search Bar */}
      <div class="relative mb-4">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-dark-2" />
        <input
          type="text"
          placeholder={getPlaceholder()}
          value={searchQuery()}
          onInput={(e) => handleSearchInput(e.currentTarget.value)}
          class="w-full pl-10 pr-4 py-3 bg-background-light-2 border border-border-light-2 rounded-lg text-text-light-1 placeholder-text-dark-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        />
        <Show when={searchQuery().length > 0}>
          <button
            onClick={() => handleSearchInput("")}
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-dark-2 hover:text-accent transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </Show>
      </div>

      {/* Filter Toggle Button */}
      <div class="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters())}
          class="flex items-center gap-2 px-4 py-2 bg-background-light-2 border border-border-light-2 rounded-lg text-text-light-1 hover:bg-background-light-3 transition-colors"
        >
          <Filter class="w-4 h-4" />
          Advanced Filters
          <span class={`transition-transform ${showFilters() ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        <Show when={hasActiveFilters()}>
          <button
            onClick={clearAllFilters}
            class="flex items-center gap-2 px-4 py-2 text-accent hover:text-accent-light-1 transition-colors"
          >
            <X class="w-4 h-4" />
            Clear All
          </button>
        </Show>
      </div>

      {/* Advanced Filters */}
      <Show when={showFilters()}>
        <div class="space-y-6 p-4 bg-background-light-2/50 rounded-lg border border-border-light-2">
          
          {/* Tags Filter */}
          <div>
            <div class="flex items-center gap-2 mb-3">
              <Tag class="w-4 h-4 text-accent" />
              <h3 class="text-sm font-medium text-text-light-1">Tags</h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <For each={props.availableTags}>
                {(tag) => (
                  <button
                    onClick={() => toggleTag(tag)}
                    class={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedTags().includes(tag)
                        ? 'bg-accent text-black'
                        : 'bg-background-light-3 text-text-light-1 hover:bg-accent/20 hover:text-accent'
                    }`}
                  >
                    {tag}
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Fields Filter - Only show if fields are provided */}
          <Show when={props.showFields && props.availableFields}>
            <div>
              <div class="flex items-center gap-2 mb-3">
                <BookOpen class="w-4 h-4 text-accent" />
                <h3 class="text-sm font-medium text-text-light-1">Fields</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <For each={props.availableFields}>
                  {(field) => (
                    <button
                      onClick={() => toggleField(field)}
                      class={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        selectedFields().includes(field)
                          ? 'bg-accent text-black'
                          : 'bg-background-light-3 text-text-light-1 hover:bg-accent/20 hover:text-accent'
                      }`}
                    >
                      {field}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Types Filter - Only show if types are provided */}
          <Show when={props.showTypes && props.availableTypes}>
            <div>
              <div class="flex items-center gap-2 mb-3">
                <Wrench class="w-4 h-4 text-accent" />
                <h3 class="text-sm font-medium text-text-light-1">Content Type</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <For each={props.availableTypes}>
                  {(type) => (
                    <button
                      onClick={() => toggleType(type)}
                      class={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        selectedTypes().includes(type)
                          ? 'bg-accent text-black'
                          : 'bg-background-light-3 text-text-light-1 hover:bg-accent/20 hover:text-accent'
                      }`}
                    >
                      {type}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

        </div>
      </Show>

      {/* Active Filters Display */}
      <Show when={hasActiveFilters()}>
        <div class="mt-4 p-3 bg-background-light-2/30 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <Filter class="w-4 h-4 text-accent" />
            <span class="text-sm font-medium text-text-light-1">Active Filters:</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <For each={selectedTags()}>
              {(tag) => (
                <span class="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full flex items-center gap-1">
                  <Tag class="w-3 h-3" />
                  {tag}
                  <button onClick={() => toggleTag(tag)} class="hover:text-accent-light-1">
                    <X class="w-3 h-3" />
                  </button>
                </span>
              )}
            </For>
            <For each={selectedFields()}>
              {(field) => (
                <span class="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full flex items-center gap-1">
                  <BookOpen class="w-3 h-3" />
                  {field}
                  <button onClick={() => toggleField(field)} class="hover:text-accent-light-1">
                    <X class="w-3 h-3" />
                  </button>
                </span>
              )}
            </For>
            <For each={selectedTypes()}>
              {(type) => (
                <span class="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full flex items-center gap-1">
                  <Wrench class="w-3 h-3" />
                  {type}
                  <button onClick={() => toggleType(type)} class="hover:text-accent-light-1">
                    <X class="w-3 h-3" />
                  </button>
                </span>
              )}
            </For>
          </div>
        </div>
      </Show>

    </div>
  );
}
