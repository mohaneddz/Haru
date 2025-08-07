import { createStore } from 'solid-js/store';
import { getStoreValue, setStoreValue } from '@/config/store';
import { fetch } from '@tauri-apps/plugin-http';
import { writeFile, mkdir } from '@tauri-apps/plugin-fs';
import { join, appDataDir, tempDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import { onMount, createSignal, createEffect } from 'solid-js';

export interface Download {
	name: string;
	status: 'not_downloaded' | 'downloading' | 'downloaded' | 'error' | 'paused' | 'queued';
	size: string;
	links?: string[];
	command?: string;
	progress: number;
	error?: string;
}

interface DownloadTask {
	name: string;
	abortController: AbortController;
	tempDir: string;
}

export default function useDownloads() {
	const [token, setToken] = createSignal('');
	const [currentDownload, setCurrentDownload] = createSignal<DownloadTask | null>(null);
	const [downloadQueue, setDownloadQueue] = createSignal<string[]>([]);
	const [downloads, setDownloads] = createStore<Download[]>([
		{
			name: 'Gemma3-4B-Q4',
			status: 'not_downloaded',
			size: '1.2 GB',
			progress: 0,
			links: [
				'https://huggingface.co/google/gemma-3-4b-it-qat-q4_0-gguf/resolve/main/gemma-3-4b-it-q4_0.gguf?download=true',
				'https://huggingface.co/google/gemma-3-4b-it-qat-q4_0-gguf/resolve/main/mmproj-model-f16-4B.gguf?download=true',
			],
		},
		{
			name: 'Bitnet-b1.58-2B-4T',
			status: 'not_downloaded',
			size: '800 MB',
			progress: 0,
			links: ['https://example.com/bitnet-b1-58-2b-4t.gguf'],
		},
		{
			name: 'Kukoro-82M',
			status: 'not_downloaded',
			size: '1.2 GB',
			progress: 0,
			links: ['https://example.com/kukoro-82m.gguf'],
		},
		{
			name: 'KeyBert',
			status: 'not_downloaded',
			size: '1.2 GB',
			progress: 0,
			links: ['https://example.com/keybert.gguf'],
		},
		{
			name: 'Whisper3-Large-Turbo',
			status: 'not_downloaded',
			size: '1.2 GB',
			progress: 0,
			links: ['https://example.com/whisper3-large-turbo.gguf'],
		},
	]);

	window.addEventListener('beforeunload', (e) => {
		// loop over the current downloads if one is downloading
		if (downloads.some((d) => d.status === 'downloading')) {
			e.preventDefault();
			stopDownload(currentDownload()?.name || '');
		}
		e.returnValue = '';
	});

	onMount(async () => {
		try {
			console.log('useDownloads onMount: fetching hf_token...');
			const hf_token = await getStoreValue<string>('hf_token');

			if (hf_token !== null && hf_token !== undefined) {
				setToken(hf_token);
				console.log(`useDownloads onMount: HF Token set: ${hf_token}`);
			} else {
				console.warn('useDownloads onMount: HF Token not found in store, using empty token');
			}
		} catch (error) {
			console.error('useDownloads onMount: Error fetching hf_token:', error);
		}
	});

	async function ensureDirectoryExists(path: string): Promise<void> {
		const folderExists = await invoke<boolean>('verify_folder', { path });
		if (!folderExists) {
			await mkdir(path, { recursive: true });
		}
	}

	async function downloadFile(link: string, tempDir: string, abortController: AbortController): Promise<string> {
		const url = new URL(link);
		const filename = url.pathname.split('/').pop() || 'downloaded_file';
		const tempFilePath = await join(tempDir, filename);

		console.log(`Downloading ${filename} from ${link} to temp location`);
		const response = await fetch(link, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token()}`,
			},
			signal: abortController.signal,
		});

		if (!response.ok) {
			throw new Error(`Failed to download ${filename}: ${response.status} ${response.statusText}`);
		}

		if (!response.body) {
			throw new Error('Response body is null');
		}

		const contentLength = Number(response.headers.get('Content-Length'));
		const reader = response.body.getReader();
		let receivedLength = 0;
		const chunks: Uint8Array[] = [];

		while (true) {
			if (abortController.signal.aborted) {
				throw new Error('Download cancelled');
			}

			const { done, value } = await reader.read();
			if (done) break;

			chunks.push(value);
			receivedLength += value.length;

			if (contentLength) {
				const progress = Math.round((receivedLength / contentLength) * 100);
				console.log(`Progress: ${progress}%`);
			}
		}

		const uint8Array = new Uint8Array(receivedLength);
		let position = 0;
		for (const chunk of chunks) {
			uint8Array.set(chunk, position);
			position += chunk.length;
		}

		await writeFile(tempFilePath, uint8Array);
		console.log(`File ${filename} downloaded to temp successfully`);
		return tempFilePath;
	}

	async function moveFileToFinalLocation(tempFilePath: string, finalDir: string): Promise<void> {
		const filename = tempFilePath.split(/[/\\]/).pop() || 'file';
		const finalPath = await join(finalDir, filename);

		await invoke('move_path', { source: tempFilePath, destination: finalPath });
		console.log(`File ${filename} moved to final location`);
	}

	async function cleanUpTempDirectory(tempDir: string): Promise<void> {
		try {
			await invoke('delete_path', { path: tempDir });
			console.log(`Temporary directory cleaned up: ${tempDir}`);
		} catch (cleanupError) {
			console.warn(`Failed to clean up temp directory:`, cleanupError);
		}
	}

	// Add queue management functions
	function addToQueue(name: string) {
		if (!downloadQueue().includes(name)) {
			setDownloadQueue(prev => [...prev, name]);
		}
	}

	function removeFromQueue(name: string) {
		setDownloadQueue(prev => prev.filter(n => n !== name));
	}

	function processQueue() {
		if (currentDownload() || downloadQueue().length === 0) return;
		
		const nextDownload = downloadQueue()[0];
		removeFromQueue(nextDownload);
		_downloadModel(nextDownload);
	}

	async function pauseDownload(name: string) {
		const modelIndex = downloads.findIndex((m) => m.name === name);
		if (modelIndex === -1) return;

		const current = currentDownload();
		if (current && current.name === name) {
			current.abortController.abort();
			setDownloads(modelIndex, 'status', 'paused');
			setCurrentDownload(null);
			processQueue();
		}
	}

	async function stopDownload(name: string) {
		const modelIndex = downloads.findIndex((m) => m.name === name);
		if (modelIndex === -1) return;

		const current = currentDownload();
		if (current && current.name === name) {
			current.abortController.abort();
			try {
				await cleanUpTempDirectory(current.tempDir);
			} catch (error) {
				console.warn('Failed to cleanup temp directory:', error);
			}
			setCurrentDownload(null);
		}
		
		removeFromQueue(name);
		setDownloads(modelIndex, 'status', 'not_downloaded');
		setDownloads(modelIndex, 'progress', 0);
		setDownloads(modelIndex, 'error', undefined);
		processQueue();
	}

	async function resumeDownload(name: string) {
		const modelIndex = downloads.findIndex((m) => m.name === name);
		if (modelIndex === -1) return;

		if (downloads[modelIndex].status === 'paused') {
			if (currentDownload()) {
				addToQueue(name);
				setDownloads(modelIndex, 'status', 'queued');
			} else {
				_downloadModel(name);
			}
		}
	}

	async function _downloadModel(name: string) {
		console.log(`Downloading model: ${name}`);

		const modelIndex = downloads.findIndex((m) => m.name === name);
		if (modelIndex === -1) {
			console.error(`Model ${name} not found`);
			return;
		}

		const model = downloads[modelIndex];
		const abortController = new AbortController();
		
		setDownloads(modelIndex, 'status', 'downloading');
		setDownloads(modelIndex, 'progress', 0);

		try {
			const modelsPath =
				(await getStoreValue<string>('modelsPath')) ||
				(await join(await appDataDir(), 'models'));
			console.log(`Models path resolved: ${modelsPath}`);
			await ensureDirectoryExists(modelsPath);
			console.log(`Ensured models directory exists: ${modelsPath}`);

			const tempDownloadDir = await join(await tempDir(), `haru-download-${Date.now()}`);
			console.log(`Temporary download directory created: ${tempDownloadDir}`);
			await ensureDirectoryExists(tempDownloadDir);
			console.log(`Ensured temporary download directory exists: ${tempDownloadDir}`);

			setCurrentDownload({ name, abortController, tempDir: tempDownloadDir });

			const downloadedFiles: string[] = [];
			for (const link of model.links || []) {
				try {
					if (abortController.signal.aborted) {
						throw new Error('Download cancelled');
					}
					
					const tempFilePath = await downloadFile(link, tempDownloadDir, abortController);
					downloadedFiles.push(tempFilePath);
				} catch (fileError) {
					if (abortController.signal.aborted) {
						console.log(`Download cancelled for ${name}`);
						return;
					}
					
					const errorMessage =
						fileError instanceof Error
							? fileError.message
							: JSON.stringify(fileError);
					console.error(`Failed to download file from ${link}:`, errorMessage);
					setDownloads(modelIndex, 'status', 'error');
					setDownloads(modelIndex, 'error', errorMessage);
					setCurrentDownload(null);
					processQueue();
					return;
				}
			}

			for (const tempFilePath of downloadedFiles) {
				try {
					await moveFileToFinalLocation(tempFilePath, modelsPath);
				} catch (moveError) {
					const errorMessage =
						moveError instanceof Error
							? moveError.message
							: JSON.stringify(moveError);
					console.error(`Failed to move file ${tempFilePath}:`, errorMessage);
					setDownloads(modelIndex, 'status', 'error');
					setDownloads(modelIndex, 'error', `Failed to move file: ${errorMessage}`);
					setCurrentDownload(null);
					processQueue();
					return;
				}
			}

			console.log(`Cleaning up temporary directory: ${tempDownloadDir}`);
			await cleanUpTempDirectory(tempDownloadDir);
			console.log(`Temporary directory cleaned up: ${tempDownloadDir}`);

			if (downloads[modelIndex].status !== 'error') {
				setDownloads(modelIndex, 'status', 'downloaded');
				setDownloads(modelIndex, 'progress', 100);
				console.log(`Model ${name} marked as downloaded`);
			}

			setCurrentDownload(null);
			processQueue();
			console.log(`Model ${name} download completed`);
		} catch (error) {
			if (abortController.signal.aborted) {
				console.log(`Download cancelled for ${name}`);
				return;
			}
			
			const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
			console.error(`Failed to download model ${name}:`, errorMessage);
			setDownloads(modelIndex, 'status', 'error');
			setDownloads(modelIndex, 'error', errorMessage);
			setCurrentDownload(null);
			processQueue();
		}
	}

	async function downloadModel(name: string) {
		const modelIndex = downloads.findIndex((m) => m.name === name);
		if (modelIndex === -1) return;

		// Prevent duplicate downloads
		const model = downloads[modelIndex];
		if (model.status === 'downloading' || model.status === 'queued') {
			console.warn(`Model ${name} is already downloading or queued.`);
			return;
		}

		if (currentDownload()) {
			addToQueue(name);
			setDownloads(modelIndex, 'status', 'queued');
		} else {
			_downloadModel(name);
		}
	}

	createEffect(() => {
		if (token()) {
			setStoreValue('hf_token', token());
		}
	});

	return {
		downloads,
		downloadModel,
		pauseDownload,
		stopDownload,
		resumeDownload,
		token,
		setToken,
		currentDownload: () => currentDownload()?.name,
		downloadQueue,
	};
}
