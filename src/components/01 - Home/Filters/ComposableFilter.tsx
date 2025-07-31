import { createSignal, For, Show } from "solid-js";
import { Search, X, Tag, BookOpen, Wrench, ChevronDown } from "lucide-solid";

export interface FilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedFields: string[];
  selectedTypes: string[];
}

export interface FilterConfig {
  enabled: boolean;
  options: string[];
  title: string;
  icon: any;
}

interface Props {
  onFilterChange: (filters: FilterState) => void;
  placeholder?: string;
  class?: string;
  title: string;
  icon: any;
  
  // Composable filter configurations
  tagsConfig?: FilterConfig;
  fieldsConfig?: FilterConfig;
  typesConfig?: FilterConfig;
  
  // Legacy props for backward compatibility
  pageType?: string;
  availableTags?: string[];
  availableFields?: string[];
  availableTypes?: string[];
  showFields?: boolean;
  showTypes?: boolean;
}

export default function UniversalFilter(props: Props) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedTags, setSelectedTags] = createSignal<string[]>([]);
  const [selectedFields, setSelectedFields] = createSignal<string[]>([]);
  const [selectedTypes, setSelectedTypes] = createSignal<string[]>([]);
  
  // Dropdown states
  const [showTagsDropdown, setShowTagsDropdown] = createSignal(false);
  const [showFieldsDropdown, setShowFieldsDropdown] = createSignal(false);
  const [showTypesDropdown, setShowTypesDropdown] = createSignal(false);

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
    return selectedTags().length > 0 || 
           selectedFields().length > 0 || 
           selectedTypes().length > 0;
  };

  const getPlaceholder = () => {
    if (props.placeholder) return props.placeholder;
    // Fallback to pageType if provided for backward compatibility
    switch (props.pageType) {
      case 'resources': return 'Search documents, videos, and tools...';
      case 'discover': return 'Search courses and content...';
      case 'courses': return 'Search course library...';
      case 'flashcards': return 'Search flashcards...';
      default: return 'Search...';
    }
  };

  // Get configuration for each filter type (new composable way or legacy way)
  const getTagsConfig = () => {
    if (props.tagsConfig) return props.tagsConfig;
    return {
      enabled: !!props.availableTags,
      options: props.availableTags || [],
      title: "Tags",
      icon: Tag
    };
  };

  const getFieldsConfig = () => {
    if (props.fieldsConfig) return props.fieldsConfig;
    return {
      enabled: !!(props.showFields && props.availableFields),
      options: props.availableFields || [],
      title: "Fields",
      icon: BookOpen
    };
  };

  const getTypesConfig = () => {
    if (props.typesConfig) return props.typesConfig;
    return {
      enabled: !!(props.showTypes && props.availableTypes),
      options: props.availableTypes || [],
      title: "Content Type",
      icon: Wrench
    };
  };

  const PageIcon = props.icon;
  const tagsConfig = getTagsConfig();
  const fieldsConfig = getFieldsConfig();
  const typesConfig = getTypesConfig();

  return (
    <div class={`w-full mx-auto mb-8 p-4 bg-background-light-1/50 backdrop-blur-sm rounded-lg border border-border-light-1 ${props.class || ''}`}>
      
      {/* Header with Page Icon and Title */}
      <div class="flex items-center justify-between mb-6">

        <div class="flex items-center gap-3">
          <PageIcon class="w-6 h-6 text-accent" />
          <p class="text-lg font-semibold text-accent">{props.title}</p>
        </div>
        
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

      {/* Search Bar */}
      <div class="relative mb-6">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-dark-3" />
        <input
          type="text"
          placeholder={getPlaceholder()}
          value={searchQuery()}
          onInput={(e) => handleSearchInput(e.currentTarget.value)}
          class="w-full pl-10 pr-4 py-3 bg-background-light-2 border border-border-light-2 rounded-lg text-text-light-1 placeholder-text-dark-3/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
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

      {/* Filter Cards */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Tags Filter Card */}
        <Show when={tagsConfig.enabled}>
          <div class="bg-background-light-2/50 rounded-lg border border-border-light-2 p-2">
            <button
              onClick={() => setShowTagsDropdown(!showTagsDropdown())}
              class="w-full flex items-center justify-between text-left"
            >
              <div class="flex items-center gap-2">
                <tagsConfig.icon class="w-4 h-4 text-accent" />
                <div class="text-accent text-sm font-medium mb-0">{tagsConfig.title}</div>
                <Show when={selectedTags().length > 0}>
                  <span class="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                    {selectedTags().length}
                  </span>
                </Show>
              </div>
              <ChevronDown class={`w-4 h-4 text-text-dark-2 transition-transform ${showTagsDropdown() ? 'rotate-180' : ''}`} />
            </button>
            
            <Show when={showTagsDropdown()}>
              <div class="space-y-2 max-h-40 overflow-y-auto mt-4">
                <For each={tagsConfig.options}>
                  {(tag) => (
                    <button
                      onClick={() => toggleTag(tag)}
                      class={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
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
            </Show>
          </div>
        </Show>

        {/* Fields Filter Card */}
        <Show when={fieldsConfig.enabled}>
          <div class="bg-background-light-2/50 rounded-lg border border-border-light-2 p-2">
            <button
              onClick={() => setShowFieldsDropdown(!showFieldsDropdown())}
              class="w-full flex items-center justify-between text-left"
            >
              <div class="flex items-center gap-2">
                <fieldsConfig.icon class="w-4 h-4 text-accent" />
                <div class="text-accent text-sm font-medium mb-0">{fieldsConfig.title}</div>
                <Show when={selectedFields().length > 0}>
                  <span class="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                    {selectedFields().length}
                  </span>
                </Show>
              </div>
              <ChevronDown class={`w-4 h-4 text-text-dark-2 transition-transform ${showFieldsDropdown() ? 'rotate-180' : ''}`} />
            </button>
            
            <Show when={showFieldsDropdown()}>
              <div class="space-y-2 max-h-40 overflow-y-auto mt-4">
                <For each={fieldsConfig.options}>
                  {(field) => (
                    <button
                      onClick={() => toggleField(field)}
                      class={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
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
            </Show>
          </div>
        </Show>

        {/* Types Filter Card */}
        <Show when={typesConfig.enabled}>
          <div class="bg-background-light-2/50 rounded-lg border border-border-light-2 p-2">
            <button
              onClick={() => setShowTypesDropdown(!showTypesDropdown())}
              class="w-full flex items-center justify-between text-left"
            >
              <div class="flex items-center gap-2">
                <typesConfig.icon class="w-4 h-4 text-accent" />
                <div class="text-accent text-sm font-medium mb-0">{typesConfig.title}</div>
                <Show when={selectedTypes().length > 0}>
                  <span class="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                    {selectedTypes().length}
                  </span>
                </Show>
              </div>
              <ChevronDown class={`w-4 h-4 text-text-dark-2 transition-transform ${showTypesDropdown() ? 'rotate-180' : ''}`} />
            </button>
            
            <Show when={showTypesDropdown()}>
              <div class="space-y-2 max-h-40 overflow-y-auto mt-4">
                <For each={typesConfig.options}>
                  {(type) => (
                    <button
                      onClick={() => toggleType(type)}
                      class={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
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
            </Show>
          </div>
        </Show>

      </div>

      {/* Active Filters Display */}
      <Show when={hasActiveFilters()}>
        <div class="mt-6 p-2 bg-background-light-2/30 rounded-lg">
          <div class="flex items-center gap-2">
            <Tag class="w-4 h-4 text-accent" />
            <div class="text-accent text-sm font-medium mb-0">Active Filters:</div>
          </div>
          <div class="flex flex-wrap gap-2 mt-4">
            <For each={selectedTags()}>
              {(tag) => (
                <span class="px-3 py-1 bg-accent/20 text-accent text-xs rounded-full flex items-center gap-1">
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
                <span class="px-3 py-1 bg-accent/20 text-accent text-xs rounded-full flex items-center gap-1">
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
                <span class="px-3 py-1 bg-accent/20 text-accent text-xs rounded-full flex items-center gap-1">
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