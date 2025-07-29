// import { onMount } from 'solid-js';
import { createSignal } from 'solid-js';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

export function useFiles() {
	const [fileTree, setFileTree] = createSignal<FileNode[]>([]);
	const [dir, setDir] = createSignal('');

	// Uses the Rust Tauri command to recursively read all file paths
	async function getAllPaths(folderPath: string): Promise<string[]> {
		const paths: string[] = await invoke('read_dir_recursive', { path: folderPath });
		return paths;
	}

	// Build a hierarchical tree from flat paths, relative to the selected folder
	function buildFileTree(paths: string[], basePath: string): FileNode[] {
		const root: Record<string, any> = {};

		for (const fullPath of paths) {
			// Compute relative path from the selected base folder
			const relPath = fullPath.startsWith(basePath)
				? fullPath.slice(basePath.length + 1) // remove "basePath/"
				: fullPath;
			const parts = relPath.split(/[\\/]/).filter(Boolean);

			let currentLevel = root;
			let currentPath = '';

			parts.forEach((part, index) => {
				currentPath = currentPath ? `${currentPath}/${part}` : part;
				const isFile = index === parts.length - 1;
				if (!currentLevel[part]) {
					currentLevel[part] = isFile
						? { id: fullPath, name: part, type: 'file' as const, path: fullPath }
						: {
								id: `${basePath}/${currentPath}`,
								name: part,
								path: `${basePath}/${currentPath}`,
								type: 'folder' as const,
								children: {},
						  };
				}
				if (!isFile) {
					currentLevel = currentLevel[part].children;
				}
			});
		}

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

	// Let the user pick a folder
	const getFolder = async (): Promise<string | null> => {
		const folder = await open({ multiple: false, directory: true, title: 'Select Folder' });
		return typeof folder === 'string' ? folder : null;
	};

	// Load files and build tree, truncating paths before the selected folder
	const loadFiles = async () => {
		const folder = await getFolder();
		if (folder) {
			setDir(folder);
			const paths = await getAllPaths(folder);
			const tree = buildFileTree(paths, folder);
			console.log('File tree:', tree);
			setFileTree(tree);
		}
	};

	return { fileTree, loadFiles, dir };
}
