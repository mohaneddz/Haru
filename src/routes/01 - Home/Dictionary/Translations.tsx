import { For } from 'solid-js';
import TranslationRow from '@/components/01 - Home/Dictionary/TranslationRow';
import Modal from '@/components/core/Modal';
import { Trash, Pen, RefreshCw, ChevronDown, ChevronUp } from 'lucide-solid';
import UniversalFilter from '@/components/core/UniversalFilter';
import Checkbox from '@/components/core/Input/Checkbox';
import { useTranslations } from '@/hooks/useTranslations';

export default function Translation() {
  const {
    translations,
    selectedIndices,
    setSelectedIndices,
    showDeleteModal,
    setShowDeleteModal,
    showAddModal,
    setShowAddModal,
    filtered,
    sortField,
    sortTranslations,
    searchForTerm,
    toggleSelect,
    deleteSelected,
    addTranslation,
    editTranslation,
    refreshTranslations,
  } = useTranslations();

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll mt-20">

      <Modal show={showDeleteModal()} onClose={() => setShowDeleteModal(false)}>
        <div class="flex flex-col items-center justify-center p-4">
          <h2 class="text-lg font-semibold mb-4">Delete Selected Translations</h2>
          <p class="text-sm text-muted mb-4">Are you sure you want to delete the selected translations?</p>
          <div class="flex space-x-2">
            <button
              class="bg-red-600 text-text px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer"
              onClick={deleteSelected}
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
          <h2 class="text-lg font-semibold mb-12">Add New Translation</h2>
          <p class="text-sm text-muted mb-4">Please enter the term, translation, from, and to for the new entry.</p>
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
            placeholder="Enter translation"
            rows={1}
            style="white-space:pre-wrap;word-break:break-word;overflow:hidden;"
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
            }}
          />
          <textarea
            id='fromInput'
            class="bg-transparent px-1 py-2 w-full resize-none mb-4 border border-border-light-1/40"
            placeholder="Enter from (e.g., EN)"
            rows={1}
            style="white-space:pre-wrap;word-break:break-word;overflow:hidden;"
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
            }}
          />
          <textarea
            id='toInput'
            class="bg-transparent px-1 py-2 w-full resize-none mb-4 border border-border-light-1/40"
            placeholder="Enter to (e.g., AR)"
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
                const term = (document.getElementById('termInput') as HTMLTextAreaElement).value;
                const translation = (document.getElementById('translationInput') as HTMLTextAreaElement).value;
                const from = (document.getElementById('fromInput') as HTMLTextAreaElement).value;
                const to = (document.getElementById('toInput') as HTMLTextAreaElement).value;
                addTranslation(from, to, term, translation);
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
          onFilterChange={(filters) => { searchForTerm(filters.searchQuery) }}
          title="Filter Translations"
          icon={<Trash class='text-accent' />}
          placeholder="Search translations..."
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
                class="cursor-pointer px-4 py-2 text-left text-sm font-medium relative w-[120px]"
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
                class="cursor-pointer px-4 py-2 text-left text-sm font-medium relative w-[60px]"
                onclick={() =>
                  sortTranslations(
                    'from',
                    sortField() === 'from' &&
                      filtered()[0]?.from <= filtered()[filtered().length - 1]?.from
                      ? 'desc'
                      : 'asc'
                  )
                }
              >
                <span class="gap-2 justify-start text-muted flex flex-nowrap truncate">
                  From
                  {sortField() === 'from' && (
                    <span class="absolute right-2 top-1/2 -translate-y-1/2">
                      {filtered()[0]?.from <= filtered()[filtered().length - 1]?.from
                        ? <ChevronDown />
                        : <ChevronUp />
                      }
                    </span>
                  )}
                </span>
              </th>
              <th
                class="cursor-pointer px-4 py-2 text-left text-sm font-medium relative w-[80px]"
                onclick={() =>
                  sortTranslations(
                    'to',
                    sortField() === 'to' &&
                      filtered()[0]?.to <= filtered()[filtered().length - 1]?.to
                      ? 'desc'
                      : 'asc'
                  )
                }
              >
                <span class="gap-2 justify-start text-muted flex flex-nowrap truncate">
                  To
                  {sortField() === 'to' && (
                    <span class="absolute right-2 top-1/2 -translate-y-1/2">
                      {filtered()[0]?.to <= filtered()[filtered().length - 1]?.to
                        ? <ChevronDown />
                        : <ChevronUp />
                      }
                    </span>
                  )}
                </span>
              </th>
              <th
                class="cursor-pointer px-4 py-2 text-left text-sm font-medium relative w-[30%]"
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
                  from={tr.from}
                  to={tr.to}
                  term={tr.term}
                  translation={tr.translation}
                  selected={selectedIndices().includes(i())}
                  onSelect={() => toggleSelect(i())}
                  onEdit={(field, value) => {
                    const index = translations().findIndex(t => t === tr);
                    if (index !== -1) editTranslation(index, field, value);
                  }}
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

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-36 right-12 bg-accent-dark-2 rounded-full p-2
                  hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={refreshTranslations}>
        <RefreshCw class="w-6 h-6 text-text " />
      </div>

    </div>
  );
}