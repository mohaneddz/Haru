import { invoke } from '@tauri-apps/api/core';
import { readFiles } from 'tauri-plugin-clipboard-x-api';

export type ClipboardImageObj = { data: Uint8Array | number[] | ArrayBuffer; mime: string };

export function isClipboardImageObject(val: unknown): val is ClipboardImageObj {
	return !!val && typeof val === 'object' && 'data' in (val as any) && 'mime' in (val as any);
}

export async function getClipboardFilePaths(): Promise<string[]> {
	// 1) Try the Rust backend (CF_HDROP) first
	try {
		const res = (await invoke('get_clipboard_files_command')) as unknown;
		if (Array.isArray(res)) {
			const arr = (res as any[]).filter((p) => typeof p === 'string') as string[];
			if (arr.length > 0) {
				console.debug('[clipboard] got files from CF_HDROP invoke:', arr);
				return arr;
			}
		}
	} catch (err) {
		console.debug('[clipboard] invoke get_clipboard_files_command failed:', err);
	}

	// 2) Fallback to clipboard-x readFiles()
	try {
		const filesAny = (await readFiles()) as any;
		console.debug('[clipboard] readFiles raw:', filesAny);
		if (Array.isArray(filesAny)) {
			return (filesAny as any[]).filter((p): p is string => typeof p === 'string');
		}
		if (Array.isArray(filesAny?.files)) {
			return (filesAny.files as any[]).filter((p): p is string => typeof p === 'string');
		}
		if (typeof filesAny?.path === 'string') {
			return [filesAny.path];
		}
	} catch (e) {
		// swallow — we'll continue to other fallbacks
		console.debug('[clipboard] readFiles fallback failed:', e);
	}

	return [];
}
