import UniversalFilter from "@/components/01 - Home/Filters/ComposableFilter";
import FlashDeck from "@/components/02 - Practice/training/Flashcards/FlashDeckCard";
import Modal from "@/components/core/Modal";
import { Pen } from 'lucide-solid';
import { Flame } from 'lucide-solid';

import { createSignal, For } from "solid-js";

export default function FlashCardsDashboard() {


  const [showAddModal, setShowAddModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [_, setFilters] = createSignal({});
  const [deckToDelete, setDeckToDelete] = createSignal<number | null>(null); // Track the deck to delete
  const [decks, setDecks] = createSignal([
    {
      title: "React Native",
      description: "This is the first deck of flashcards.",
      id: 1
    }, {
      title: "Calculus",
      description: "This is the second deck of flashcards.",
      id: 2
    }, {
      title: "Flutter",
      description: "This is the third deck of flashcards.",
      id: 3
    },
    {
      title: "Flutter",
      description: "This is the third deck of flashcards.",
      id: 3
    },
    {
      title: "React Native",
      description: "This is the first deck of flashcards.",
      id: 1
    }, {
      title: "Calculus",
      description: "This is the second deck of flashcards.",
      id: 2
    }, {
      title: "Flutter",
      description: "This is the third deck of flashcards.",
      id: 3
    },
  ]);

  const addDeck = () => {
    const newDeck = {
      title: "New Deck",
      description: "This is a new deck of flashcards.",
      id: decks().length + 1
    };
    setDecks([...decks(), newDeck]);
    setShowAddModal(false);
  }

  const deleteDeck = () => {
    const deckId = deckToDelete();
    if (deckId !== null) {
      setDecks(decks().filter(deck => deck.id !== deckId));
    }
    setDeckToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <div class="w-full h-screen flex flex-col items-center justify-start overflow-hidden">

      <div class="w-[80%] h-full flex flex-col overflow-hidden">

        <Modal onClose={() => setShowAddModal(false)} show={showAddModal()}>
          <div class="flex flex-col gap-4 p-6">
            <h2 class="text-2xl font-bold text-accent">Add New Deck</h2>
            <input type="text" placeholder="Deck Title" class="p-2 border border-gray-500 rounded-md" />
            <textarea placeholder="Deck Description" class="p-2 border border-gray-500 rounded-md h-24"></textarea>
            <div class="center">
              <button class="bg-accent text-white px-4 py-2 rounded-md" onClick={() => addDeck()}>Add Deck</button>
              <button class="bg-gray-500 text-white px-4 py-2 rounded-md ml-2" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </Modal>

        <Modal onClose={() => setShowDeleteModal(false)} show={showDeleteModal()}>
          <div class="flex flex-col gap-4 p-6 w-[20vw]">
            <h2 class="text-2xl font-bold text-red-500 text-center">Delete Deck</h2>
            <p class="text-gray-400 text-center text-wrap">Are you sure you want to delete this deck? This action cannot be undone.</p>
            <div class="center space-x-4 w-full">
              <button class="bg-red-500 text-white px-4 py-2 rounded-md center" onClick={() => deleteDeck()}>Delete</button>
              <button class="bg-gray-500 text-white px-4 py-2 rounded-md center" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </Modal>

        <UniversalFilter icon={Flame} title="Search Decks" onFilterChange={setFilters} />

        <div class="bg-sidebar w-full flex-1 overflow-hidden rounded-md border-1 border-gray-500 shadow-inner">
          <div class="grid grid-cols-4 gap-4 p-4 overflow-y-auto h-full">
            <For each={decks()}>
              {(deck) => (
                <FlashDeck
                  title={deck.title}
                  description={deck.description}
                  id={deck.id}
                  class="w-full h-full"
                  onDelete={() => {
                    setDeckToDelete(deck.id);
                    setShowDeleteModal(true);
                  }}
                />
              )}
            </For>
          </div>
        </div>

        <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-12 bg-accent-dark-2 rounded-full p-2
                          hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={setShowAddModal.bind(null, true)}>
          <Pen class="w-6 h-6 text-white " />
        </div>

      </div>

    </div>
  );
};
