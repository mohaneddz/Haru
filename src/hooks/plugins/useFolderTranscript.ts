import { createSignal, onCleanup, onMount } from 'solid-js';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { invoke } from '@tauri-apps/api/core';
import { Music, Video, FileText, File } from 'lucide-solid';

export default function useFolderTranscript() {
	
    const [folderPath, setFolderPath] = createSignal<string | null>('');
	const [files, setFiles] = createSignal<String[]>([]);
	const [dragging, setDragging] = createSignal(false);
	const [error, setError] = createSignal<string | null>(null);
	const [selected, setSelected] = createSignal<Set<string>>(new Set());
    const [transcribed, setTranscribed] = createSignal<Set<string>>(new Set());
    const [refined, setRefined] = createSignal<Set<string>>(new Set());
    const [loadingTranscript, setLoadingTranscript] = createSignal(false);
    const [loadingRefinement, setLoadingRefinement] = createSignal(false);
    
    const TRANSCRIPTS_DIR = 'D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Transcripts';

    // Path helpers
    function normalizeSlashes(p: string) { return p.replace(/\\/g, '/'); }
    function joinPaths(...parts: (string | undefined | null)[]) {
        return normalizeSlashes(parts.filter(Boolean).join('/')).replace(/\/{2,}/g, '/');
    }
    function dirname(p: string) {
        const n = normalizeSlashes(p);
        const i = n.lastIndexOf('/');
        return i >= 0 ? n.slice(0, i) : '';
    }
    function filename(p: string) {
        const n = normalizeSlashes(p);
        const i = n.lastIndexOf('/');
        return i >= 0 ? n.slice(i + 1) : n;
    }
    function getRelativePathFromRoot(absPath: string): string {
        const root = normalizeSlashes(folderPath() || '');
        const abs = normalizeSlashes(absPath);
        if (!root) return filename(abs);
        const rootTrim = root.replace(/\/+$/, '');
        const absLower = abs.toLowerCase();
        const rootLower = rootTrim.toLowerCase();
        if (absLower.startsWith(rootLower + '/')) return abs.slice(rootTrim.length + 1);
        if (absLower === rootLower) return filename(abs);
        return filename(abs);
    }
    async function ensureDirExists(dirPath: string) {
        const dir = normalizeSlashes(dirPath);
        const exists = await invoke('verify_folder', { path: dir }).catch(() => false as any);
        if (exists) return;
        const candidates = ['create_dir_all', 'create_dir', 'create_folder', 'mkdir_all', 'mkdir'];
        let ok = false;
        for (const cmd of candidates) {
            try {
                await invoke(cmd as any, { path: dir });
                ok = true;
                break;
            } catch { /* try next */ }
        }
        if (!ok) throw new Error(`Failed to create directory: ${dir}`);
    }

	let revokeUrl: string | null = null;

	onMount(async () => {
		folderPath() && scanFilesFromFolder();
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
					setDragging(false);

					const validFolders = paths?.filter((p) => isValidFolder(p)) ?? [];
					if (validFolders.length === 0) {
						setError('No valid folders dropped. Please drop a folder.');
						return;
					}

					const firstFolder = validFolders[0];
					console.log('Dropped folder:', firstFolder);
					setFolderPath(firstFolder);
					await scanFilesFromFolder();
					return;
				}
			} catch (e) {
				console.error('Drag-drop handler error:', e);
				setError('Failed to handle dropped folder.');
			} finally {
				if (dragging()) setDragging(false);
			}
		});

		onCleanup(() => {
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

	async function scanFilesFromFolder() {
		try {
			const foundFiles = await invoke('read_dir_recursive', { path: folderPath(), depth: 2 });
			console.log('Found files:', foundFiles);
			if (Array.isArray(foundFiles)) {
                const cleanedFiles = (foundFiles as string[])
                    .filter((file) => typeof file === 'string' && file.trim() !== '')
                    .filter((file) => {
                        const ext = getFileExtension(file);
                        return ['.mp3', '.wav', '.flac', '.m4a', '.mp4', '.mkv', '.avi'].includes(ext);
                    })
                    .filter(Boolean)
                    .sort((a: string, b: string) => a.localeCompare(b)); // keep absolute paths
				setFiles(cleanedFiles);
				// keep selection and transcribed/refined in-sync with current files
				syncSelectionWithFiles(cleanedFiles);
                syncTranscribedWithFiles(cleanedFiles);
                // check if transcripts/refined already exist and mark as such
                await refreshStatuses(cleanedFiles);
			} else {
				setError('Failed to scan folder contents.');
			}
		} catch (e) {
			console.error('Error scanning folder:', e);
			setError('Failed to scan folder contents.');
		}
	}

	function syncSelectionWithFiles(list: string[]) {
		setSelected((prev) => {
			const next = new Set<string>();
			for (const f of list) if (prev.has(f)) next.add(f);
			return next;
		});
	}
    function syncTranscribedWithFiles(list: string[]) {
        setTranscribed((prev) => {
            const next = new Set<string>();
            for (const f of list) if (prev.has(f)) next.add(f);
            return next;
        });
    }

	// Selection helpers
	function isSelected(file: string) { return selected().has(file); }
	function toggleSelected(file: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(file) ? next.delete(file) : next.add(file);
			return next;
		});
	}
	function selectAll() { setSelected(new Set<string>(files() as string[])); }
	function deselectAll() { setSelected(new Set<string>()); }
	function areAllSelected() { return files().length > 0 && selected().size === files().length; }
	function selectedCount() { return selected().size; }

	function getFileExtension(filename: string): string {
		const match = filename.match(/\.[^/.]+$/);
		return match ? match[0].toLowerCase() : '';
	}

	function getIcon(filename: string) {
		const ext = getFileExtension(filename);
		const iconMap: Record<string, any> = {
			'.mp3': Music, '.wav': Music, '.flac': Music, '.m4a': Music,
			'.mp4': Video, '.mkv': Video, '.avi': Video,
			'.txt': FileText, '.docx': FileText, '.pdf': FileText,
		};
		return iconMap[ext] || File;
	}

    function baseNameNoExt(p: string): string {
        const name = filename(p) || 'Transcript';
        return name.replace(/\.[^/.]+$/, '');
    }

    function escapeRegExp(s: string) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Refresh transcribed/refined statuses per file, within its relative subdirectory
    async function refreshStatuses(currentFiles?: string[]) {
        const list = currentFiles ?? (files() as string[]);
        const tSet = new Set<string>();
        const rSet = new Set<string>();
        const dirEntriesCache = new Map<string, string[]>();

        async function listDirOnce(dir: string): Promise<string[]> {
            const d = normalizeSlashes(dir);
            if (dirEntriesCache.has(d)) return dirEntriesCache.get(d)!;
            try {
                const entries = await invoke('read_dir_recursive', { path: d, depth: 1 });
                const names = Array.isArray(entries)
                    ? (entries as string[]).map(p => (normalizeSlashes(p).split('/').pop() || ''))
                    : [];
                dirEntriesCache.set(d, names);
                return names;
            } catch {
                dirEntriesCache.set(d, []);
                return [];
            }
        }

        for (const abs of list) {
            const rel = getRelativePathFromRoot(abs);
            const relDir = dirname(rel);
            const base = baseNameNoExt(rel);
            const targetDir = joinPaths(TRANSCRIPTS_DIR, relDir);

            const names = await listDirOnce(targetDir);
            const hasTranscript = names.some(n => new RegExp(`^${escapeRegExp(base)}( \\(\\d+\\))?\\.md$`, 'i').test(n));
            const hasRefined = names.some(n => new RegExp(`^${escapeRegExp(base)} - refined( \\(\\d+\\))?\\.md$`, 'i').test(n));

            if (hasTranscript) tSet.add(abs);
            if (hasRefined) rSet.add(abs);
        }
        setTranscribed(tSet);
        setRefined(rSet);
    }

    // Generate a unique filename by appending a number if a conflict exists
    async function getUniqueFilename(dir: string, base: string, ext: string): Promise<string> {
        let counter = 0;
        let filename = `${base}${ext}`;
        while (await invoke('verify_file', { path: joinPaths(dir, filename) })) {
            counter++;
            filename = `${base} (${counter})${ext}`;
        }
        return filename;
    }

    // Save transcript with conflict-safe naming, keeping folder structure under TRANSCRIPTS_DIR
    async function saveTranscriptForFile(absPath: string, content: string) {
        const rel = getRelativePathFromRoot(absPath);
        const relDir = dirname(rel);
        const base = baseNameNoExt(rel);
        const targetDir = joinPaths(TRANSCRIPTS_DIR, relDir);

        await ensureDirExists(targetDir);
        const filename = await getUniqueFilename(targetDir, base, '.md');

        const tmpPath: string = await invoke('create_file', { dir: targetDir });
        await invoke('rename_path', { oldPath: tmpPath, newPath: joinPaths(targetDir, filename) });
        await invoke('save_file', { path: joinPaths(targetDir, filename), content });
        return joinPaths(targetDir, filename);
    }

    // Find the transcript path for a given file (within its relative subdirectory)
    async function findTranscriptPathForFile(absPath: string): Promise<string | null> {
        const rel = getRelativePathFromRoot(absPath);
        const relDir = dirname(rel);
        const base = baseNameNoExt(rel);
        const targetDir = joinPaths(TRANSCRIPTS_DIR, relDir);

        try {
            const entries = await invoke('read_dir_recursive', { path: targetDir, depth: 1 });
            if (!Array.isArray(entries)) return null;

            const items = (entries as string[]).map(full => {
                const name = normalizeSlashes(full).split('/').pop() || '';
                return { full: joinPaths(targetDir, name), name };
            }).filter(({ name }) =>
                new RegExp(`^${escapeRegExp(base)}( \\((\\d+)\\))?\\.md$`, 'i').test(name)
            );

            if (items.length === 0) return null;

            let best = items[0];
            let bestN = 0;
            for (const it of items) {
                const m = it.name.match(/\((\d+)\)\.md$/i);
                const n = m ? parseInt(m[1], 10) : 0;
                if (n > bestN) { best = it; bestN = n; }
            }
            return best.full;
        } catch {
            return null;
        }
    }

    // Save refined transcript with " - refined" suffix, preserving folder structure
    async function saveRefinedTranscriptForFile(absPath: string, content: string) {
        const rel = getRelativePathFromRoot(absPath);
        const relDir = dirname(rel);
        const base = `${baseNameNoExt(rel)} - refined`;
        const targetDir = joinPaths(TRANSCRIPTS_DIR, relDir);

        await ensureDirExists(targetDir);
        const filename = await getUniqueFilename(targetDir, base, '.md');

        const tmpPath: string = await invoke('create_file', { dir: targetDir });
        await invoke('rename_path', { oldPath: tmpPath, newPath: joinPaths(targetDir, filename) });
        await invoke('save_file', { path: joinPaths(targetDir, filename), content });
        return joinPaths(targetDir, filename);
    }

	async function transcriptSelection() {
        const items = Array.from(selected());
        console.log('Transcribing selected files:', items);
        if (items.length === 0) return;
        setLoadingTranscript(true);
        setError('');
        try {
            for (const absPath of items) {
                try {
                    const res = await fetch('http://localhost:5004/transcribe_file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ file_path: absPath }), // pass absolute path directly
                    });
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.message || `Server error ${res.status}`);
                    }
                    const data = await res.json();
                    const text = data.transcription || '';
                    if (text) {
                        await saveTranscriptForFile(absPath, text);
                        setTranscribed(prev => { const next = new Set(prev); next.add(absPath); return next; });
                    }
                } catch (e: any) {
                    console.error('Failed to transcribe:', absPath, e);
                    setError(`Failed on ${absPath}: ${e?.message || 'Unknown error'}`);
                    // continue with next file
                }
            }
        } finally {
            setLoadingTranscript(false);
        }
    }

    async function refineSelection() {
        setLoadingRefinement(true);
        try {
            const items = Array.from(selected());
            if (items.length === 0) return;

            for (const abs of items) {
                try {
                    const transcriptPath = await findTranscriptPathForFile(abs);
                    if (!transcriptPath) {
                        console.warn('No transcript found to refine for:', abs);
                        continue;
                    }
                    const content = await invoke('read_file', { path: transcriptPath });
                    if (!(typeof content === 'string' && content.trim())) continue;

                    const res = await fetch('http://localhost:5004/refine_transcript', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transcript: content }),
                    });
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.detail || `Server error ${res.status}`);
                    }

                    const data = await res.json();
                    const chunks = data.refined_chunks;
                    if (!Array.isArray(chunks)) throw new Error('Server response did not contain a valid chunks array.');

                    const refinedText = (chunks as any[])
                        .sort((a, b) => a[0] - b[0])
                        .map((c) => c[1])
                        .join('\n\n');

                    if (refinedText?.trim()) {
                        await saveRefinedTranscriptForFile(abs, refinedText);
                        setRefined(prev => { const next = new Set(prev); next.add(abs); return next; });
                    }
                } catch (e: any) {
                    console.error('Failed to refine:', abs, e);
                    setError(`Refine failed on ${abs}: ${e?.message || 'Unknown error'}`);
                }
            }
        } finally {
            setLoadingRefinement(false);
        }
    }

	function isTranscribed(file: string) { return transcribed().has(file); }
    function isRefined(file: string) { return refined().has(file); }

	async function isValidFolder(p: string) {
		return await invoke('verify_folder', { path: p });
	}

	return {
		folderPath,
		setFolderPath,
		files,
		setFiles,
		dragging,
		setDragging,
		error,
		setError,
		getIcon,
        refineSelection,
        transcriptSelection,
		selected,
		isSelected,
		toggleSelected,
		selectAll,
		deselectAll,
		areAllSelected,
		selectedCount,
        loadingTranscript,
        loadingRefinement,
        transcribed,
        refined,
        isTranscribed,
        isRefined,
	};
}