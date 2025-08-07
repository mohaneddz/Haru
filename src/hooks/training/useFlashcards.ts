import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';

export default function useFlashcards() {
	const [isDeleteModalOpen, setIsDeleteModalOpen] = createSignal(false);
	const [isAddModalOpen, setIsAddModalOpen] = createSignal(false);
	const [isEditModalOpen, setIsEditModalOpen] = createSignal(false);
	const [selected, setSelected] = createSignal<number[]>([]);
	const [newCardQuestion, setNewCardQuestion] = createSignal('');
	const [newCardAnswer, setNewCardAnswer] = createSignal('');
	const [singleDeleteCardId, setSingleDeleteCardId] = createSignal<number | null>(null);
	const [editCard, setEditCard] = createSignal<{ id: number; question: string; answer: string } | null>(null);
	const [editCardQuestion, setEditCardQuestion] = createSignal('');
	const [editCardAnswer, setEditCardAnswer] = createSignal('');

	const navigate = useNavigate();

	const [flashcards, setFlashcards] = createSignal([
		{
			id: 1,
			question: 'What is React?',
			answer: 'A JavaScript library for building user interfaces.',
			lastModified: '2023-10-01',
			accuracy: '85%',
			attempts: '10',
		},
		{
			id: 2,
			question: 'What is SolidJS?',
			answer: 'A declarative JavaScript library for building user interfaces.',
			lastModified: '2023-10-02',
			accuracy: '90%',
			attempts: '5',
		},
		{
			id: 3,
			question: 'What is Tauri?',
			answer: 'A framework for building native applications using web technologies.',
			lastModified: '2023-10-03',
			accuracy: '80%',
			attempts: '8',
		},
		{
			id: 4,
			question: 'What is TypeScript?',
			answer: 'A typed superset of JavaScript that compiles to plain JavaScript.',
			lastModified: '2023-10-04',
			accuracy: '95%',
			attempts: '12',
		},
		{
			id: 5,
			question: 'What is Node.js?',
			answer: "A JavaScript runtime built on Chrome's V8 JavaScript engine.",
			lastModified: '2023-10-05',
			accuracy: '88%',
			attempts: '7',
		},
		{
			id: 6,
			question: 'What is WebAssembly?',
			answer: 'A binary instruction format for a stack-based virtual machine.',
			lastModified: '2023-10-06',
			accuracy: '92%',
			attempts: '9',
		},
	]);
	const [cardToDelete, setCardToDelete] = createSignal<number | null>(null);

	const confirmDeleteSelected = () => {
		setFlashcards((prev) => prev.filter((card) => !selected().includes(card.id)));
		setIsDeleteModalOpen(false);
	};

	const confirmSingleDelete = () => {
		const cardId = singleDeleteCardId();
		if (cardId !== null) {
			setFlashcards((prev) => prev.filter((card) => card.id !== cardId));
		}
		setSingleDeleteCardId(null);
		setIsDeleteModalOpen(false);
	};

	const handleDeleteCard = (cardId: number) => {
		setCardToDelete(cardId);
		setIsDeleteModalOpen(true);
		console.log(`Request to delete card with ID: ${cardId}`);
	};

	const confirmDelete = () => {
		const idToDelete = cardToDelete();
		if (idToDelete !== null) {
			setFlashcards((prev) => prev.filter((card) => card.id !== idToDelete));
		}
		setIsDeleteModalOpen(false);
		setCardToDelete(null);
	};

	const cancelDelete = () => {
		setIsDeleteModalOpen(false);
		setCardToDelete(null);
	};

	const handlePlayCard = (cardId: number) => {
		console.log(`Playing card with ID: ${cardId}`);
		navigate(`/practice/flashcards/revision?id=${cardId}`);
	};

	const confirmEdit = () => {
		const cardId = editCard()?.id;
		console.log(`Card : ${JSON.stringify(cardId)}`);
		if (cardId) {
			setFlashcards((prev) =>
				prev.map((c) =>
					c.id === cardId
						? { ...c, question: editCardQuestion(), answer: editCardAnswer() }
						: c
				)
			);
			setIsEditModalOpen(false);
			setEditCard(null);
			console.log(`Card with ID: ${cardId} edited successfully`);
			// console.log(`now all card names: ${flashcards().map(c => c.question).join(', ')}`); // Log all card names
		}
	};

	const confirmAdd = (newCard: { question: string; answer: string }) => {
		const newId = Math.max(...flashcards().map((card) => card.id)) + 1;
		setFlashcards((prev) => [
			...prev,
			{
				id: newId,
				question: newCard.question,
				answer: newCard.answer,
				lastModified: new Date().toISOString().split('T')[0],
				accuracy: '0%',
				attempts: '0',
			},
		]);
		setIsAddModalOpen(false);
	};

	const cancelAdd = () => {
		setIsAddModalOpen(false);
	};

	const edit = (id: number) => {
		if (id !== null) {
			const card = flashcards().find((card) => card.id === id);
			if (card) {
				setEditCard({ id: card.id, question: card.question, answer: card.answer });
				setIsEditModalOpen(true);
			}
		}
	};

	const select = (id: number) => {
		setSelected((selection) => {
			if (selection.includes(id)) {
				return selection.filter((item) => item !== id);
			} else {
				return [...selection, id];
			}
		});
	};

	const selectAll = () => {
		const allSelected = selected().length === flashcards().length;
		if (allSelected) {
			setSelected([]); // Deselect all
		} else {
			setSelected(flashcards().map((card) => card.id)); // Select all
		}
	};

	return {
		flashcards,
		confirmEdit,
		isAddModalOpen,
		setIsAddModalOpen,
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		isEditModalOpen,
		setIsEditModalOpen,
		confirmDeleteSelected,
		cancelDelete,
		editCard,
		edit,
		setNewCardQuestion,
		confirmAdd,
		handlePlayCard,
		cancelAdd,
		selected,
		select,
		setFlashcards,
		singleDeleteCardId,
		setSingleDeleteCardId,
		confirmDelete,
		confirmSingleDelete,
		handleDeleteCard,
		newCardQuestion,
		newCardAnswer,
		selectAll,
		setNewCardAnswer,
		setEditCardQuestion,
		setEditCardAnswer,
	};
}
