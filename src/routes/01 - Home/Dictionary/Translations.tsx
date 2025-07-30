import { loadTranslations } from '@/utils/dictionary/loadTranslations';
import { createSignal, onMount, For } from 'solid-js';
import TranslationRow from '@/components/01 - Home/Dictionary/TranslationRow';
import Modal from '@/components/core/Modal';
import { Trash, Pen, ChevronDown, ChevronUp } from 'lucide-solid';
import UniversalFilter from '@/components/01 - Home/Filters/ComposableFilter';
import Checkbox from '@/components/core/Input/Checkbox';

export default function Translation() {

  const [translations, setTranslations] = createSignal<Translation[]>([]);
  const [selectedIndices, setSelectedIndices] = createSignal<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [showAddModal, setShowAddModal] = createSignal(false);

  const [filtered, setFiltered] = createSignal<Translation[]>([]);
  const [sortField, setSortField] = createSignal('dateAdded');

  onMount(async () => {
    const data = await loadTranslations();
    sortTranslations('dateAdded', 'asc');
    setTranslations(data);
    setFiltered(data);
  });

  const sortTranslations = (field: keyof Translation, order: 'asc' | 'desc') => {
    setSortField(field);
    setFiltered((prev) =>
      [...prev].sort((a: Translation, b: Translation) => {
        if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
        if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
        return 0;
      })
    );
  };

  const searchForTerm = (term: string) => {
    setFiltered(
      translations().filter((tr) =>
        tr.term.toLowerCase().includes(term.toLowerCase()) ||
        tr.translation.toLowerCase().includes(term.toLowerCase())
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
          <h2 class="text-lg font-semibold mb-4">Delete Selected Translations</h2>
          <p class="text-sm text-muted mb-4">Are you sure you want to delete the selected translations?</p>
          <div class="flex space-x-2">
            <button
              class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer"
              onClick={() => {
                setTranslations((prev) =>
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
            id='translationInput'
            class="bg-transparent px-1 py-2 w-full resize-none mb-4 border border-border-light-1/40"
            placeholder="Enter Translation"
            rows={1}
            style="white-space:pre-wrap;word-break:break-word;overflow:hidden;"
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
            }}
          />
          <div class="space-x-2 flex">
            <button
              class="bg-accent-dark-1 text-white px-4 py-2 rounded hover:brightness-105 transition-colors cursor-pointer"
              onClick={() => {
                const newTranslation = {
                  dateAdded: new Date().toISOString(),
                  term: (document.getElementById('termInput') as HTMLTextAreaElement).value,
                  translation: (document.getElementById('translationInput') as HTMLTextAreaElement).value,
                };
                if (newTranslation.term && newTranslation.translation) {

                  setTranslations((prev) => [...prev, newTranslation]);
                  setFiltered((prev) => [...prev, newTranslation]);
                  setSelectedIndices((prev) => [...prev, translations().length]);
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
      <div class="w-full max-w-[80%]">
        <UniversalFilter
          onFilterChange={(filters) => { searchForTerm(filters.searchQuery) }}
          title="Filter Translations"
          icon={Trash}
          placeholder="Search translations..."
          pageType="dictionary"
          availableFields={[]}
          availableTypes={[]}
        />
      </div>

      <div class="w-full flex flex-col items-center justify-start bg-background-light-1/50 p-4 rounded-lg shadow-md max-w-[80%] border border-border-light-1">

        <table class="min-w-full divide-y divide-border">
          <thead>
            <tr>
              <th class="w-12">
                <Checkbox
                  selected={selectedIndices().length === translations().length && translations().length > 0}
                  onChange={() => {
                    setSelectedIndices(selectedIndices().length === 0 ? translations().map((_, i) => i) : []);
                  }} />
              </th>
              <th
                class="cursor-pointer px-4 py-2 text-left text-sm font-medium relative"
                style="width: 120px;"
                onclick={() =>
                  sortTranslations(
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
                style="width: 20%;"
                onclick={() =>
                  sortTranslations(
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
                  sortTranslations(
                    'translation',
                    sortField() === 'translation' &&
                      filtered()[0]?.translation <= filtered()[filtered().length - 1]?.translation
                      ? 'desc'
                      : 'asc'
                  )
                }
              >
                <span class="gap-2 justify-start text-muted flex flex-nowrap truncate">
                  Translation
                  {sortField() === 'translation' && (
                    <span class="absolute right-2 top-1/2 -translate-y-1/2">
                      {filtered()[0]?.translation <= filtered()[filtered().length - 1]?.translation
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
              {(tr, i) => (
                <TranslationRow
                  dateAdded={tr.dateAdded}
                  term={tr.term}
                  translation={tr.translation}
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
        <Trash class="w-6 h-6 text-white " />
      </div>

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-12 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={setShowAddModal.bind(null, true)}>
        <Pen class="w-6 h-6 text-white " />
      </div>

    </div>
  );
}