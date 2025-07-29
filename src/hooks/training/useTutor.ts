import { createSignal, createEffect, onCleanup } from 'solid-js';

interface MessageData {
	id: number;
	text: string;
	user: boolean;
}

export default function useTutor() {
	const [currText, setCurrText] = createSignal('');
	const [isLoading, setIsLoading] = createSignal(false);

	const [web, setWeb] = createSignal(false);
	const [rag, setRag] = createSignal(false);
	const [mode, setMode] = createSignal('tutor');

	const [messages, setMessages] = createSignal<MessageData[]>([
		{
			id: Date.now(),
			text: 'Hello There.\n\nHow can I help you today?',
			user: false,
		},
	]);

	let messageContainerRef: HTMLDivElement | undefined;
	let abortController = new AbortController();

	createEffect(() => {
		messages();
		if (messageContainerRef) {
			setTimeout(() => {
				messageContainerRef!.scrollTop = messageContainerRef!.scrollHeight;
			}, 0);
		}
	});

	const toggleWeb = () => {
		setWeb((prev) => !prev);
		console.log('Web mode toggled:', web());
	};
	const toggleRag = () => {
		setRag((prev) => !prev);
		console.log('RAG mode toggled:', rag());
	};

	onCleanup(() => {
		abortController.abort();
	});

	function appendMasterPrompt() {
		switch (mode()) {
			case 'tutor':
				return 'You are a helpful tutor.';
			case 'explorer':
				return 'You are an explorer, ready to discover new knowledge.';
			case 'objective':
				return 'You are an objective assistant, focused on providing clear and concise answers.';
			default:
				return 'You are a helpful tutor.';
		}
	}

	function buildHistoryForBackend(messages: MessageData[]): { role: string; content: string }[] {
		const history: { role: string; content: string }[] = [];
		// Add master prompt as system message
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
					`Skipping history message for LLM due to non-alternating role: ${msg.text.substring(
						0,
						50
					)}...`
				);
			}
		}
		return history;
	}

	async function handleBackendError(
		response: Response,
		setMessages: (fn: (prev: MessageData[]) => MessageData[]) => void,
		setIsLoading: (value: boolean) => void
	) {
		return response.text().then((errorText) => {
			console.error('Backend error:', errorText);
			setMessages((prev: MessageData[]) => [
				...prev.slice(0, -1),
				{
					id: Date.now(),
					text: `Error: ${errorText || 'Failed to get response.'}`,
					user: false,
				},
			]);
			setIsLoading(false);
		});
	}

	function handleNetworkError(error: any, setMessages: (fn: (prev: MessageData[]) => MessageData[]) => void) {
		console.error('Network or processing error:', error);
		setMessages((prev: MessageData[]) => [
			...prev.slice(0, -1),
			{
				id: Date.now(),
				text: `Network Error: ${error.message}`,
				user: false,
			},
		]);
	}

	function appendBotMessage(
		setMessages: (fn: (prev: MessageData[]) => MessageData[]) => void,
		botMessageId: number
	) {
		setMessages((prev: MessageData[]) => [...prev, { id: botMessageId, text: '', user: false }]);
	}

	async function processStreamedResponse(
		response: Response,
		signal: AbortSignal,
		setMessages: (fn: (prev: MessageData[]) => MessageData[]) => void,
		botMessageId: number
	) {
		const reader = response.body!.getReader();
		const decoder = new TextDecoder('utf-8');
		let buffer = '';
		while (true) {
			if (signal.aborted) {
				console.log('Stream reading stopped due to new request.');
				break;
			}
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const messages = buffer.split('\n\n');
			buffer = messages.pop() || '';
			for (const msg of messages) {
				if (msg.startsWith('data: ')) {
					const jsonStr = msg.substring(6).trim();
					if (jsonStr) {
						try {
							const dataObj = JSON.parse(jsonStr);
							const content = dataObj.content;
							if (content) {
								setMessages((prev: MessageData[]) =>
									prev.map((m: MessageData) =>
										m.id === botMessageId
											? {
													...m,
													text:
														m.text +
														content,
											  }
											: m
									)
								);
							}
						} catch (e) {
							console.error('Failed to parse stream JSON:', jsonStr, e);
						}
					}
				}
			}
		}
	}

	async function sendQuestion(
		messageText: string,
		currentMessagesForHistoryProcessing: MessageData[]
	) {
		setIsLoading(true);
		setCurrText('');

		const newUserMessage: MessageData = {
			id: Date.now(),
			text: messageText,
			user: true,
		};
		setMessages((prev) => [...prev, newUserMessage]);

		const signal = (abortController = new AbortController()).signal;
		const historyForBackend = buildHistoryForBackend(currentMessagesForHistoryProcessing);

		const botMessageId = Date.now() + 1;

		try {
			const response = await fetch('http://localhost:5000/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: messageText,
					history: historyForBackend,
					stream: true,
				}),
				signal,
			});

			if (!response.ok || !response.body) {
				await handleBackendError(response, setMessages, setIsLoading);
				return;
			}

			appendBotMessage(setMessages, botMessageId);
			await processStreamedResponse(response, signal, setMessages, botMessageId);
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log("Fetch aborted successfully by the user's new action.");
			} else {
				handleNetworkError(error, setMessages);
			}
		} finally {
			setIsLoading(false);
		}
	}

	async function sendQuery(
		messageText: string,
		currentMessagesForHistoryProcessing: MessageData[]
	) {
		setIsLoading(true);
		setCurrText('');
		const newUserMessage: MessageData = {
			id: Date.now(),
			text: messageText,
			user: true,
		};
		setMessages((prev) => [...prev, newUserMessage]);

		const signal = (abortController = new AbortController()).signal;
		const historyForBackend = buildHistoryForBackend(currentMessagesForHistoryProcessing);
		const botMessageId = Date.now() + 1;

		try {
			const response = await fetch('http://localhost:5000/ask_search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					prompt: messageText,
					history: historyForBackend,
					stream: true,
				}),
				signal,
			});

			if (!response.ok || !response.body) {
				await handleBackendError(response, setMessages, setIsLoading);
				return;
			}

			appendBotMessage(setMessages, botMessageId);

			const reader = response.body.getReader();
			const decoder = new TextDecoder('utf-8');
			let buffer = '';

			while (true) {
				if (signal.aborted) {
					console.log('Stream reading stopped due to new request.');
					break;
				}
				const { value, done } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const chunks = buffer.split('\n\n');
				buffer = chunks.pop() || '';
				for (const chunk of chunks) {
					if (chunk.startsWith('data: ')) {
						const jsonStr = chunk.substring(6).trim();
						if (jsonStr) {
							try {
								const dataObj = JSON.parse(jsonStr);
								// Append token content
								if (typeof dataObj.content === 'string' && dataObj.content.length > 0) {
									setMessages((prev: MessageData[]) =>
										prev.map((m: MessageData) =>
											m.id === botMessageId
												? {
														...m,
														text: m.text + dataObj.content,
												  }
												: m
										)
									);
								}
								// Print citations if present
								if (dataObj.citations) {
									console.log('Citations:', dataObj.citations);
								}
								// Stop if final chunk
								if (dataObj.stop === true) {
									break;
								}
							} catch (e) {
								console.error('Failed to parse stream JSON:', jsonStr, e);
							}
						}
					}
				}
			}

			// Try to print sources from response headers if available
			try {
				const sourcesHeader = response.headers.get('X-Detailed-Sources');
				if (sourcesHeader) {
					console.log('Sources:', JSON.parse(sourcesHeader));
				}
			} catch (e) {
				// ignore
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log("Fetch aborted successfully by the user's new action.");
			} else {
				handleNetworkError(error, setMessages);
			}
		} finally {
			setIsLoading(false);
		}
	}

	const handleSend = async () => {
		const messageText = currText().trim();
		if (!messageText || isLoading()) return;

		const currentMessagesForHistoryProcessing = messages().slice(0, -1);

		if (web()) {
			await sendQuery(messageText, currentMessagesForHistoryProcessing);
		} else {
			await sendQuestion(messageText, currentMessagesForHistoryProcessing);
		}
	};

	const newChat = () => {
		setMessages([
			{
				id: Date.now(),
				text: 'Hello There.\n\nHow can I help you today?',
				user: false,
			},
		]);
		setCurrText('');
		setIsLoading(false);
		if (messageContainerRef) {
			messageContainerRef.scrollTop = 0;
		}
	};

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
