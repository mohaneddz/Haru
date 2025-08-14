import { createSignal, onCleanup, onMount } from 'solid-js';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { readFile } from '@tauri-apps/plugin-fs';
import { mimeFromPath } from '@/utils/misc/audioUtils';
import { invoke } from '@tauri-apps/api/core';
export default function useTranscript() {
	const [transcription, setTranscription] = createSignal<string>('');
	const [filePath, setFilePath] = createSignal<string>('');
	const [audioSrc, setAudioSrc] = createSignal<string | null>(null);
	const [error, setError] = createSignal<string>('');
	const [loadingTranscript, setLoadingTranscript] = createSignal<boolean>(false);
	const [loadingRefinement, setLoadingRefinement] = createSignal<boolean>(false);
	const [dragging, setDragging] = createSignal(false);

	let revokeUrl: string | null = null;

	// Normalize possible `file://` URIs to filesystem paths (Windows-safe).
	function normalizeDroppedPath(p: string): string {
		if (p.startsWith('file://')) {
			let out = decodeURI(p.replace('file://', ''));
			// On Windows we may get /C:/... — strip leading slash.
			if (/^\/[A-Za-z]:\//.test(out)) out = out.slice(1);
			return out;
		}
		return p;
	}

	function isAudioPath(p: string) {
		return /\.(mp3|wav|m4a|ogg|flac|aac|opus|mp4|mov)$/i.test(p);
	}

	async function loadAudioFromPath(path: string) {
		try {
			setError('');
			const fsPath = normalizeDroppedPath(path);
			console.log('Starting file read for:', fsPath); // Log 1

			const bytes = await readFile(fsPath);
			console.log('File read complete. Bytes length:', bytes.length); // Log 2: Check if this log appears quickly.

			const mime = mimeFromPath(fsPath);
			const blob = new Blob([new Uint8Array(bytes as any)], { type: mime });
			console.log('Blob created.'); // Log 3

			const newUrl = URL.createObjectURL(blob);
			console.log('Object URL created.'); // Log 4

			const prevUrl = revokeUrl;
			setAudioSrc(newUrl);
			setFilePath(fsPath);
			revokeUrl = newUrl;

			if (prevUrl) URL.revokeObjectURL(prevUrl);
			console.log('Audio source set successfully.'); // Log 5
		} catch (e: any) {
			console.error('Error reading audio file:', e);
			setAudioSrc(null);
			setFilePath('');
			setError('Failed to read audio file');
		}
	}

	async function handleTranscribe() {
		if (!filePath()) {
			setError('No file selected');
			return;
		}
		setLoadingTranscript(true);
		setError('');
		try {
			const res = await fetch('http://localhost:5004/transcribe_file', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ file_path: filePath() }),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.message || `Server error ${res.status}`);
			}

			const data = await res.json();
			// Expecting { transcription: "..." }
			if (data.transcription) {
				setTranscription(data.transcription);
			} else {
				throw new Error('No transcription returned');
			}
		} catch (err: any) {
			console.error(err);
			setError(err.message || 'Failed to transcribe audio');
		} finally {
			setLoadingTranscript(false);
		}
	}

	onMount(async () => {
		const webview = getCurrentWebview();
		const unlisten = await webview.onDragDropEvent(async (event) => {
			try {
				const { type, paths } = event.payload as { type: string; paths?: string[] };

				if (type === 'enter' || type === 'over') {
					setDragging(true);
					return;
				}

				if (type === 'leave') {
					setDragging(false);
					return;
				}

				if (type === 'drop') {
					// Always clear dragging on drop.
					setDragging(false);

					// Pick first audio file if multiple are dropped.
					const firstAudio = paths?.find((p) => isAudioPath(p)) ?? null;
					if (!firstAudio) {
						setError('Unsupported file type. Drop an audio file.');
						return;
					}

					await loadAudioFromPath(firstAudio);
					return;
				}
			} catch (e) {
				console.error('Drag-drop handler error:', e);
				setError('Failed to handle dropped file.');
			} finally {
				// Ensure overlay does not get stuck.
				if (dragging()) setDragging(false);
			}
		});

		onCleanup(() => {
			// Always detach listener and revoke any blob URL.
			try {
				unlisten();
			} catch (e) {
				console.warn('Failed to unlisten drag-drop:', e);
			}
			if (revokeUrl) {
				URL.revokeObjectURL(revokeUrl);
				revokeUrl = null;
			}
		});
	});

	async function saveTranscript() {
		try {
			const dir = 'D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Transcripts';
			// get the name of the file from it's original path
			const fileName = filePath().split('\\').pop()?.split('.').shift() + `.md` || 'Transcript';
			const savePath: string = await invoke('create_file', { dir });
			await invoke('rename_path', { oldPath: savePath, newPath: `${dir}/${fileName}` });
			await invoke('save_file', { path: `${dir}/${fileName}`, content: transcription() });

			console.log('Transcript saved to:', savePath);
			return savePath;
		} catch (err) {
			console.error('Failed to save transcript:', err);
			return null;
		}
	}

	async function refineTranscript() {
		// No transcript to refine
		if (!transcription().trim()) {
			setError('No transcription available to refine.');
			return;
		}

		setLoadingRefinement(true);
		setError('');

		try {
			const res = await fetch('http://localhost:5004/refine_transcript', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transcript: transcription() }),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.detail || `Server error ${res.status}`);
			}

			const data = await res.json();

			// --- MODIFICATION ---
			// Expect 'refined_chunks' which is an array of [index, text]
			const chunks = data.refined_chunks;

			if (!Array.isArray(chunks)) {
				throw new Error('Server response did not contain a valid chunks array.');
			}

			// The array is already sorted by the backend, but sorting again on the client is a safe fallback.
			const refined = chunks
				.sort((a, b) => a[0] - b[0]) // Sort by index (first element)
				.map(([_, text]) => text) // Extract text (second element)
				.join('\n\n'); // Join into a single string

			// Update the transcription state with the final, assembled string.
			setTranscription(refined);
		} catch (err: any) {
			console.error('Failed to refine transcript:', err);
			setError(err.message || 'An unexpected error occurred.');
		} finally {
			setLoadingRefinement(false);
		}
	}

	return {
		transcription,
		setTranscription,
		filePath,
		setFilePath,
		audioSrc,
		setAudioSrc,
		error,
		setError,
		loadingTranscript,
		setLoadingTranscript,
		loadingRefinement,
		setLoadingRefinement,
		loadAudioFromPath,
		handleTranscribe,
		saveTranscript,
		refineTranscript,
		dragging,
		setDragging,
	};
}
