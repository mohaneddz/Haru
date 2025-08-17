import { loadDefinitions } from '@/utils/home/dictionary/definitionUtils';
import { createSignal, onMount, For } from 'solid-js';
import DefinitionRow from '@/components/01 - Home/Dictionary/DefinitionRow';
import Modal from '@/components/core/Modal';
import { Trash, Pen, ChevronDown, ChevronUp } from 'lucide-solid';
import UniversalFilter from '@/components/core/UniversalFilter';
import Checkbox from '@/components/core/Input/Checkbox';

export default function Definitions() {

  const [definitions, setDefinitions] = createSignal<Definition[]>([]);
  const [selectedIndices, setSelectedIndices] = createSignal<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [filtered, setFiltered] = createSignal<Definition[]>([]);
  const [sortField, setSortField] = createSignal('dateAdded');

  onMount(async () => {
    const data = await loadDefinitions();
    sortDefinitions('dateAdded', 'asc');
    setDefinitions(data);
    setFiltered(data);
  });

  const sortDefinitions = (field: keyof Definition, order: 'asc' | 'desc') => {
    setSortField(field);
    setFiltered((prev) =>
      [...prev].sort((a: Definition, b: Definition) => {
        if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
        if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
        return 0;
      })
    );
  };

  const searchForTerm = (term: string) => {
    setFiltered(
      definitions().filter((def) =>
        def.term.toLowerCase().includes(term.toLowerCase()) ||
        def.definition.toLowerCase().includes(term.toLowerCase())
      )
    );
  }

  const toggleSelect = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll mt-20">

      <Modal show={showDeleteModal()} onClose={() => setShowDeleteModal(false)}>
        <div class="flex flex-col items-center justify-center p-4">
          <h2 class="text-lg font-semibold mb-4">Delete Selected Definitions</h2>
          <p class="text-sm text-muted mb-4">Are you sure you want to delete the selected definitions?</p>
          <div class="flex space-x-2">
            <button
              class="bg-red-600 text-text px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer"
              onClick={() => {
                setDefinitions((prev) =>
                  prev.filter((_, i) => !selectedIndices().includes(i))
                );
                setFiltered((prev) =>
                  prev.filter((_, i) => !selectedIndices().includes(i))
                );
                setShowDeleteModal(false);
              }}
            >
              Delete
            </button>
            <button
              class="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={showAddModal()} onClose={() => setShowAddModal(false)}>
        <div class="flex flex-col items-center justify-center p-4">
          <h2 class="text-lg font-semibold mb-12">Add New Definition</h2>
          <p class="text-sm text-muted mb-4">Please enter the term and definition for the new entry.</p>
          {/* Add form for new definition here */}
          <textarea
            id='termInput'
            class="bg-transparent px-1 py-2 w-full resize-none mb-4 border border-border-light-1/40"
            placeholder="Enter term"
            rows={1}
            style="white-space:pre-wrap;word-break:break-word;overflow:hidden;"
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
            }}
          />
          <textarea
            id='definitionInput'
            class="bg-transparent px-1 py-2 w-full resize-none mb-4 border border-border-light-1/40"
            placeholder="Enter definition"
            rows={1}
            style="white-space:pre-wrap;word-break:break-word;overflow:hidden;"
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
            }}
          />
          <div class="space-x-2 flex">
            <button
              class="bg-accent-dark-1 text-text px-4 py-2 rounded hover:brightness-105 transition-colors cursor-pointer"
              onClick={() => {
                const newDefinition = {
                  dateAdded: new Date().toISOString(),
                  term: (document.getElementById('termInput') as HTMLTextAreaElement).value,
                  definition: (document.getElementById('definitionInput') as HTMLTextAreaElement).value,
                };
                if (newDefinition.term && newDefinition.definition) {

                  setDefinitions((prev) => [...prev, newDefinition]);
                  setFiltered((prev) => [...prev, newDefinition]);
                  setSelectedIndices((prev) => [...prev, definitions().length]);
                }
                setShowAddModal(false);
              }}
            >
              Add
            </button>
            <button
              class="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>

      </Modal>

      {/* Search Bar */}
      <div class="w-full max-w-[80%] mb-8">
        <UniversalFilter
          onFilterChange={(filters: { searchQuery: string }) => { searchForTerm(filters.searchQuery) }}
          title="Filter Definitions"
          icon={<Trash class='text-accent'/>}
          placeholder="Search definitions..."
        />
      </div>

      <div class="w-full flex flex-col items-center justify-start bg-background-light-1/50 p-4 rounded-lg shadow-md max-w-[80%] border border-border-light-1 mb-24">

        <table class="min-w-full divide-y divide-border">
          <thead>
            <tr>
              <th class="w-12">
                <Checkbox
                  selected={selectedIndices().length === definitions().length && definitions().length > 0}
                  onChange={() => {
                    setSelectedIndices(selectedIndices().length === 0 ? definitions().map((_, i) => i) : []);
                  }}
                />
              </th>
              <th
                class="cursor-pointer px-4 py-2 text-left text-sm font-medium relative"
                style="width: 120px;"
                onclick={() =>
                  sortDefinitions(
                    'dateAdded',
                    sortField() === 'dateAdded' &&
                      filtered()[0]?.dateAdded <= filtered()[filtered().length - 1]?.dateAdded
                      ? 'desc'
                      : 'asc'
                  )
                }
              >
                <span class="gap-2 justify-start text-muted flex flex-nowrap truncate pr-8">
                  Date Added
                  {sortField() === 'dateAdded' && (
                    <span class="absolute right-2 top-1/2 -translate-y-1/2">
                      {filtered()[0]?.dateAdded <= filtered()[filtered().length - 1]?.dateAdded
                        ? <ChevronDown />
                        : <ChevronUp />
                      }
                    </span>
                  )}
                </span>
              </th>
              <th
                class="cursor-pointer px-4 py-2 text-left text-sm font-medium relative"
                style="width: 25%;"
                onclick={() =>
                  sortDefinitions(
                    'term',
                    sortField() === 'term' &&
                      filtered()[0]?.term <= filtered()[filtered().length - 1]?.term
                      ? 'desc'
                      : 'asc'
                  )
                }
              >
                <span class="gap-2 justify-start text-muted flex flex-nowrap truncate">
                  Term
                  {sortField() === 'term' && (
                    <span class="absolute right-2 top-1/2 -translate-y-1/2">
                      {filtered()[0]?.term <= filtered()[filtered().length - 1]?.term
                        ? <ChevronDown />
                        : <ChevronUp />
                      }
                    </span>
                  )}
                </span>
              </th>
              <th
                class="cursor-pointer px-4 py-2 text-left text-sm font-medium relative"
                style="width: auto;"
                onclick={() =>
                  sortDefinitions(
                    'definition',
                    sortField() === 'definition' &&
                      filtered()[0]?.definition <= filtered()[filtered().length - 1]?.definition
                      ? 'desc'
                      : 'asc'
                  )
                }
              >
                <span class="gap-2 justify-start text-muted flex flex-nowrap truncate">
                  Definition
                  {sortField() === 'definition' && (
                    <span class="absolute right-2 top-1/2 -translate-y-1/2">
                      {filtered()[0]?.definition <= filtered()[filtered().length - 1]?.definition
                        ? <ChevronDown />
                        : <ChevronUp />
                      }
                    </span>
                  )}
                </span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <For each={filtered()}>
              {(def, i) => (
                <DefinitionRow
                  dateAdded={def.dateAdded}
                  term={def.term}
                  definition={def.definition}
                  selected={selectedIndices().includes(i())}
                  onSelect={() => toggleSelect(i())}
                />
              )}
            </For>
          </tbody>
        </table>
      </div>

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-12 bg-accent-dark-2 rounded-full p-2
                  hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={setShowDeleteModal.bind(null, true)}>
        <Trash class="w-6 h-6 text-text " />
      </div>

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-12 bg-accent-dark-2 rounded-full p-2
                  hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={setShowAddModal.bind(null, true)}>
        <Pen class="w-6 h-6 text-text " />
      </div>

    </div>
  );
}