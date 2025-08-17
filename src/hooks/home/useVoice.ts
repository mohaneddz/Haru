import { createSignal, onCleanup } from 'solid-js';
import type { MessageData } from '@/types/home/tutor';

type HistoryItem = { role: string; content: string };
type StreamHandlers = {
	onToken: (newRawText: string) => void;
	onSources: (sources: any) => void;
};

const VOICE_API_URL = 'http://localhost:5005'; // Ensure this matches the backend URL

export default function useVoice(deps: {
	getMessages: () => MessageData[];
	setMessages: (updater: (prev: MessageData[]) => MessageData[]) => void;
	getNextId: () => number;
	buildHistoryForBackend: (messages: MessageData[]) => HistoryItem[];
	processStreamedResponse: (response: Response, signal: AbortSignal, handlers: StreamHandlers) => Promise<string>;
	setIsLoading: (value: boolean) => void;
}) {
	const { getMessages, setMessages, getNextId, buildHistoryForBackend, processStreamedResponse, setIsLoading } =
		deps;

	const [voice, setVoice] = createSignal(false);
	const [transcript, setTranscript] = createSignal('');
	const [voiceStatus] = createSignal('Listening...');

	let eventSource: EventSource | null = null;
	let voiceAbortController: AbortController | null = null;

	function openSSE() {
		try {
			eventSource?.close();
			eventSource = new EventSource(`${VOICE_API_URL}/transcribe`);

			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					const text = typeof data.text === 'string' ? data.text.trim() : '';

					if (data.type === 'partial') {
						setTranscript(text);
					} else if (data.type === 'final') {
						setTranscript(text);
						eventSource?.close();
						eventSource = null;
						finalizeAndSend();
					}
				} catch (e) {
					console.error('Error parsing SSE message:', e, 'Data:', event.data);
				}
			};

			eventSource.onerror = (err) => {
				console.error('Transcription SSE error:', err);
				eventSource?.close();
				eventSource = null;
			};
		} catch (e) {
			console.error('Failed to create EventSource:', e);
		}
	}

	async function startListeningForNextTurn() {
		try {
			const res = await fetch(`${VOICE_API_URL}/start_listen`, { method: 'POST' });
			if (res.ok) {
				openSSE();
			} else {
				console.error('Failed to re-arm listener.');
			}
		} catch (e) {
			console.error('Failed to start next listening session:', e);
		}
	}

	const stopVoiceServices = async () => {
		if (!voice()) return;
		try {
			eventSource?.close();
			eventSource = null;
			await Promise.allSettled([
				fetch(`${VOICE_API_URL}/stop_listen`, { method: 'POST' }),
			]);
		} catch (error) {
			console.error('Failed to stop voice services:', error);
		} finally {
			setVoice(false);
			setTranscript('');
		}
	};

	const toggleVoice = async () => {
		if (voice()) {
			await stopVoiceServices();
		} else {
			setVoice(true);
			setIsLoading(false);
			const res = await fetch(`${VOICE_API_URL}/start_listen`, { method: 'POST' });
			if (res.ok) openSSE();
		}
	};

	function finalizeAndSend() {
		if (!voice()) return;
		const finalTranscript = transcript().trim();
		if (!finalTranscript) {
			setTranscript('');
			void startListeningForNextTurn();
			return;
		}

		const currentMsgs = getMessages();
		const newUserMessage: MessageData = { id: getNextId(), text: finalTranscript, user: true };
		setMessages((prev) => [...prev, newUserMessage]);
		void sendVoiceQuery(finalTranscript, currentMsgs);
		setTranscript('');
	}

	async function sendVoiceQuery(prompt: string, history: MessageData[]) {
		setIsLoading(true);

		if (voiceAbortController) voiceAbortController.abort();
		voiceAbortController = new AbortController();
		const signal = voiceAbortController.signal;

		const botMessageId = getNextId();
		setMessages((prev) => [...prev, { id: botMessageId, text: '', user: false, sources: [] }]);

		const historyForBackend = buildHistoryForBackend(history);

		try {
			const response = await fetch(`${VOICE_API_URL}/voice`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt, chat_history: historyForBackend }),
				signal,
			});

			if (!response.ok || !response.body) {
				const errorText = await response.text();
				console.error('Backend error:', errorText);
				setMessages((prev) =>
					prev.map((m) =>
						m.id === botMessageId
							? {
									...m,
									text: `Error: ${
										errorText || 'Failed to get response.'
									}`,
							  }
							: m
					)
				);
				return;
			}

			const finalRaw = await processStreamedResponse(response, signal, {
				onSources: (payload) => {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === botMessageId ? { ...m, sources: payload } : m
						)
					);
				},
				onToken: (newRawText) => {
					// simple pass-through; tutor formats if needed
					setMessages((prev) =>
						prev.map((m) =>
							m.id === botMessageId
								? { ...m, rawText: newRawText, text: newRawText }
								: m
						)
					);
				},
			});

			if (voice() && finalRaw && finalRaw.trim().length > 0) {
				try {
					await fetch(`${VOICE_API_URL}/speak`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ text: finalRaw }),
					});
				} catch (e) {
					console.error('TTS speak error:', e);
				}
			}
		} catch (error: any) {
			if (error.name !== 'AbortError') {
				console.error('Network or processing error:', error);
				setMessages((prev) =>
					prev.map((m) =>
						m.id === botMessageId
							? { ...m, text: `Network Error: ${error.message}` }
							: m
					)
				);
			}
		} finally {
			setIsLoading(false);
			if (voice()) {
				await startListeningForNextTurn();
			}
		}
	}

	onCleanup(() => {
		if (voiceAbortController) voiceAbortController.abort();
		eventSource?.close();
		eventSource = null;
	});

	return {
		voice,
		transcript,
		voiceStatus,
		toggleVoice,
		stopVoiceServices,
	};
}
