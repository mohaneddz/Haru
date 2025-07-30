import { createSignal } from 'solid-js';

export const useFilesContext = (filesInstance: ReturnType<typeof import('@/hooks/home/useFiles').useFiles>) => {

    const {
        fileTree,
        dir,
        createFileNode,
        createFolderNode,
        setRenamingNode,
        findNodeByPath,
        deleteNode,
        restoreFiles,
    } = filesInstance;

    const [menuVisible, setMenuVisible] = createSignal(false);
    const [menuX, setMenuX] = createSignal(0);
    const [menuY, setMenuY] = createSignal(0);
    const [menuContext, setMenuContext] = createSignal<'background' | 'file' | 'folder'>('background');
    const [menuTarget, setMenuTarget] = createSignal<FileNode | null>(null);

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		let context: 'background' | 'file' | 'folder' = 'background';
		let target: FileNode | null = null;

		const targetElement = e.target as HTMLElement;
		const treeNode = targetElement.closest('.tree-item') as HTMLElement;

		if (treeNode) {
			const dataPath = treeNode.getAttribute('data-path');

			if (dataPath) {
				target = findNodeByPath(fileTree(), dataPath);
				if (target) {
					context = target.type;
				}
			}
		}

		setMenuContext(context);
		setMenuTarget(target);
		setMenuX(e.clientX);
		setMenuY(e.clientY);
		setMenuVisible(true);
	}

	async function handleMenuAction(action: string) {
		const node = menuTarget();
		console.log(`Action: ${action}, Node:`, node);
		if (action === 'rename') {
			if (node) {
				setRenamingNode(node.path);
			}
		} else if (action === 'delete') {
			if (node) {
				await deleteNode(node);
			}
		} else if (action === 'createFile') {
			if (node && node.type === 'folder') {
				await createFileNode(node.path);
			} else {
				await createFileNode(); 
			}
		} else if (action === 'createFolder') {
			if (node && node.type === 'folder') {
				await createFolderNode(node.path); 
			} else {
				await createFolderNode(); 
			}
		} else if (action === 'refresh') {
			await restoreFiles(dir());
		}
		// Removed setMenuVisible(false) - menu closes in component after action completes
	}

	const contextMenuItems = {
		background: [
			{ label: 'New File', action: 'createFile' },
			{ label: 'New Folder', action: 'createFolder' },
			{ label: 'Refresh', action: 'refresh' },
		],
		file: [
			{ label: 'Rename', action: 'rename' },
			{ label: 'Delete', action: 'delete' },
		],
		folder: [
			{ label: 'Rename', action: 'rename' },
			{ label: 'Delete', action: 'delete' },
			{ label: 'New File', action: 'createFile' }, 
			{ label: 'New Folder', action: 'createFolder' },
		],
	};

	return {
		handleContextMenu,
		handleMenuAction,
		contextMenuItems,
		menuVisible,
		menuX,
		menuY,
		menuContext,
		setMenuVisible,
	};
};