import { Accessor, Setter, onCleanup, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getClipboardFilePaths, isClipboardImageObject } from '@/utils/core/clipboard';
import {
	hasImage,
	readImage as readClipboardImage,
	readText as readClipboardText,
	startListening,
	stopListening,
	onClipboardChange,
} from 'tauri-plugin-clipboard-x-api';

type UseChatArgs = {
	currText: Accessor<string>;
	setCurrText: Setter<string>;
	addImage: (image: string, path: string) => void;
};

export default function useChat({ currText, setCurrText, addImage }: UseChatArgs) {
	let textareaRef: HTMLTextAreaElement | undefined;
	const setTextareaRef = (el: HTMLTextAreaElement) => {
		textareaRef = el;
	};

	// helper: persist a data URL into a temp file via Tauri, returns temp path
	async function persistToTemp(dataUrl: string): Promise<string> {
		try {
			const tempPath = (await invoke('save_image_from_base64', { base64Str: dataUrl })) as string;
			return tempPath;
		} catch (e) {
			console.error('Failed to persist image to temp via save_image_from_base64:', e);
			return '';
		}
	}

	// helper: Blob -> data URL
	function blobToDataURL(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (e) => reject(e);
			reader.readAsDataURL(blob);
		});
	}

	// convert clipboard image base64 or Blob -> addImage (always create temp copy)
	async function handleImageAsBlob(blob: Blob) {
		try {
			const dataUrl = await blobToDataURL(blob);
			const tempPath = await persistToTemp(dataUrl);
			addImage(dataUrl, tempPath);
		} catch (e) {
			console.error('handleImageAsBlob failed:', e);
		}
	}

	// read image from a local path via existing Rust 'read_image' command, then copy to temp
	async function handleImageFromPath(path: string) {
		try {
			const base64 = (await invoke('read_image', { path })) as string; // returns data URL (png labeled)
			const tempPath = await persistToTemp(base64);
			addImage(base64, tempPath);
			console.log('Added image via invoke from path -> temp:', path, '=>', tempPath);
		} catch (e) {
			console.error(`Failed to read/copy image from path "${path}" with invoke:`, e);
		}
	}

	// try to download an image URL, convert to data URL, persist to temp, then add
	async function handleImageFromUrl(url: string) {
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Failed to fetch image URL: ${res.status}`);
			const blob = await res.blob();
			await handleImageAsBlob(blob);
		} catch (e) {
			console.warn('Failed to fetch image URL, falling back to adding raw URL only:', e);
			// last-resort fallback; no temp path
			addImage(url, '');
		}
	}

	// Unified paste handler using CF_HDROP (Rust) -> clipboard-x -> navigator.clipboard -> text
	async function handlePastedContent() {
		try {
			const files = await getClipboardFilePaths();
			if (files.length > 0) {
				// Process all image files on clipboard (copy to temp)
				for (const filePath of files) {
					if (filePath.match(/\.(png|jpe?g|webp|gif|bmp|tiff)$/i)) {
						await handleImageFromPath(filePath);
					} else {
						console.log('Non-image file on clipboard (ignored):', filePath);
					}
				}
				return; // handled all files, stop here
			}
		} catch (e) {
			console.debug('[clipboard] getClipboardFilePaths error:', e);
		}

		// 2) If there's an image in clipboard (clipboard-x hasImage/readImage)
		try {
			if (await hasImage()) {
				const img: unknown = await readClipboardImage();
				if (typeof img === 'string') {
					const dataUrl = img.startsWith('data:') ? img : `data:image/png;base64,${img}`;
					const tempPath = await persistToTemp(dataUrl);
					addImage(dataUrl, tempPath);
				} else if (isClipboardImageObject(img)) {
					const dataArray =
						(img as any).data instanceof ArrayBuffer
							? new Uint8Array((img as any).data)
							: (img as any).data instanceof Uint8Array
							? (img as any).data
							: new Uint8Array((img as any).data as number[]);
					const blob = new Blob([dataArray.buffer], { type: (img as any).mime });
					await handleImageAsBlob(blob);
				} else {
					// fallback to navigator clipboard items
					try {
						const items = await navigator.clipboard.read();
						for (const item of items) {
							const t = item.types.find((tt) => tt.startsWith('image/'));
							if (t) {
								const blob = await item.getType(t);
								await handleImageAsBlob(blob);
								return;
							}
						}
					} catch (_) {}
				}
				return;
			}
		} catch (e) {
			console.debug('[clipboard] hasImage/readImage failed:', e);
		}

		// 3) Fallback to navigator.clipboard.read()
		try {
			const clipboardItems = await navigator.clipboard.read();
			for (const item of clipboardItems) {
				const imageType = item.types.find((t) => t.startsWith('image/'));
				if (imageType) {
					const blob = await item.getType(imageType);
					await handleImageAsBlob(blob);
					return;
				}
			}
		} catch (e) {
			console.debug('[clipboard] navigator.clipboard.read failed:', e);
		}

		// 4) Fallback to plain text via plugin readText (clipboard-x)
		try {
			const text = (await readClipboardText()).trim();
			if (!text) return;
			const isImageUrl = text.startsWith('http') && text.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
			if (isImageUrl) {
				await handleImageFromUrl(text);
			} else {
				setCurrText(currText() + text);
			}
		} catch (e) {
			console.log('Clipboard did not contain files, images, or text (or read failed).');
		}
	}

	// Drag-and-drop (unchanged, but ensure temp copy)
	const setupDragDrop = async (): Promise<UnlistenFn> => {
		const webview = getCurrentWebview();
		return await webview.onDragDropEvent(async (event) => {
			if (event.payload.type === 'drop') {
				const path = event.payload.paths[0];
				if (path && path.match(/\.(png|jpeg|jpg|webp|gif|bmp|tiff)$/i)) {
					await handleImageFromPath(path);
				}
			}
		});
	};

	// optional: react to clipboard changes globally (start listening)
	let unlistenClipboard: (() => Promise<void>) | undefined;
	onMount(async () => {
		let unlistenDragDrop: UnlistenFn | undefined;

		if (textareaRef) {
			const pasteHandler = (e: ClipboardEvent) => {
				e.preventDefault();
				handlePastedContent();
			};
			const dragOverHandler = (e: DragEvent) => {
				e.preventDefault();
			};

			textareaRef.addEventListener('paste', pasteHandler);
			textareaRef.addEventListener('dragover', dragOverHandler);

			onCleanup(() => {
				textareaRef?.removeEventListener('paste', pasteHandler);
				textareaRef?.removeEventListener('dragover', dragOverHandler);
			});
		}

		// Setup the global drag-drop listener
		unlistenDragDrop = await setupDragDrop();

		// Start listening to clipboard changes (optional)
		try {
			await startListening();
			const un = await onClipboardChange(async (_: any) => {
				try {
					// Try CF_HDROP invoke first on clipboard update
					try {
						const files = await getClipboardFilePaths();
						if (files.length > 0) {
							const imagePath = files.find((p: string) =>
								p.match(/\.(png|jpe?g|webp|gif|bmp|tiff)$/i)
							);
							if (imagePath) await handleImageFromPath(imagePath);
							return;
						}
					} catch (_) {}
				} catch (_) {}
			});
			// save unlisten function to cleanup later
			unlistenClipboard = async () => {
				await un();
				await stopListening();
			};
		} catch (e) {
			console.warn('clipboard-x startListening failed:', e);
		}

		// Cleanup when component is destroyed
		onCleanup(() => {
			(async () => {
				if (unlistenDragDrop) unlistenDragDrop();
				if (unlistenClipboard) await unlistenClipboard();
			})();
		});
	});
    
	return {
		setTextareaRef,
		handlePastedContent,
	};
}
