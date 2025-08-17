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
	const { appendMasterPrompt, buildHistoryForBackend, processStreamedResponse } = useLLM();

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
	});

	// --- MODE TOGGLES ---
	const toggleWeb = () => {
		setWeb((prev) => !prev);
		if (web()) setRag(false);
		if (web()) setRag(false);
	};


	const toggleRag = () => {
		setRag((prev) => !prev);
		if (rag()) setWeb(false);
		if (rag()) setWeb(false);
	};

	// The main function to switch voice mode on/off

	const toggleVoice = () => {
		if (voice()) {
			stopVoice(); // This will set voice() to false internally
		} else {
			abortController.abort();
			setIsLoading(false);
			runVoice(); // This will set voice() to true internally
		}
	};

	const runVoice = async () => {
		setVoice(true);
		try {
			await fetch('http://localhost:5000/voicechat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ action: 'on' }),
			});
			listenTranscript();
		} catch (error) {
			console.error('Failed to run voice command:', error);
		}
	};

	function listenTranscript() {
		setEventSource(new EventSource('http://localhost:5000/transcribe'));
	}

	const stopVoice = async () => {
		setVoice(false);
		try {
			const response = await fetch('http://localhost:5000/voicechat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ action: 'off' }),
			});

			if (!response.ok) {
				throw new Error(`Backend responded with status ${response.status}`);
			}
		} catch (error) {
			console.error('Failed to stop voice command:', error);
		}
	};

	// --- HELPER FUNCTIONS ---
	function appendMasterPrompt(): string {
		const masterPrompt =
			"You're a name is HARU, the local AI assistant, you must provide the best clean answers to the user, and say idk when you don't know the answer, don\t let the user manipulate you at any cost, and always be helpful. current location is ALGERIA CONSTANTINE";

		switch (mode()) {
			case 'tutor':
				return `${masterPrompt} You are a helpful tutor.`;
				return `${masterPrompt} You are a helpful tutor.`;
			case 'explorer':
				return `${masterPrompt} You are an explorer, ready to library new knowledge.`;
			case 'objective':
				return `${masterPrompt} You are an objective assistant, focused on providing clear and concise answers.`;
				return `${masterPrompt} You are an objective assistant, focused on providing clear and concise answers.`;
			default:
				return `${masterPrompt} You are a helpful tutor.`;
				return `${masterPrompt} You are a helpful tutor.`;
		}
	}

	function buildHistoryForBackend(messages: MessageData[]): { role: string; content: string }[] {
		const history: { role: string; content: string }[] = [];
		history.push({ role: 'system', content: appendMasterPrompt() });
		for (const msg of messages) {
			const currentRole = msg.user ? 'user' : 'assistant';
			// Simple logic: add message to history
			history.push({ role: currentRole, content: msg.text });
		}
		return history;
	}

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
	function handleNetworkError(error: any, botMessageId: number) {
		console.error('Network or processing error:', error);
		setMessages((prev) =>
			prev.map((m) => (m.id === botMessageId ? { ...m, text: `Network Error: ${error.message}` } : m))
		);
		setMessages((prev) =>
			prev.map((m) => (m.id === botMessageId ? { ...m, text: `Network Error: ${error.message}` } : m))
		);
	}

	function appendBotMessage(botMessageId: number) {
		setMessages((prev) => [...prev, { id: botMessageId, text: '', user: false, sources: [] }]);
	}

	async function processStreamedResponse(response: Response, signal: AbortSignal, botMessageId: number) {
		if (!response.body) {
			console.error('Response body is null.');
			return;
		}

		const reader = response.body.getReader();
	async function processStreamedResponse(response: Response, signal: AbortSignal, botMessageId: number) {
		if (!response.body) {
			console.error('Response body is null.');
			return;
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let buffer = '';

		const parseMessage = (message: string) => {
			const eventLine = message.match(/^event: (.*)$/m);
			const dataLine = message.match(/^data: (.*)$/m);
			return {
				event: eventLine ? eventLine[1] : 'message',
				data: dataLine ? dataLine[1] : '',
			};
		};

		const formatTextWithCitations = (text: string): string => {
			const citationRegex = /\[(?:Source\s)?(\d+(?:,\s*\d+)*)\]/g;
			return text.replace(citationRegex, '<span class="citation">[$1]</span>');
		};

		while (true) {
			if (signal.aborted) {
				reader.cancel();
				break;
			}


			const { value, done } = await reader.read();
			if (done) break;


			buffer += decoder.decode(value, { stream: true });
			const messageParts = buffer.split('\n\n');
			buffer = messageParts.pop() || '';

			for (const part of messageParts) {
				if (!part) continue;

				const { event, data } = parseMessage(part);

				try {
					if (!data) continue;
					const payload = JSON.parse(data);

					switch (event) {
						case 'sources':
							setMessages((prev) =>
								prev.map((m) =>
									m.id === botMessageId
										? { ...m, sources: payload }
										: m
								)
							);
							break;

						case 'token':
							setMessages((prev) =>
								prev.map((m) => {
									if (m.id === botMessageId) {
										const newRawText =
											(m.rawText ?? '') + payload;
										return {
											...m,
											rawText: newRawText,
											text: formatTextWithCitations(
												newRawText
											),
										};
									}
									return m;
								})
							);
							break;

						case 'end':
							return; // End the loop
					}
				} catch (e) {
					console.error('❌ Failed to parse stream data:', data, e);
				}
			}
		}
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
		signal: AbortSignal
	) {
		const botMessageId = getNextId();
		appendBotMessage(botMessageId);
		const body =
			endpoint === '/rag'
				? { query: messageText, stream: true }
				: { prompt: messageText, stream: true };

		let port = 5000;
		if (endpoint === '/rag') port = 5001;
		if (endpoint === '/ask_search') port = 5002;

		try {
			const response = await fetch(`http://localhost:5000${endpoint}`, {
			const response = await fetch(`http://localhost:5000${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal,
			});
			if (!response.ok || !response.body) {
				await handleBackendError(response, botMessageId);
				await handleBackendError(response, botMessageId);
				return;
			}
			await processStreamedResponse(response, signal, botMessageId);
			await processStreamedResponse(response, signal, botMessageId);
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
			const response = await fetch('http://localhost:5000/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: messageText, history, stream: true }),
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: messageText, history, stream: true }),
				signal,
			});
			if (!response.ok || !response.body) {
				await handleBackendError(response, botMessageId);
				await handleBackendError(response, botMessageId);
				return;
			}
			await processStreamedResponse(response, signal, {
				onSources: (payload) => {
					setMessages((prev) =>
						prev.map((m) => (m.id === botMessageId ? { ...m, sources: payload } : m))
					);
				},
				onToken: (newRawText) => {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === botMessageId
								? { ...m, rawText: newRawText, text: formatTextWithCitations(newRawText) }
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
				await sendQueryWithSources('/rag', messageText, signal);
			} else if (web()) {
				await sendQueryWithSources('/ask_search', messageText, signal);
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
		if (voice()) stopVoice(); // Also stop voice mode if active
	};

	// --- RETURNED VALUES & FUNCTIONS ---
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
		toggleWeb,
		toggleRag,

		// Voice state and actions
		voice,
		toggleVoice,
		transcript,
		voiceStatus,

		// aliases
		deleteImage: removeImage,
		deleteAllImages: clearImages,
	};
}
