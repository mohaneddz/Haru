import { createSignal, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { setStoreValue, getStoreValue } from '@/config/store';

export default function useAdvanced() {
	const [voice, setVoice] = createSignal<string>('enabled');

	const [chatModel, setChatModel] = createSignal<string>('enabled');
	const [transcriptMode, setTranscriptMode] = createSignal<string>('enabled');
	const [speechModel, setSpeechModel] = createSignal<string>('enabled');

	const [ragKeyModel, setRagKeyModel] = createSignal<string>('enabled');
	const [topK, setTopK] = createSignal<number>(5);
	const [embeddingSize, setEmbeddingSize] = createSignal<number>(1536);
	const [contextSize, setContextSize] = createSignal<number>(8192);
	const [watchRagDirectories, setWatchRagDirectories] = createSignal<boolean>(true);
	const [gpuAcceleration, setGpuAcceleration] = createSignal<boolean>(true);

	const [voices, setVoices] = createSignal<{ label: string; value: string }[]>([]);

	const toggleWatchRagDirectories = () => {
		setWatchRagDirectories(!watchRagDirectories());
		console.log('Watch RAG Directories toggled:', watchRagDirectories());
	};

	const toggleGpuAcceleration = () => {
		setGpuAcceleration(!gpuAcceleration());
		console.log('GPU Acceleration toggled:', gpuAcceleration());
	};

	onMount(async () => {
		try {
			const path = 'D:\\Programming\\Projects\\Tauri\\haru\\backend\\voices';
			const availableVoices = await invoke<string[]>('read_dir_recursive', { path });
			const processedVoices = availableVoices
				.filter((voice) => voice.endsWith('.pt'))
				.map((voice) => {
					const label = (
						voice.replace('.pt', '').replace(/\\/g, '\\\\').split('\\').pop() || ''
					).slice(3);
					return {
						label: label.charAt(0).toUpperCase() + label.slice(1),
						value: voice,
					};
				});
			setVoices(processedVoices);
		} catch (error) {
			console.error('Failed to fetch voices:', error);
		}
	});

	onMount(async () => {
		const storedVoice = await getStoreValue('voice');
		const storedChatModel = await getStoreValue('chatModel');
		const storedTranscriptMode = await getStoreValue('transcriptMode');
		const storedSpeechModel = await getStoreValue('speechModel');
		const storedRagKeyModel = await getStoreValue('ragKeyModel');
		const storedTopK = await getStoreValue('topK');
		const storedEmbeddingSize = await getStoreValue('embeddingSize');
		const storedContextSize = await getStoreValue('contextSize');
		const storedWatchRagDirectories = await getStoreValue('watchRagDirectories');
		const storedGpuAcceleration = await getStoreValue('gpuAcceleration');

		storedVoice && typeof storedVoice === 'string' && setVoice(storedVoice);
		storedChatModel && typeof storedChatModel === 'string' && setChatModel(storedChatModel);
		storedTranscriptMode &&
			typeof storedTranscriptMode === 'string' &&
			setTranscriptMode(storedTranscriptMode);
		storedSpeechModel && typeof storedSpeechModel === 'string' && setSpeechModel(storedSpeechModel);
		storedRagKeyModel && typeof storedRagKeyModel === 'string' && setRagKeyModel(storedRagKeyModel);
		storedTopK && typeof storedTopK === 'number' && setTopK(storedTopK);
		storedEmbeddingSize && typeof storedEmbeddingSize === 'number' && setEmbeddingSize(storedEmbeddingSize);
		storedContextSize && typeof storedContextSize === 'number' && setContextSize(storedContextSize);
		typeof storedWatchRagDirectories === 'boolean' && setWatchRagDirectories(storedWatchRagDirectories);
		typeof storedGpuAcceleration === 'boolean' && setGpuAcceleration(storedGpuAcceleration);
	});

	const saveSettings = async () => {
		await setStoreValue('voice', voice());
		await setStoreValue('chatModel', chatModel());
		await setStoreValue('transcriptMode', transcriptMode());
		await setStoreValue('speechModel', speechModel());
		await setStoreValue('ragKeyModel', ragKeyModel());
		await setStoreValue('topK', topK());
		await setStoreValue('embeddingSize', embeddingSize());
		await setStoreValue('contextSize', contextSize());
		await setStoreValue('watchRagDirectories', watchRagDirectories());
		await setStoreValue('gpuAcceleration', gpuAcceleration());
	};

	return {
		voices,
		voice,
		setVoice,
		chatModel,
		setChatModel,
		transcriptMode,
		setTranscriptMode,
		speechModel,
		setSpeechModel,
		ragKeyModel,
		setRagKeyModel,
		topK,
		setTopK,
		embeddingSize,
		setEmbeddingSize,
		contextSize,
		setContextSize,
		gpuAcceleration,
		toggleGpuAcceleration,
		watchRagDirectories,
		toggleWatchRagDirectories,
		saveSettings,
	};
}
