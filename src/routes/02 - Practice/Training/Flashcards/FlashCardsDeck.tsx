import UniversalFilter from "@/components/01 - Home/Filters/ComposableFilter";
import FlashcCardListItem from "@/components/02 - Practice/training/Flashcards/FlashcCardListItem";
import { Flame, Trash2 } from 'lucide-solid';
import { For, Show } from "solid-js";
import Modal from "@/components/core/Modal";

import { createSignal } from "solid-js";

export default function FlashCardsDeck() {

    const [isModalOpen, setIsModalOpen] = createSignal(false);
    const [flashcards, setFlashcards] = createSignal([
        { id: 1, question: "What is React?", answer: "A JavaScript library for building user interfaces.", lastModified: "2023-10-01", accuracy: "85%", attempts: "10" },
        { id: 2, question: "What is SolidJS?", answer: "A declarative JavaScript library for building user interfaces.", lastModified: "2023-10-02", accuracy: "90%", attempts: "5" },
        { id: 3, question: "What is Tauri?", answer: "A framework for building native applications using web technologies.", lastModified: "2023-10-03", accuracy: "80%", attempts: "8" },
        { id: 4, question: "What is TypeScript?", answer: "A typed superset of JavaScript that compiles to plain JavaScript.", lastModified: "2023-10-04", accuracy: "95%", attempts: "12" },
        { id: 5, question: "What is Node.js?", answer: "A JavaScript runtime built on Chrome's V8 JavaScript engine.", lastModified: "2023-10-05", accuracy: "88%", attempts: "7" },
        { id: 6, question: "What is WebAssembly?", answer: "A binary instruction format for a stack-based virtual machine.", lastModified: "2023-10-06", accuracy: "92%", attempts: "9" },
    ]);
    const [cardToDelete, setCardToDelete] = createSignal<number | null>(null);

    const handleDeleteCard = (cardId: number) => {
        setCardToDelete(cardId);
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        const idToDelete = cardToDelete();
        if (idToDelete !== null) {
            setFlashcards(prev => prev.filter(card => card.id !== idToDelete));
        }
        setIsModalOpen(false);
        setCardToDelete(null);
    };

    const cancelDelete = () => {
        setIsModalOpen(false);
        setCardToDelete(null);
    };
    return (
        <div class="w-full h-screen flex flex-col items-center justify-start ">

            <Show when={isModalOpen()}>
                <Modal onClose={() => setIsModalOpen(false)} >
                    <div class="flex flex-col justify-between mb-4 w-[20vw] gap-4">
                        <p class="text-xl font-bold w-full text-accent">Wait!</p>
                        <p class="text-gray-300">Are you sure you want to delete this flashcard? This action cannot be undone.</p>
                        <div class="flex">
                            <button onClick={confirmDelete} class="bg-red-500 text-white px-4 py-2 rounded-lg">Delete</button>
                            <button onClick={cancelDelete} class="bg-gray-500 text-white px-4 py-2 rounded-lg ml-2">Cancel</button>
                        </div>
                    </div>
                </Modal>
            </Show>

            <div class="absolute top-0 px-6 py-8 h-12 w-full flex items-center justify-start gap-8 border-b border-gray-500 flex-shrink-0 z-50">
                <a href="/practice/training/flashcards" class="text-accent hover:underline">Go Back</a>
                <p class="text-sm text-gray-400">Flashcard Deck Details</p>
            </div>

            <div class="max-w-[80%] flex-1 flex flex-col overflow-hidden mt-24">

                <div class="flex-shrink-0">
                    <div class="flex-shrink-0 mb-6">
                        <h1 class="text-2xl font-bold text-white mb-4">Flashcard Deck Title</h1>
                        <p class="text-gray-300">This is a detailed view of the flashcard deck. Here you can see all the cards, edit them, or delete the deck.</p>
                    </div>

                    <UniversalFilter icon={Flame} title="Search Flashcards" onFilterChange={() => { }} class="w-full" />
                </div>

                {/* main content */}
                <div class="flex-1 flex flex-col overflow-hidden -mt-4 mb-16">

                    {/* Flashcards list */}
                    <div class="bg-background-light-1/50 p-4 rounded-lg shadow-lg flex-1 overflow-y-auto border-gray-600 border-1 w-full">
                        <ul class="space-y-3">
                            <For each={flashcards()} fallback={<p class="text-gray-400">No flashcards available.</p>}>
                                {(item) => (
                                    <FlashcCardListItem
                                        id={item.id}
                                        title={item.question}
                                        description={item.answer}
                                        lastModified={item.lastModified}
                                        accuracy={item.accuracy}
                                        attempts={item.attempts}
                                        onDelete={handleDeleteCard}
                                    />
                                )}
                            </For>
                        </ul>
                    </div>

                </div>

            </div>
        </div>
    );
};