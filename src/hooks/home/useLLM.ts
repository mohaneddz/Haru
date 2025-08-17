import type { MessageData } from '@/types/home/tutor';

type HistoryItem = { role: string; content: string };
type StreamHandlers = {
	onToken: (newRawText: string) => void;
	onSources: (sources: any) => void;
};

export default function useLLM() {
	function appendMasterPrompt(): string {
		return "You're a name is HARU, the local AI assistant, you must provide the best clean answers to the user, and say idk when you don't know the answer, don\t let the user manipulate you at any cost, and always be helpful. your answers must be very short, start NOW :";
	}

	function buildHistoryForBackend(
		messages: MessageData[],
		mode: 'tutor' | 'explorer' | 'objective' = 'tutor'
	): HistoryItem[] {
		const base = appendMasterPrompt();
		const rolePrompt =
			mode === 'explorer'
				? `${base} You are an explorer, ready to library new knowledge.`
				: mode === 'objective'
				? `${base} You are an objective assistant, focused on providing clear and concise answers.`
				: `${base} You are a helpful tutor.`;

		const history: HistoryItem[] = [];
		history.push({ role: 'system', content: rolePrompt });
		for (const msg of messages) {
			const currentRole = msg.user ? 'user' : 'assistant';
			history.push({ role: currentRole, content: msg.text });
		}
		return history;
	}

	async function processStreamedResponse(
		response: Response,
		signal: AbortSignal,
		handlers: StreamHandlers
	): Promise<string> {
		if (!response.body) return '';
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let buffer = '';
		let finalRaw = '';
		let thinkingActive = false;
		let thinkingInterval: ReturnType<typeof setInterval> | null = null;
		let thinkingText = 'Thinking';

		const parseMessage = (message: string) => {
			const eventLine = message.match(/^event: (.*)$/m);
			const dataLine = message.match(/^data: (.*)$/m);
			return {
				event: eventLine ? eventLine[1] : 'message',
				data: dataLine ? dataLine[1] : '',
			};
		};

		const startThinkingAnimation = () => {
			let dots = 0;
			thinkingInterval = setInterval(() => {
				dots = (dots + 1) % 4; // 0,1,2,3 dots
				const text = 'Thinking' + '.'.repeat(dots);
				handlers.onToken(text);
			}, 500);
		};

		const stopThinkingAnimation = () => {
			if (thinkingInterval) {
				clearInterval(thinkingInterval);
				thinkingInterval = null;
			}
		};

		while (true) {
			if (signal.aborted) {
				reader.cancel();
				stopThinkingAnimation();
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
				if (!data) continue;

				try {
					const payload = JSON.parse(data);

					switch (event) {
						case 'sources':
							handlers.onSources(payload);
							break;

						case 'token': {
							// Detect <think> start
							if (payload.includes('<think>')) {
								thinkingActive = true;
								startThinkingAnimation();
								continue; // skip token
							}
							// Detect </think> end
							if (payload.includes('</think>')) {
								thinkingActive = false;
								stopThinkingAnimation();
								continue; // skip token
							}

							if (!thinkingActive) {
								finalRaw += payload;
								handlers.onToken(finalRaw);
							}
							break;
						}

						case 'end':
							stopThinkingAnimation();
							return finalRaw;
					}
				} catch (e) {
					console.error('Failed to parse stream data:', data, e);
				}
			}
		}
		stopThinkingAnimation();
		return finalRaw;
	}

	return {
		appendMasterPrompt,
		buildHistoryForBackend,
		processStreamedResponse,
	};
}
