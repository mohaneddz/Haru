import { createSignal, onCleanup, onMount } from "solid-js";
import { loadFlashcards } from "@/utils/training/flashcardUtils";

export default function useFlashcard() {
	const INITIAL_TIME = 5;
	const [timer, setTimer] = createSignal(INITIAL_TIME);
	const [width, setWidth] = createSignal(100);
	const [question, setQuestion] = createSignal('');
	const [expectedAnswer, setExpectedAnswer] = createSignal('');
	const [answer, setAnswer] = createSignal('');
	const [result, setResult] = createSignal('');
	const [isPaused, setIsPaused] = createSignal(false);
	const [type, setType] = createSignal<'input' | 'tf' | 'multi-choice'>('input');
	const [options, setOptions] = createSignal<string[]>([]);
	const [correct, setCorrect] = createSignal<number>(-1);
	const [selectedOption, setSelectedOption] = createSignal<number>(-1);

	let interval: ReturnType<typeof setInterval>;

	function stripQuotes(str: string) {
		return str.replace(/^"|"$/g, '');
	}

	function startTimer() {
		interval = setInterval(() => {
			setTimer((prev) => {
				const newTime = Math.max(prev - 1, 0);
				// When the timer is running, update width for animation
				if (newTime > 0) {
					// Only animate when time is ticking down
					setWidth((newTime / INITIAL_TIME) * 100);
				} else {
					// When timer hits 0, ensure width is 0 without transition
					setWidth(0);
					setResult("Time's up!");
				}
				return newTime;
			});
		}, 1000);
	}

	function pauseTimer() {
		clearInterval(interval);
	}

	function compareAnswers() {
		let isCorrect = false;
		if (type() === 'input') {
			isCorrect = answer().trim().toLowerCase() === expectedAnswer().trim().toLowerCase();
		} else if (type() === 'tf') {
			isCorrect = (selectedOption() === 0 && expectedAnswer() === 'True') || (selectedOption() === 1 && expectedAnswer() === 'False');
		} else if (type() === 'multi-choice') {
			isCorrect = selectedOption() === correct();
		}
		setResult(isCorrect ? 'Correct!' : 'Incorrect');
		clearInterval(interval);
		// Set width instantly to its current state without a transition when answer is submitted
		setWidth((timer() / INITIAL_TIME) * 100);
	}

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const id = parseInt(params.get('id') || '1', 10);

		console.log(`Loading flashcards for deck ID: ${id}`);
		loadFlashcards({ id }) // Fixed: Pass an object with id property
			.then((cards) => {
				if (cards.length > 0) {
					const card = cards[0];
					setQuestion(stripQuotes(card.question));
					setExpectedAnswer(stripQuotes(card.answer));
					setType(card.type as "input" | "tf" | "multi-choice"); // Fixed: Add type assertion for union type
					setOptions(card.options || []);
					setCorrect(card.correct || -1);
				}
			})
			.catch((error) => {
				console.error('Error loading flashcards:', error);
			});

		startTimer();
	});

	onCleanup(() => clearInterval(interval));

	return {
		timer,
		width,
		question,
		expectedAnswer,
		answer,
		result,
		isPaused,
		setAnswer,
		startTimer,
		compareAnswers,
		setIsPaused,
		pauseTimer,
		type,
		options,
		selectedOption,
		setSelectedOption
	};
}
