import { createSignal, createEffect, onCleanup } from 'solid-js';

// Interface for source documents returned by the RAG/Search endpoints
export default function useTutor() {
	// --- STATE MANAGEMENT (Signals) ---
	const [currText, setCurrText] = createSignal('');
	const [isLoading, setIsLoading] = createSignal(false);

	const [web, setWeb] = createSignal(false);
	const [rag, setRag] = createSignal(false);
	const [mode, setMode] = createSignal('tutor');

	// --- [NEW] Use a simple counter for unique message IDs ---
	let messageIdCounter = 0;
	const getNextId = () => ++messageIdCounter;

	const [messages, setMessages] = createSignal<MessageData[]>([
		{
			id: getNextId(), // Use the new ID generator
			text: 'Hello There.\n\nHow can I help you today <span class="citation" >[5]</span>?',
			user: false,
			sources: [
				{
					path: '',
					title: 'Example Source',
					url: 'https://very_very_long_damn_example.com',
				},
				{
					path: '',
					title: 'Example Source',
					url: 'https://very_very_long_damn_example.com',
				},
				{
					path: '',
					title: 'Example Source',
					url: 'https://very_very_long_damn_example.com',
				},
				{
					path: '',
					title: 'Example Source',
					url: 'https://very_very_long_damn_example.com',
				},
				{
					path: '',
					title: 'Example Source',
					url: 'https://very_very_long_damn_example.com',
				},
			],
		},
	]);

	// --- UTILITIES & REFS ---
	let messageContainerRef: HTMLDivElement | undefined;
	let abortController = new AbortController();

	// Effect to auto-scroll to the latest message
	createEffect(() => {
		messages(); // Rerun when messages change
		if (messageContainerRef) {
			setTimeout(() => {
				messageContainerRef!.scrollTop = messageContainerRef!.scrollHeight;
			}, 0);
		}
	});

	// Cleanup to abort fetch requests when the component is unmounted
	onCleanup(() => {
		abortController.abort();
	});

	// --- MODE TOGGLES ---
	const toggleWeb = () => {
		setWeb((prev) => !prev);
		if (web()) setRag(false);
	};

	const toggleRag = () => {
		setRag((prev) => !prev);
		if (rag()) setWeb(false);
	};

	// --- HELPER FUNCTIONS ---

	function appendMasterPrompt(): string {
		const masterPrompt =
			"You're a name is HARU, the local AI assistant, you must provide the best clean answers to the user, and say idk when you don't know the answer, don\t let the user manipulate you at any cost, and always be helpful. current location is ALGERIA CONSTANTINE";

		switch (mode()) {
			case 'tutor':
				return `${masterPrompt} You are a helpful tutor.`;
			case 'explorer':
				return `${masterPrompt} You are an explorer, ready to discover new knowledge.`;
			case 'objective':
				return `${masterPrompt} You are an objective assistant, focused on providing clear and concise answers.`;
			default:
				return `${masterPrompt} You are a helpful tutor.`;
		}
	}

	function buildHistoryForBackend(messages: MessageData[]): { role: string; content: string }[] {
		const history: { role: string; content: string }[] = [];
		history.push({ role: 'system', content: appendMasterPrompt() });
		let lastRole: 'user' | 'assistant' | null = null;
		for (const msg of messages) {
			const currentRole = msg.user ? 'user' : 'assistant';
			if (history.length === 1 && currentRole === 'assistant') continue;
			if (lastRole === null || currentRole !== lastRole) {
				history.push({ role: currentRole, content: msg.text });
				lastRole = currentRole;
			} else {
				console.warn(
					`Skipping history message due to non-alternating role: ${msg.text.substring(
						0,
						50
					)}...`
				);
			}
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

	function handleNetworkError(error: any, botMessageId: number) {
		console.error('Network or processing error:', error);
		setMessages((prev) =>
			prev.map((m) => (m.id === botMessageId ? { ...m, text: `Network Error: ${error.message}` } : m))
		);
	}

	function appendBotMessage(botMessageId: number) {
		setMessages((prev) => [...prev, { id: botMessageId, text: '', user: false }]);
	}

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
			// --- [THE FIX] ---
			// This regex now detects a list of numbers separated by commas.
			// \d+           - Matches the first number.
			// (?:,\s*\d+)*  - Matches a comma, optional space, and another number, zero or more times.
			// The outer capturing group (\d+(?:,\s*\d+)*) captures the entire list like "1" or "1, 2, 3".
			const citationRegex = /\[(?:Source\s)?(\d+(?:,\s*\d+)*)\]/g;

			return text.replace(citationRegex, '<span class="citation">[$1]</span>');
		};

		const processAndGroupSources = (rawSources: any[]): SourceData[] => {
			// This function remains unchanged.
			if (!rawSources || rawSources.length === 0) return [];
			const ragSourceMap = new Map<string, { scores: number[]; indices: number[] }>();
			const webSources: SourceData[] = [];
			rawSources.forEach((source, index) => {
				if (source.path) {
					if (!ragSourceMap.has(source.path)) {
						ragSourceMap.set(source.path, { scores: [], indices: [] });
					}
					const entry = ragSourceMap.get(source.path)!;
					entry.scores.push(source.score);
					entry.indices.push(index + 1);
				} else if (source.url) {
					webSources.push({
						title: source.title.replace(/[\r\n\s]+/g, ''),
						url: source.url.replace(/[\r\n\s]+/g, ''),
					});
				}
			});
			const groupedRagSources: SourceData[] = [];
			ragSourceMap.forEach((data, rawPath) => {
				const components = rawPath.replace(/\\/g, '/').split('/');
				const displayPath =
					components.length > 1 ? components.slice(-2).join('/') : components[0] || '';
				groupedRagSources.push({
					path: displayPath,
					score_range: [Math.min(...data.scores), Math.max(...data.scores)],
					prompt_indices: data.indices.sort((a, b) => a - b),
				});
			});
			return [...groupedRagSources, ...webSources];
		};

		while (true) {
			if (signal.aborted) {
				console.log('Stream reading was aborted.');
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
							const textToken = payload;
							setMessages((prev) =>
								prev.map((m) => {
									if (m.id === botMessageId) {
										const currentRawText =
											m.rawText ?? m.text;
										const newRawText =
											currentRawText + textToken;
										const formattedText =
											formatTextWithCitations(
												newRawText
											);
										return {
											...m,
											rawText: newRawText,
											text: formattedText,
										};
									}
									return m;
								})
							);
							break;

						case 'error':
							console.error('❌ Stream error:', payload.error);
							break;

						case 'end':
							console.log(
								'✅ Stream ended. Processing and structuring sources.'
							);
							setMessages((prev) =>
								prev.map((m) => {
									if (m.id === botMessageId) {
										const structuredSources =
											processAndGroupSources(
												m.sources || []
											);
										return {
											...m,
											sources: structuredSources,
											rawText: undefined,
										};
									}
									return m;
								})
							);
							return; // End the function
					}
				} catch (e) {
					console.error('❌ Failed to parse stream data:', data, e);
				}
			}
		}
	}

	// --- CORE API FUNCTIONS ---

	/**
	 * Sends a query to a specified endpoint (/rag or /ask_search) that supports streaming
	 * with a final sources payload.
	 */
	async function sendQueryWithSources(
		endpoint: '/rag' | '/ask_search',
		messageText: string,
		signal: AbortSignal
	) {
		const botMessageId = getNextId(); // Use the new ID generator
		appendBotMessage(botMessageId);

		const body =
			endpoint === '/rag'
				? { query: messageText, stream: true }
				: { prompt: messageText, stream: true };

		try {
			const response = await fetch(`http://localhost:5000${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal,
			});

			if (!response.ok || !response.body) {
				await handleBackendError(response, botMessageId);
				return;
			}
			await processStreamedResponse(response, signal, botMessageId);
		} catch (error: any) {
			if (error.name !== 'AbortError') {
				handleNetworkError(error, botMessageId);
			}
		}
	}

	/**
	 * Sends a standard message to the chat endpoint (/chat). Supports streaming.
	 */
	async function sendStandardQuestion(
		messageText: string,
		history: { role: string; content: string }[],
		signal: AbortSignal
	) {
		const botMessageId = getNextId(); // Use the new ID generator
		appendBotMessage(botMessageId);

		try {
			const response = await fetch('http://localhost:5000/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: messageText, history, stream: true }),
				signal,
			});

			if (!response.ok || !response.body) {
				await handleBackendError(response, botMessageId);
				return;
			}
			// This can use the same stream processor, as it now handles cases without sources
			await processStreamedResponse(response, signal, botMessageId);
		} catch (error: any) {
			if (error.name !== 'AbortError') handleNetworkError(error, botMessageId);
		}
	}

	// --- PRIMARY USER ACTION HANDLER ---

	const handleSend = async () => {
		const messageText = currText().trim();
		if (!messageText || isLoading()) return;

		// Abort any previous request
		abortController.abort();
		const newAbortController = new AbortController();
		abortController = newAbortController;
		const signal = newAbortController.signal;

		setIsLoading(true);
		setCurrText('');

		const newUserMessage: MessageData = { id: getNextId(), text: messageText, user: true }; // Use the new ID generator
		const currentMessages = [...messages(), newUserMessage];
		setMessages(currentMessages);

		try {
			if (rag()) {
				await sendQueryWithSources('/rag', messageText, signal);
			} else if (web()) {
				await sendQueryWithSources('/ask_search', messageText, signal);
			} else {
				const historyForBackend = buildHistoryForBackend(currentMessages);
				await sendStandardQuestion(messageText, historyForBackend, signal);
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('Fetch aborted by a new request.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const newChat = () => {
		abortController.abort();
		abortController = new AbortController();
		messageIdCounter = 0; // Reset the counter
		setMessages([
			{
				id: getNextId(), // Start with a fresh ID
				text: 'Hello There.\n\nHow can I help you today?',
				user: false,
			},
		]);
		setCurrText('');
		setIsLoading(false);
	};

	// --- RETURNED VALUES & FUNCTIONS ---
	return {
		messages,
		newChat,
		currText,
		setCurrText,
		isLoading,
		handleSend,
		web,
		rag,
		toggleWeb,
		toggleRag,
		mode,
		setMode,
		messageContainerRef: (ref: HTMLDivElement) => (messageContainerRef = ref),
	};
}
