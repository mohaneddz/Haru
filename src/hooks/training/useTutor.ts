import { createSignal, onCleanup } from 'solid-js';
import type { MessageData } from '@/types/home/tutor';
import useLLM from '@/hooks/home/useLLM';
import useVoice from '@/hooks/home/useVoice';

export default function useTutor() {
	const [currText, setCurrText] = createSignal('');
	const [isLoading, setIsLoading] = createSignal(false);
	const [images, setImages] = createSignal<string[]>([]);
	const [paths, setPaths] = createSignal<string[]>([]);

	const [web, setWeb] = createSignal(false);
	const [rag, setRag] = createSignal(false);

	const [mode, setMode] = createSignal('tutor');

	let messageIdCounter = 0;
	const getNextId = () => ++messageIdCounter;

	const [messages, setMessages] = createSignal<MessageData[]>([
		{
			id: getNextId(),
			text: 'Hello! I am HARU, your local AI assistant. How can I help you today?',
			user: false,
			sources: [],
		},
	]);

	// utilities
	let abortController = new AbortController();

	// LLM helpers (moved here via hook)
	const { buildHistoryForBackend, processStreamedResponse } = useLLM();

	// Small formatter used when updating the assistant message text while streaming
	const formatTextWithCitations = (text: string): string => {
		const citationRegex = /\[(?:Source\s)?(\d+(?:,\s*\d+)*)\]/g;
		return text.replace(citationRegex, '<span class="citation">[$1]</span>');
	};

	// Voice integration moved to useVoice; wire dependencies
	const {
		voice,
		transcript,
		voiceStatus,
		toggleVoice: _toggleVoiceInternal,
		stopVoiceServices,
	} = useVoice({
		getMessages: messages,
		setMessages,
		getNextId,
		buildHistoryForBackend,
		processStreamedResponse,
		setIsLoading,
	});

	// Wrapper to keep previous behavior of aborting any text fetch before enabling voice
	const toggleVoice = async () => {
		abortController.abort();
		setIsLoading(false);
		await _toggleVoiceInternal();
	};

	onCleanup(() => {
		abortController.abort();
		if (voice()) stopVoiceServices();
	});

	async function handleBackendError(response: Response, botMessageId: number) {
		const errorText = await response.text();
		console.error('Backend error:', errorText);
		setMessages((prev) =>
			prev.map((m) =>
				m.id === botMessageId
					? { ...m, text: `Error: ${errorText || 'Failed to get response.'}` }
					: m
			)
		);
	}

	function handleNetworkError(error: any, botMessageId: number) {
		console.error('Network or processing error:', error);
		setMessages((prev) =>
			prev.map((m) => (m.id === botMessageId ? { ...m, text: `Network Error: ${error.message}` } : m))
		);
	}

	function appendBotMessage(botMessageId: number) {
		setMessages((prev) => [...prev, { id: botMessageId, text: '', user: false, sources: [] }]);
	}

	// --- CORE API FUNCTIONS (for text chat) ---
	const toggleWeb = () => {
		setWeb((prev) => !prev);
		if (web()) setRag(false);
	};

	const toggleRag = () => {
		setRag((prev) => !prev);
		if (rag()) setWeb(false);
	};

	async function sendQueryWithSources(
		endpoint: '/rag' | '/ask_search',
		messageText: string,
		signal: AbortSignal,
		history?: { role: string; content: string }[] // added
	) {
		const botMessageId = getNextId();
		appendBotMessage(botMessageId);
		const body = {
			query: messageText,
			stream: true,
			messages: history ?? [], // include history for rephrasing
		};

		let port = 5000;
		if (endpoint === '/rag') port = 5001;
		if (endpoint === '/ask_search') port = 5002;

		try {
			const response = await fetch(`http://localhost:${port}${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal,
			});
			if (!response.ok || !response.body) {
				await handleBackendError(response, botMessageId);
				return;
			}
			await processStreamedResponse(response, signal, {
				onSources: (payload) => {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === botMessageId ? { ...m, sources: payload } : m
						)
					);
				},
				onToken: (newRawText) => {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === botMessageId
								? {
										...m,
										rawText: newRawText,
										text: formatTextWithCitations(
											newRawText
										),
								  }
								: m
						)
					);
				},
			});
		} catch (error: any) {
			if (error.name !== 'AbortError') handleNetworkError(error, botMessageId);
		}
	}

	async function sendStandardQuestion(
		messageText: string,
		history: { role: string; content: string }[],
		signal: AbortSignal,
		imagePaths: string[] = []
	) {
		const botMessageId = getNextId();
		appendBotMessage(botMessageId);
		try {
			const response = await fetch('http://localhost:5000/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: messageText,
					history,
					stream: true,
					imgs: imagePaths,
				}),
				signal,
			});
			if (!response.ok || !response.body) {
				await handleBackendError(response, botMessageId);
				return;
			}
			await processStreamedResponse(response, signal, {
				onSources: (payload) => {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === botMessageId ? { ...m, sources: payload } : m
						)
					);
				},
				onToken: (newRawText) => {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === botMessageId
								? {
										...m,
										rawText: newRawText,
										text: formatTextWithCitations(
											newRawText
										),
								  }
								: m
						)
					);
				},
			});
		} catch (error: any) {
			if (error.name !== 'AbortError') handleNetworkError(error, botMessageId);
		}
	}

	// --- PRIMARY USER ACTION HANDLER (for text chat) ---
	const handleSend = async () => {
		const messageText = currText().trim();
		const messageImages = images();
		const messagePaths = paths();
		if ((!messageText && messageImages.length === 0) || isLoading() || voice()) return;

		abortController.abort();
		const newAbortController = new AbortController();
		abortController = newAbortController;
		const signal = newAbortController.signal;

		setIsLoading(true);
		setCurrText('');
		setImages([]);
		setPaths([]);

		const newUserMessage: MessageData = {
			id: getNextId(),
			text: messageText,
			user: true,
			images: messageImages,
		};
		const currentMessages = [...messages(), newUserMessage];
		setMessages(currentMessages);

		try {
			if (rag()) {
				// Build history for backend and pass to /rag
				const historyForBackend = buildHistoryForBackend(currentMessages.slice(0, -1));
				await sendQueryWithSources('/rag', messageText, signal, historyForBackend);
			} else if (web()) {
				const historyForBackend = buildHistoryForBackend(currentMessages.slice(0, -1));
				await sendQueryWithSources('/ask_search', messageText, signal, historyForBackend); // pass it in
			} else {
				const historyForBackend = buildHistoryForBackend(currentMessages.slice(0, -1));
				await sendStandardQuestion(messageText, historyForBackend, signal, messagePaths);
			}
		} catch (error: any) {
			if (error.name === 'AbortError') console.log('Fetch aborted by a new request.');
		} finally {
			setIsLoading(false);
		}
	};

	const newChat = () => {
		abortController.abort();
		abortController = new AbortController();
		messageIdCounter = 0;
		setMessages([
			{
				id: getNextId(),
				text: 'Hello There.\n\nHow can I help you today?',
				user: false,
				sources: [],
			},
		]);
		setCurrText('');
		setImages([]);
		setPaths([]);
		setIsLoading(false);
		if (voice()) stopVoiceServices();
	};

	function addImage(image: string, path: string) {
		setImages((prev) => [...prev, image]);
		setPaths((prev) => [...prev, path || '']);
	}

	function removeImage(index: number) {
		setImages((prev) => prev.filter((_, i) => i !== index));
		setPaths((prev) => prev.filter((_, i) => i !== index));
	}

	function clearImages() {
		setImages([]);
		setPaths([]);
	}

	// --- RETURNED VALUES & FUNCTIONS ---
	return {
		// Text chat state
		messages,
		currText,
		setCurrText,
		isLoading,
		addImage,
		images,
		removeImage,
		clearImages,
		paths,

		// Text chat actions
		handleSend,
		newChat,
		setMessages,
		getNextId,

		// Mode state and toggles
		mode,
		setMode,
		web,
		rag,
		transcript,
		voiceStatus,
		// aliases
		deleteImage: removeImage,
		deleteAllImages: clearImages,
		voice,
		toggleVoice,
		toggleWeb,
		toggleRag,
	};
}
