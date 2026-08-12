import { onMount } from 'solid-js';
import { createSignal } from 'solid-js';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { createFileApi, createFolderApi, renameApi, deleteApi, saveApi } from '@/utils/home/files/filesManip';

import { getStoreValue, setStoreValue } from '@/config/store';

export function useFiles() {
	const [size, setSize] = createSignal(240);
	const [fileTree, setFileTree] = createSignal<FileNode[]>([]);
	const [dir, setDir] = createSignal('');

	const [renamingNode, setRenamingNode] = createSignal<string | null>(null);
	const [lastTouched, setLastTouched] = createSignal<string | null>(null);
	const [openNodes, setOpenNodes] = createSignal<Record<string, boolean>>({});

	let isResizing = false;
	let startX = 0;
	let startWidth = 240;

	const resize = {
		start(e: MouseEvent) {
			isResizing = true;
			startX = e.clientX;
			startWidth = size();
			document.body.style.cursor = 'ew-resize';
			document.addEventListener('mousemove', resize.do);
			document.addEventListener('mouseup', resize.stop);
		},
		do(e: MouseEvent) {
			if (!isResizing) return;
			const delta = e.clientX - startX;
			const newWidth = Math.max(240, startWidth + delta);
			setSize(newWidth);
		},
		stop() {
			isResizing = false;
			document.body.style.cursor = '';
			document.removeEventListener('mousemove', resize.do);
			document.removeEventListener('mouseup', resize.stop);
		},
	};

	onMount(async () => {
		const folder = await getStoreValue<string>('notesLocation') ?? '';
		refreshFileTree(folder);
	});

	// FILES API FUNCTIONS ------------------------------------------

	const createNewFile = async (targetDir?: string) => {
		const currentPath = targetDir || dir();
		await createFileApi(currentPath);
		await refreshFileTree(dir());
	};

	const createNewFolder = async (targetDir?: string) => {
		const currentPath = targetDir || dir();
		await createFolderApi(currentPath);
		await refreshFileTree(dir());
	};

	const renameFile = async (node: FileNode, newName: string) => {
		await renameApi(node.path, node.path.replace(/[^\\/]+$/, newName));
		refreshFileTree(dir());
	};

	const deleteFile = async (node: FileNode) => {
		await deleteApi(node.path);
		await refreshFileTree(dir());
	};

	const saveFileContent = async (node: FileNode, content: string) => {
		await saveApi(node.path, content);
	};

	// LOAD FILES ------------------------------------------

	async function getAllFilePaths(folderPath: string): Promise<string[]> {
		const paths: string[] = await invoke('read_dir_recursive', { path: folderPath });
		return paths;
	}

	function buildFileTreeStructure(paths: string[], basePath: string): FileNode[] {
		const root: Record<string, any> = {};

		for (const fullPath of paths) {
			const isFolder = fullPath.endsWith('/') || fullPath.endsWith('\\');
			const isMarkdown = fullPath.toLowerCase().endsWith('.md');

			// Ignore hidden files and folders (those starting with a dot)
			const relPath = fullPath.startsWith(basePath) ? fullPath.slice(basePath.length + 1) : fullPath;
			if (relPath.split(/[\\/]/).some((part) => part.startsWith('.'))) continue;

			// Only include folders and markdown files
			if (!isFolder && !isMarkdown) continue;

			const parts = relPath.split(/[\\/]/).filter(Boolean);

			let currentLevel = root;
			let currentPath = '';

			parts.forEach((part, index) => {
				currentPath = currentPath ? `${currentPath}/${part}` : part;
				const isFile = index === parts.length - 1;
				const isMdFile = isFile && part.toLowerCase().endsWith('.md');

				if (!currentLevel[part]) {
					if (isMdFile) {
						currentLevel[part] = {
							id: fullPath,
							name: part,
							type: 'file' as const,
							path: fullPath,
						};
					} else {
						currentLevel[part] = {
							id: `${basePath}/${currentPath}`,
							name: part,
							path: `${basePath}/${currentPath}`,
							type: 'folder' as const,
							children: {},
						};
					}
				}

				if (!isFile) {
					currentLevel = currentLevel[part].children;
				}
			});
		}

		// Recursive conversion to array
		function convert(obj: Record<string, any>): FileNode[] {
			return Object.values(obj).map((node) => {
				if (node.type === 'folder') {
					return { ...node, children: convert(node.children) };
				}
				return node;
			});
		}

		return convert(root);
	}

	const selectDirectory = async (): Promise<string | null> => {
		const folder = await open({ multiple: false, directory: true, title: 'Select Folder' });
		return typeof folder === 'string' ? folder : null;
	};

	const refreshFileTree = async (folder: string) => {
		setDir(folder);
		const paths = await getAllFilePaths(folder);
		const tree = buildFileTreeStructure(paths, folder);
		// console.log('File tree:', tree);
		setFileTree(tree);
	};

	const openDirectory = async () => {
		const folder = await selectDirectory();
		if (folder) {
			setStoreValue('notesLocation', folder);
			refreshFileTree(folder);
		}
	};

	// USER INTERACTIONS ------------------------------------------

	function beginRenaming(node: FileNode) {
		setRenamingNode(node.path);
	}

	function endRenaming() {
		setRenamingNode(null);
	}

	function findNodeByPath(nodes: FileNode[], path: string): FileNode | null {
		for (const node of nodes) {
			if (node.path === path) return node;
			if (node.children) {
				const found = findNodeByPath(node.children, path);
				if (found) return found;
			}
		}
		return null;
	}

	const deleteLastSelectedNode = async () => {
		const path = lastTouched();
		if (path) {
			await deleteApi(path);
		}
	};

	return {
		fileTree,
		openDirectory,
		dir,
		resize,
		size,
		createNewFile,
		createNewFolder,
		refreshFileTree,
		renameFile,
		deleteFile,
		renamingNode,
		setRenamingNode,
		beginRenaming,
		endRenaming,
		saveApi,
		findNodeByPath,
		setDir,
		lastTouched,
		setLastTouched,
		deleteLastSelectedNode,
		openNodes,
		setOpenNodes,
		saveFileContent,
	};
}
