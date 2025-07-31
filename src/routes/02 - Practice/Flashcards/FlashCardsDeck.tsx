import UniversalFilter from "@/components/01 - Home/Filters/ComposableFilter";
import FlashcCardListItem from "@/components/02 - Practice/training/Flashcards/FlashcCardListItem";
import { Flame, ArrowLeft, Pen, Trash2 } from 'lucide-solid';
import { For } from "solid-js";
import Modal from "@/components/core/Modal";
import useFlashcards from "@/hooks/training/useFlashcards";

export default function FlashCardsDeck() {
    const {
        flashcards,

        isAddModalOpen,
        setIsAddModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        confirmDeleteSelected,
        cancelDelete,
        edit,
        editCard,
        setNewCardQuestion,
        confirmAdd,
        handlePlayCard,
        cancelAdd,
        selected,
        select,
        singleDeleteCardId,
        setSingleDeleteCardId,
        confirmSingleDelete,
        newCardQuestion,
        newCardAnswer,
        selectAll,
        setNewCardAnswer,
        confirmEdit,
        setEditCardQuestion,
        setEditCardAnswer
    } = useFlashcards();

    return (
        <div class="w-full h-screen flex flex-col items-center justify-start ">

            {/* Add Card Modal */}
            <Modal onClose={() => setIsAddModalOpen(false)} show={isAddModalOpen()}>
                <div class="flex flex-col justify-between mb-4 w-[20vw] gap-8">
                    <p class="text-3xl font-bold w-full text-accent text-center">Add New Card</p>
                    <input
                        type="text"
                        placeholder="Question"
                        class="w-full p-2 border border-gray-500 rounded-md"
                        value={newCardQuestion()}
                        onInput={(e) => setNewCardQuestion(e.currentTarget.value)}
                    />
                    <textarea
                        placeholder="Answer"
                        class="w-full p-2 border border-gray-500 rounded-md"
                        value={newCardAnswer()}
                        onInput={(e) => setNewCardAnswer(e.currentTarget.value)}
                    />
                    <div class="space-x-2 center w-full">
                        <button
                            onClick={() => {
                                confirmAdd({ question: newCardQuestion(), answer: newCardAnswer() });
                                setNewCardQuestion("");
                                setNewCardAnswer("");
                            }}
                            class="clickable bg-accent text-white px-4 py-2 rounded-lg"
                        >
                            Add
                        </button>
                        <button onClick={cancelAdd} class="clickable bg-gray-500 text-white px-4 py-2 rounded-lg ml-2">Cancel</button>
                    </div>
                </div>
            </Modal>

            {/* Edit Card Modal */}
            <Modal onClose={() => setIsEditModalOpen(false)} show={isEditModalOpen()}>
                <div class="flex flex-col justify-between mb-4 w-[20vw] gap-8">
                    <p class="text-3xl font-bold w-full text-accent text-center">Edit Card</p>
                    <input
                        type="text"
                        placeholder="Question"
                        class="w-full p-2 border border-gray-500 rounded-md"
                        value={editCard()?.question || ""}
                        onInput={(e) => setEditCardQuestion(e.currentTarget.value)}
                    />
                    <textarea
                        placeholder="Answer"
                        class="w-full p-2 border border-gray-500 rounded-md"
                        value={editCard()?.answer || ""}
                        onInput={(e) => setEditCardAnswer(e.currentTarget.value)}
                    />
                    <div class="space-x-2 center w-full">
                        <button
                            onClick={() => {
                                confirmEdit();
                                setNewCardQuestion("");
                                setNewCardAnswer("");
                            }}
                            class="clickable bg-accent text-white px-4 py-2 rounded-lg"
                        >
                            Save
                        </button>
                        <button onClick={() => setIsEditModalOpen(false)} class="clickable bg-gray-500 text-white px-4 py-2 rounded-lg ml-2">Cancel</button>
                    </div>
                </div>
            </Modal>

            {/* Delete Selected Cards Modal */}
            <Modal onClose={() => setIsDeleteModalOpen(false)} show={isDeleteModalOpen()}>
                <div class="flex flex-col justify-between mb-4 w-[30vw] gap-8">
                    <p class="text-3xl font-bold w-full text-accent text-center">Delete The Cards?</p>
                    <p class="text-gray-300 w-full text-center">
                        Are you sure you want to delete the selected flashcards? This action cannot be undone.
                    </p>
                    <div class="space-x-2 center w-full">
                        <button onClick={confirmDeleteSelected} class="clickable bg-error text-white px-4 py-2 rounded-lg">Delete</button>
                        <button onClick={cancelDelete} class="clickable bg-gray-500 text-white px-4 py-2 rounded-lg ml-2">Cancel</button>
                    </div>
                </div>
            </Modal>

            {/* Single Delete Modal */}
            <Modal onClose={() => setSingleDeleteCardId(null)} show={singleDeleteCardId() !== null}>
                <div class="flex flex-col justify-between mb-4 w-[30vw] gap-8">
                    <p class="text-3xl font-bold w-full text-accent text-center">Delete This Card?</p>
                    <p class="text-gray-300 w-full text-center">
                        Are you sure you want to delete this flashcard? This action cannot be undone.
                    </p>
                    <div class="space-x-2 center w-full">
                        <button onClick={confirmSingleDelete} class="clickable bg-error text-white px-4 py-2 rounded-lg">Delete</button>
                        <button onClick={() => setSingleDeleteCardId(null)} class="clickable bg-gray-500 text-white px-4 py-2 rounded-lg ml-2">Cancel</button>
                    </div>
                </div>
            </Modal>

            <div class="absolute top-0 px-6 py-8 h-12 w-full flex items-center justify-start gap-8 border-b border-gray-500 flex-shrink-0 z-50">
                <a href="/practice/flashcards" class="text-accent clickable"><ArrowLeft class="w-8 h-8" /></a>
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
                        <div class="flex justify-between items-center mb-4">
                            <button onClick={selectAll} class="clickable text-accent">
                                {selected().length === flashcards().length ? "Deselect All" : "Select All"}
                            </button>
                            <p class="text-gray-400">{selected().length} selected</p>
                        </div>

                        <ul class="space-y-3 pl-0">
                            <For each={flashcards()} fallback={<p class="text-gray-400">No flashcards available.</p>}>
                                {(item) => (
                                    <FlashcCardListItem
                                        id={item.id}
                                        title={item.question}
                                        description={item.answer}
                                        lastModified={item.lastModified}
                                        accuracy={item.accuracy}
                                        attempts={item.attempts}
                                        onDelete={() => setSingleDeleteCardId(item.id)}
                                        onPlay={handlePlayCard}
                                        selected={selected} 
                                        onCheck={() => { select(item.id) }} 
                                        onEdit={() => edit(item.id)}
                                    />
                                )}
                            </For>
                        </ul>
                    </div>

                </div>

                {/* Floating Buttons */}
                <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-12 bg-accent-dark-2 rounded-full p-2
                                  hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
                    onClick={() => setIsDeleteModalOpen(true)}>
                    <Trash2 class="w-6 h-6 text-white " />
                </div>

                <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-12 bg-accent-dark-2 rounded-full p-2
                                  hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
                    onClick={() => setIsAddModalOpen(true)}>
                    <Pen class="w-6 h-6 text-white " />
                </div>

            </div>
        </div >
    );
};