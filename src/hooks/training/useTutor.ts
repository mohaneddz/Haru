import { createSignal, createEffect, onCleanup } from 'solid-js';

interface MessageData {
	id: number;
	text: string;
	user: boolean;
}

export default function useTutor() {

	const [currText, setCurrText] = createSignal('');
	const [isLoading, setIsLoading] = createSignal(false);
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

	onCleanup(() => {
		abortController.abort();
	});

	const handleSend = async () => {
		const messageText = currText().trim();
		if (!messageText || isLoading()) return;

		setIsLoading(true);
		setCurrText('');

		const newUserMessage: MessageData = {
			id: Date.now(),
			text: messageText,
			user: true,
		};
		setMessages((prev) => [...prev, newUserMessage]);

		const currentMessagesForHistoryProcessing = messages().slice(0, -1);
		abortController = new AbortController();
		const signal = abortController.signal;
		const historyForBackend: { role: string; content: string }[] = [];
		let lastRoleInHistory: 'user' | 'assistant' | null = null;
		for (const msg of currentMessagesForHistoryProcessing) {
			const currentRole = msg.user ? 'user' : 'assistant';
			if (historyForBackend.length === 0 && currentRole === 'assistant') {
				continue;
			}
			if (lastRoleInHistory === null || currentRole !== lastRoleInHistory) {
				historyForBackend.push({ role: currentRole, content: msg.text });
				lastRoleInHistory = currentRole;
			} else {
				console.warn(
					`Skipping history message for LLM due to non-alternating role: ${msg.text.substring(
						0,
						50
					)}...`
				);
			}
		}

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
				const errorText = await response.text();
				console.error('Backend error:', errorText);
				setMessages((prev) => [
					...prev.slice(0, -1),
					{
						id: Date.now(),
						text: `Error: ${errorText || 'Failed to get response.'}`,
						user: false,
					},
				]);
				setIsLoading(false);
				return;
			}

			setMessages((prev) => [...prev, { id: botMessageId, text: '', user: false }]);

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
									setMessages((prev) =>
										prev.map((m) =>
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
								console.error(
									'Failed to parse stream JSON:',
									jsonStr,
									e
								);
							}
						}
					}
				}
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log("Fetch aborted successfully by the user's new action.");
			} else {
				console.error('Network or processing error:', error);
				setMessages((prev) => [
					...prev.slice(0, -1),
					{
						id: Date.now(),
						text: `Network Error: ${error.message}`,
						user: false,
					},
				]);
			}
		} finally {
			setIsLoading(false);
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
		messageContainerRef: (ref: HTMLDivElement) => (messageContainerRef = ref),
	};
}
