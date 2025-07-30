import { onMount } from 'solid-js';
import { createSignal } from 'solid-js';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { createFileApi, createFolderApi, renameApi, deleteApi, saveApi } from '@/utils/filesManip';

export function useFiles() {
	const [size, setSize] = createSignal(240);
	const [fileTree, setFileTree] = createSignal<FileNode[]>([]);
	const [dir, setDir] = createSignal('');

	const [renamingNode, setRenamingNode] = createSignal<string | null>(null);
	const [newName, setNewName] = createSignal('');
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

	onMount(() => {
		restoreFiles('D:\\Obsidian Vault - Copy\\02 - AREAS\\01 - School');
	});

	// FILES API FUNCTIONS ------------------------------------------

	const createFileNode = async (targetDir?: string) => {
		const currentPath = targetDir || dir();
		await createFileApi(currentPath);
		await restoreFiles(dir());
	};

	const createFolderNode = async (targetDir?: string) => {
		const currentPath = targetDir || dir();
		await createFolderApi(currentPath);
		await restoreFiles(dir());
	};

	const renameNode = async (node: FileNode, newName: string) => {
		await renameApi(node.path, newName);
		restoreFiles(dir());
	};

	const deleteNode = async (node: FileNode) => {
		await deleteApi(node.path);
		await restoreFiles(dir());
	};

	// LOAD FILES ------------------------------------------

	async function getAllPaths(folderPath: string): Promise<string[]> {
		const paths: string[] = await invoke('read_dir_recursive', { path: folderPath });
		return paths;
	}

	function buildFileTree(paths: string[], basePath: string): FileNode[] {
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

	const getFolder = async (): Promise<string | null> => {
		const folder = await open({ multiple: false, directory: true, title: 'Select Folder' });
		return typeof folder === 'string' ? folder : null;
	};

	const restoreFiles = async (folder: string) => {
		setDir(folder);
		const paths = await getAllPaths(folder);
		const tree = buildFileTree(paths, folder);
		// console.log('File tree:', tree);
		setFileTree(tree);
	};

	const loadFiles = async () => {
		const folder = await getFolder();
		if (folder) {
			restoreFiles(folder);
		}
	};

	// USER INTERACTIONS ------------------------------------------

	function startRename(node: FileNode) {
		setRenamingNode(node.path);
		setNewName(node.name);
	}

	async function submitRename(node: FileNode, name?: string) {
		const newNodeName = name ?? newName();
		await renameNode(node, newNodeName);
		setRenamingNode(null);
		setNewName('');
	}

	function cancelRename() {
		setRenamingNode(null);
		setNewName('');
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

	const deleteLastTouched = async () => {
		const path = lastTouched();
		if (path) {
			await deleteApi(path);
		}
	};

	return {
		fileTree,
		loadFiles,
		dir,
		resize,
		size,
		createFileNode,
		createFolderNode,
		restoreFiles,
		renameNode,
		deleteNode,
		renamingNode,
		setRenamingNode,
		newName,
		setNewName,
		startRename,
		submitRename,
		cancelRename,
		saveApi,
		findNodeByPath,
		setDir,
		lastTouched,
		setLastTouched,
		deleteLastTouched,
		openNodes,
		setOpenNodes,
	};
}
