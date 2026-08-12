import UniversalFilter from "@/components/core/UniversalFilter";
import FlashcCardListItem from "@/components/02 - Practice/training/Flashcards/FlashcCardListItem";
import { Flame, ArrowLeft, Pen, Trash2 } from 'lucide-solid';
import { For, createSignal, createEffect } from "solid-js";
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
        // Removed: setEditCardQuestion, setEditCardAnswer (no longer provided by hook)
    } = useFlashcards();

    // Add state for new card type
    const [newCardType, setNewCardType] = createSignal('input');
    // Add states for multi-choice options and correct answer
    const [newCardOptions, setNewCardOptions] = createSignal(['', '', '', '']);
    const [newCardCorrect, setNewCardCorrect] = createSignal(0);

    // Add states for edit card type, options, and correct
    const [editCardType, setEditCardType] = createSignal('input');
    const [editCardOptions, setEditCardOptions] = createSignal(['', '', '', '']);
    const [editCardCorrect, setEditCardCorrect] = createSignal(0);
    // Added: Local signals for editable question and answer in edit modal
    const [editQuestion, setEditQuestion] = createSignal('');
    const [editAnswer, setEditAnswer] = createSignal('');

    // Initialize edit states when edit modal opens
    createEffect(() => {
        if (isEditModalOpen()) {
            setEditCardType(editCard()?.type || 'input');
            setEditCardOptions(editCard()?.options || ['', '', '', '']);
            setEditCardCorrect(editCard()?.correct || 0);
            // Added: Initialize local signals with current values
            setEditQuestion(editCard()?.question || '');
            setEditAnswer(editCard()?.answer || '');
        }
    });

    return (
        <div class="w-full h-screen flex flex-col items-center justify-start ">

            {/* Add Card Modal */}
            <Modal onClose={() => setIsAddModalOpen(false)} show={isAddModalOpen()}>
                <div class="flex flex-col justify-between mb-4 w-[20vw] gap-4">
                    <p class="text-3xl font-bold w-full text-accent text-center mb-8">Add New Card</p>
                    <select
                        value={newCardType()}
                        onChange={(e) => setNewCardType(e.currentTarget.value)}
                        class="w-full p-2 border border-gray-500 rounded-md"
                    >
                        <option value="input">Input</option>
                        <option value="tf">True/False</option>
                        <option value="multi-choice">Multi-Choice</option>
                    </select>
                    <textarea
                        placeholder="Question"
                        class="w-full p-2 border border-gray-500 rounded-md"
                        value={newCardQuestion()}
                        onInput={(e) => setNewCardQuestion(e.currentTarget.value)}
                    />
                    {/* Conditionally render answer input based on type */}
                    {newCardType() === 'input' && (
                        <textarea
                            placeholder="Answer"
                            class="w-full p-2 border border-gray-500 rounded-md"
                            value={newCardAnswer()}
                            onInput={(e) => setNewCardAnswer(e.currentTarget.value)}
                        />
                    )}
                    {newCardType() === 'tf' && (
                        <div class="flex gap-4">
                            <label>
                                <input type="radio" name="tf" value="True" checked={newCardAnswer() === 'True'} onChange={() => setNewCardAnswer('True')} />
                                True
                            </label>
                            <label>
                                <input type="radio" name="tf" value="False" checked={newCardAnswer() === 'False'} onChange={() => setNewCardAnswer('False')} />
                                False
                            </label>
                        </div>
                    )}
                    {newCardType() === 'multi-choice' && (
                        <div class="flex flex-col gap-2">
                            {newCardOptions().map((option, index) => (
                                <input
                                    type="text"
                                    placeholder={`Option ${index + 1} (leave empty if undefined)`}
                                    class="w-full p-2 border border-gray-500 rounded-md"
                                    value={option}
                                    onInput={(e) => {
                                        const newOptions = [...newCardOptions()];
                                        newOptions[index] = e.currentTarget.value;
                                        setNewCardOptions(newOptions);
                                    }}
                                />
                            ))}
                            <select
                                class="w-full p-2 border border-gray-500 rounded-md"
                                value={newCardCorrect()}
                                onChange={(e) => setNewCardCorrect(parseInt(e.currentTarget.value))}
                            >
                                {newCardOptions().map((_, index) => (
                                    <option value={index}>Correct: Option {index + 1}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div class="space-x-2 center w-full">
                        <button
                            onClick={() => {
                                confirmAdd({
                                    type: newCardType(),
                                    question: newCardQuestion(),
                                    answer: newCardType() === 'multi-choice' ? '' : newCardAnswer(),
                                    options: newCardType() === 'multi-choice' ? newCardOptions() : undefined,
                                    correct: newCardType() === 'multi-choice' ? newCardCorrect() : undefined
                                });
                                setNewCardQuestion("");
                                setNewCardAnswer("");
                                setNewCardType('input');
                                setNewCardOptions(['', '', '', '']);
                                setNewCardCorrect(0);
                            }}
                            class="clickable bg-accent text-text px-4 py-2 rounded-lg"
                        >
                            Add
                        </button>
                        <button onClick={cancelAdd} class="clickable bg-gray-500 text-text px-4 py-2 rounded-lg ml-2">Cancel</button>
                    </div>
                </div>
            </Modal>

            {/* Edit Card Modal */}
            <Modal onClose={() => setIsEditModalOpen(false)} show={isEditModalOpen()}>
                <div class="flex flex-col justify-between mb-4 w-[20vw] gap-8">
                    <p class="text-3xl font-bold w-full text-accent text-center">Edit Card</p>
                    <select
                        value={editCardType()}
                        onChange={(e) => {
                            setEditCardType(e.currentTarget.value);
                            // Reset options and correct when changing type to multi-choice
                            if (e.currentTarget.value === 'multi-choice') {
                                setEditCardOptions(['', '', '', '']);
                                setEditCardCorrect(0);
                            } else {
                                setEditCardOptions(['', '', '', '']);
                                setEditCardCorrect(0);
                            }
                        }}
                        class="w-full p-2 border border-gray-500 rounded-md"
                    >
                        <option value="input">Input</option>
                        <option value="tf">True/False</option>
                        <option value="multi-choice">Multi-Choice</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Question"
                        class="w-full p-2 border border-gray-500 rounded-md"
                        value={editQuestion()} // Updated: Use local signal
                        onInput={(e) => setEditQuestion(e.currentTarget.value)} // Updated: Use local setter
                    />
                    {/* Conditionally render answer input based on type */}
                    {editCardType() === 'input' && (
                        <textarea
                            placeholder="Answer"
                            class="w-full p-2 border border-gray-500 rounded-md"
                            value={editAnswer()} // Updated: Use local signal
                            onInput={(e) => setEditAnswer(e.currentTarget.value)} // Updated: Use local setter
                        />
                    )}
                    {editCardType() === 'tf' && (
                        <div class="flex gap-4">
                            <label>
                                <input type="radio" name="edit-tf" value="True" checked={editAnswer() === 'True'} onChange={() => setEditAnswer('True')} /> // Updated: Use local signal
                                True
                            </label>
                            <label>
                                <input type="radio" name="edit-tf" value="False" checked={editAnswer() === 'False'} onChange={() => setEditAnswer('False')} /> // Updated: Use local signal
                                False
                            </label>
                        </div>
                    )}
                    {editCardType() === 'multi-choice' && (
                        <div class="flex flex-col gap-2">
                            {editCardOptions().map((option, index) => (
                                <input
                                    type="text"
                                    placeholder={`Option ${index + 1} (leave empty if undefined)`}
                                    class="w-full p-2 border border-gray-500 rounded-md"
                                    value={option}
                                    onInput={(e) => {
                                        const newOptions = [...editCardOptions()];
                                        newOptions[index] = e.currentTarget.value;
                                        setEditCardOptions(newOptions);
                                    }}
                                />
                            ))}
                            <select
                                class="w-full p-2 border border-gray-500 rounded-md"
                                value={editCardCorrect()}
                                onChange={(e) => setEditCardCorrect(parseInt(e.currentTarget.value))}
                            >
                                {editCardOptions().map((_, index) => (
                                    <option value={index}>Correct: Option {index + 1}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div class="space-x-2 center w-full">
                        <button
                            onClick={() => {
                                confirmEdit({
                                    type: editCardType(),
                                    question: editQuestion(), // Updated: Use local signal
                                    answer: editCardType() === 'multi-choice' ? '' : editAnswer(), // Updated: Use local signal
                                    options: editCardType() === 'multi-choice' ? editCardOptions() : undefined,
                                    correct: editCardType() === 'multi-choice' ? editCardCorrect() : undefined
                                });
                                setNewCardQuestion("");
                                setNewCardAnswer("");
                            }}
                            class="clickable bg-accent text-text px-4 py-2 rounded-lg"
                        >
                            Save
                        </button>
                        <button onClick={() => setIsEditModalOpen(false)} class="clickable bg-gray-500 text-text px-4 py-2 rounded-lg ml-2">Cancel</button>
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
                        <button onClick={confirmDeleteSelected} class="clickable bg-error text-text px-4 py-2 rounded-lg">Delete</button>
                        <button onClick={cancelDelete} class="clickable bg-gray-500 text-text px-4 py-2 rounded-lg ml-2">Cancel</button>
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
                        <button onClick={confirmSingleDelete} class="clickable bg-error text-text px-4 py-2 rounded-lg">Delete</button>
                        <button onClick={() => setSingleDeleteCardId(null)} class="clickable bg-gray-500 text-text px-4 py-2 rounded-lg ml-2">Cancel</button>
                    </div>
                </div>
            </Modal>

            <div class="absolute top-0 px-6 py-8 h-12 w-full flex items-center justify-start gap-8 border-b border-gray-500 flex-shrink-0 z-50">
                <a href="/practice/flashcards" class="text-accent clickable"><ArrowLeft class="w-8 h-8" /></a>
            </div>

            <div class="w-[80%] flex-1 flex flex-col overflow-hidden mt-24">

                <div class="flex-shrink-0">

                    <UniversalFilter
                        icon={<Flame class="text-accent" />} title="Search Flashcards" placeholder="Type to search..." onFilterChange={() => { }} class="w-full mb-8" />
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
                    <Trash2 class="w-6 h-6 text-text " />
                </div>

                <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-12 bg-accent-dark-2 rounded-full p-2
                                  hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
                    onClick={() => setIsAddModalOpen(true)}>
                    <Pen class="w-6 h-6 text-text " />
                </div>

            </div>
        </div >
    );
};