import UniversalFilter from "@/components/01 - Home/Filters/ComposableFilter";
import QuickNote from "@/components/01 - Home/Notes/QuickNote";

import { StickyNote } from "lucide-solid";
import { createSignal } from "solid-js";
import { loadQuickNotes, deleteQuicknotes, createQuicknote } from "@/utils/home/useQuickNotes";
import { For, onMount } from "solid-js";

import { Pen, Trash } from "lucide-solid";

export default function Quicknotes() {

  const [quicknotes, setQuicknotes] = createSignal<string[]>(Array.from({ length: 10 }, () => ""));
  const [selectedNotes, setSelectedNotes] = createSignal<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);

  onMount(async () => {
    setQuicknotes(await loadQuickNotes());
  });

  const createQuickNote = async () => {
    const newNotes = [...quicknotes()];
    newNotes.push("");
    setQuicknotes(newNotes);
    createQuicknote(newNotes.length - 1)
  };

  const deleteSelectedNotes = async () => {
    const selected = selectedNotes();
    if (selected.length === 0) return;

    try {
      // Convert selected indices to boolean array
      const booleanArray = quicknotes().map((_, index) => selected.includes(index));
      await deleteQuicknotes(booleanArray);

      // Reload notes from filesystem to reflect the changes
      setQuicknotes(await loadQuickNotes());
      setSelectedNotes([]);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting notes:', error);
    }
  };

  return (
    <main class="w-full h-full ">

      <div class="w-full h-full overflow-y-scroll flex flex-col items-center justify-start">

        <div class="w-full max-w-[80%] mt-20">
          <UniversalFilter
            onFilterChange={() => { }}
            title="Filter Definitions"
            icon={StickyNote}
            placeholder="Search definitions..."
            pageType="dictionary"
            availableFields={[]}
            availableTypes={[]}
          />
        </div>

        <div class="grid grid-cols-4 gap-4 mt-10 w-full max-w-[80%]">
          <For each={quicknotes()}>
            {(_, index) => (
              <QuickNote
                content={() => quicknotes()[index()]}
                index={index}
                selected={() => selectedNotes().includes(index())}
                onSelectionChange={(isSelected) => {
                  setSelectedNotes(prev => {
                    if (isSelected) {
                      return [...prev, index()];
                    } else {
                      return prev.filter(i => i !== index());
                    }
                  });
                }}
                onChange={(newContent) => {
                  setQuicknotes((prev) => {
                    const newNotes = [...prev];
                    newNotes[index()] = newContent;
                    return newNotes;
                  });
                }}
              />
            )}
          </For>
        </div>

        <div
          class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-12 bg-accent-dark-2 rounded-full p-2
               hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
          onClick={() => selectedNotes().length > 0 && setShowDeleteModal(true)}
        >
          <Trash class="w-6 h-6 text-text" />
        </div>

        <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-12 bg-accent-dark-2 rounded-full p-2
                  hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={createQuickNote}>
          <Pen class="w-6 h-6 text-text " />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal() && (
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-background-light-1 p-6 rounded-lg border border-gray-700 max-w-sm w-full mx-4">
              <h3 class="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p class="text-gray-300 mb-6">
                Are you sure you want to delete {selectedNotes().length} selected note{selectedNotes().length > 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <div class="flex gap-3 justify-end">
                <button
                  class="px-4 py-2 bg-gray-600 text-text rounded hover:bg-gray-500 transition"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 bg-red-600 text-text rounded hover:bg-red-500 transition"
                  onClick={deleteSelectedNotes}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
