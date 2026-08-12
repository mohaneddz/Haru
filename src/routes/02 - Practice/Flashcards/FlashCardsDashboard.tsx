import UniversalFilter from "@/components/core/UniversalFilter";
import FlashDeck from "@/components/02 - Practice/training/Flashcards/FlashDeckCard";
import Modal from "@/components/core/Modal";
import { onMount, createSignal, For, createMemo } from "solid-js"; // Import createMemo
import { loadFlashDecks, saveFlashDecks, loadFlashcards } from "@/utils/training/flashcardUtils";

import Pen from 'lucide-solid/icons/pen';
import Flame from 'lucide-solid/icons/flame';

interface Deck {
  title: string;
  description: string;
  id: number;
  filename: string;
}

export default function FlashCardsDashboard() {

  const [showAddModal, setShowAddModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [deckToDelete, setDeckToDelete] = createSignal<number | null>(null);
  const [decks, setDecks] = createSignal<Deck[]>([]);
  const [searchQuery, setSearchQuery] = createSignal(""); // 1. Signal for the search query
  const [newTitle, setNewTitle] = createSignal("");
  const [newDescription, setNewDescription] = createSignal("");
  const [deckStatuses, setDeckStatuses] = createSignal<{id: number, hasFlashcards: boolean}[]>([]);

  onMount(async () => {
    const decks = await loadFlashDecks();
    setDecks(decks);
    const statuses = await Promise.all(decks.map(async (deck: { id: any; filename?: string | undefined; }) => ({
      id: deck.id,
      hasFlashcards: (await loadFlashcards(deck)).length > 0
    })));
    setDeckStatuses(statuses);
  });

  // add handler to accept the object emitted by UniversalFilter
  const handleFilterChange = (filterData: any) => {
    if (typeof filterData === "string") {
      setSearchQuery(filterData);
    } else if (filterData && typeof filterData === "object") {
      setSearchQuery(filterData.searchQuery || "");
    }
  };

  // 2. Create a memoized signal for filtered decks
  const filteredDecks = createMemo(() => {
    const query = searchQuery().toLowerCase();
    if (!query) {
      return decks(); // If no query, return all decks
    }
    return decks().filter(
      (deck) =>
        deck.title.toLowerCase().includes(query) ||
        deck.description.toLowerCase().includes(query)
    );
  });

  const addDeck = async () => {
    const title = newTitle().trim();
    const description = newDescription().trim();
    if (!title) return; // Prevent adding empty title
    const currentDecks = decks() || [];
    const newId = currentDecks.length > 0 ? Math.max(...currentDecks.map(d => d.id)) + 1 : 1;
    const newDeck: Deck = {
      title,
      description,
      id: newId,
      filename: `${newId}.csv`
    };
    const updatedDecks = [...currentDecks, newDeck];
    setDecks(updatedDecks);
    setDeckStatuses([...deckStatuses(), { id: newId, hasFlashcards: false }]);
    await saveFlashDecks(updatedDecks);
    setNewTitle("");
    setNewDescription("");
    setShowAddModal(false);
  };

  const deleteDeck = async () => {
    const deckId = deckToDelete();
    if (deckId !== null) {
      const updatedDecks = decks().filter(deck => deck.id !== deckId);
      setDecks(updatedDecks);
      setDeckStatuses(deckStatuses().filter(status => status.id !== deckId));
      await saveFlashDecks(updatedDecks);
    }
    setDeckToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <div class="w-full h-screen flex flex-col items-center justify-start overflow-hidden">

      <Modal onClose={() => setShowAddModal(false)} show={showAddModal()}>
        <div class="flex flex-col gap-4 p-6">
          <h2 class="text-2xl font-bold text-accent">Add New Deck</h2>
          <input type="text" placeholder="Deck Title" class="p-2 border border-gray-500 rounded-md" value={newTitle()} onInput={(e) => setNewTitle(e.target.value)} />
          <textarea placeholder="Deck Description" class="p-2 border border-gray-500 rounded-md h-24" value={newDescription()} onInput={(e) => setNewDescription(e.target.value)}></textarea>
          <div class="center">
            <button class="bg-accent text-text px-4 py-2 rounded-md clickable" onClick={() => addDeck()}>Add Deck</button>
            <button class="bg-gray-500 text-text px-4 py-2 rounded-md ml-2 clickable" onClick={() => setShowAddModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal onClose={() => setShowDeleteModal(false)} show={showDeleteModal()}>
        <div class="flex flex-col gap-4 p-6 w-[20vw]">
          <h2 class="text-2xl font-bold text-red-500 text-center">Delete Deck</h2>
          <p class="text-gray-400 text-center text-wrap">Are you sure you want to delete this deck? This action cannot be undone.</p>
          <div class="center space-x-4 w-full">
            <button class="bg-red-500 text-text px-4 py-2 rounded-md center" onClick={() => deleteDeck()}>Delete</button>
            <button class="bg-gray-500 text-text px-4 py-2 rounded-md center" onClick={() => setShowDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* 3. Wire the UniversalFilter to update the searchQuery signal */}
      <UniversalFilter
        icon={<Flame class="text-accent" />}
        title="Search Decks"
        placeholder="Type to search..."
        onFilterChange={handleFilterChange}
        class="mb-8 w-[80%]"
      />

      <div class="w-[80%] h-full flex flex-col overflow-hidden">
        <div class="bg-sidebar w-full flex-1 overflow-y-auto rounded-md border-1 border-gray-500 shadow-inner">
          <div class="grid grid-cols-4 gap-4 p-4">
            {/* 4. Use the filteredDecks signal for rendering */}
            <For each={filteredDecks()}>
              {(deck) => {
                const status = deckStatuses().find(s => s.id === deck.id);
                return (
                  <FlashDeck
                    title={deck.title}
                    description={deck.description}
                    id={deck.id}
                    class="w-full h-full"
                    hasFlashcards={status?.hasFlashcards ?? false}
                    onDelete={() => {
                      setDeckToDelete(deck.id);
                      setShowDeleteModal(true);
                    }}
                  />
                );
              }}
            </For>
          </div>
        </div>

        <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-12 bg-accent-dark-2 rounded-full p-2
                          hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={setShowAddModal.bind(null, true)}>
          <Pen class="w-6 h-6 text-text " />
        </div>
      </div>
    </div>
  );
};