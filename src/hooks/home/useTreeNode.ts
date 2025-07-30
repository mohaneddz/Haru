import { useFiles } from '@/hooks/home/useFiles';
import { createSignal, onCleanup, createEffect } from 'solid-js';
import { moveApi } from '@/utils/filesManip';

export const useTreeNode = (props: TreeNodeProps) => {
	const { restoreFiles, dir, setLastTouched } = useFiles();

	const [isOpen, setIsOpen] = createSignal(false);
	const [isDragOver, setIsDragOver] = createSignal(false);
	const [editValue, setEditValue] = createSignal(props.node.name);
	const [draggedNode, setDraggedNode] = createSignal<FileNode | null>(null);
	const [inputRef, setInputRef] = createSignal<HTMLInputElement | undefined>(undefined);

	const isRenaming = () => props.renamingNode === props.node.path;

	const toggleOpen = () => {
		if (props.node.type === 'folder') {
			setIsOpen(!isOpen());
		}
	};

	const hasChildren = props.node.children && props.node.children.length > 0;

	// Handle click outside for renaming
	function handleClickOutside(event: MouseEvent) {
		if (inputRef() && !inputRef()!.contains(event.target as Node)) {
			props.setRenamingNode?.(null);
			setEditValue(props.node.name);
		}
	}

	// Setup effect for click outside when renaming
	createEffect(() => {
		if (isRenaming()) {
			setEditValue(props.node.name);
			setTimeout(() => {
				inputRef()?.focus();
				inputRef()?.select();
			}, 0);
			window.addEventListener('mousedown', handleClickOutside);
		} else {
			window.removeEventListener('mousedown', handleClickOutside);
		}
	});

	onCleanup(() => {
		window.removeEventListener('mousedown', handleClickOutside);
	});

	function handleDoubleClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		props.setRenamingNode?.(props.node.path);
		setEditValue(props.node.name);
		setTimeout(() => {
			inputRef()?.focus();
			inputRef()?.select();
		}, 0);
	}

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		props.handleClickNode?.(props.node);
		toggleOpen();
		props.setLastTouched?.(props.node.path);
		if (props.node.type === 'file') {
			props.setCurrFile(props.path);
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		console.log('Drag leave on node:', props.node.path);
	}

	function handleDragStart(e: DragEvent) {
		setDraggedNode(props.node);
		document.body.style.cursor = 'grabbing';
		e.dataTransfer?.setData('text/plain', props.node.path);
		console.log('Drag started for node:', props.node.path);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault(); // Allow drop
		setIsDragOver(true);
		e.dataTransfer!.dropEffect = 'move';
		console.log('Drag over node:', props.node.path);
	}

	function handleDragEnd() {
		document.body.style.cursor = '';
		setIsDragOver(false);
		console.log('Drag ended for node:', props.node.path);
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		console.log('Drop on node:', props.node.path);

		const sourceNode = draggedNode();
		const targetNode = props.node;

		if (!sourceNode) {
			console.error('No source node found');
			return;
		}

		// Prevent dropping on itself
		if (targetNode && sourceNode.path === targetNode.path) {
			console.warn('Cannot drop on itself');
			setDraggedNode(null);
			return;
		}

		// Prevent dropping a folder into its own child
		if (targetNode && sourceNode.type === 'folder') {
			if (targetNode.path.startsWith(sourceNode.path)) {
				console.warn('Cannot drop folder into its own child');
				setDraggedNode(null);
				return;
			}
		}

		let destinationPath = '';
		const fileName = sourceNode.name;

		if (targetNode && targetNode.type === 'folder') {
			// Clean up the target path and ensure proper separator
			const targetPath = targetNode.path.replace(/[\/\\]+$/, ''); // Remove trailing slashes
			destinationPath = `${targetPath}${targetPath.includes('\\') ? '\\' : '/'}${fileName}`;
		} else {
			// Drop to root directory
			const rootPath = dir().replace(/[\/\\]+$/, ''); // Remove trailing slashes
			destinationPath = `${rootPath}${rootPath.includes('\\') ? '\\' : '/'}${fileName}`;
		}

		console.log(`Attempting to move from ${sourceNode.path} to ${destinationPath}`);

		try {
			await moveApi(sourceNode.path, destinationPath);
			await restoreFiles(dir());
			console.log('Move successful');
		} catch (error) {
			console.error('Error moving file or folder:', error);
		} finally {
			setDraggedNode(null);
			document.body.style.cursor = '';
			setIsDragOver(false);
		}
	}

	function handleClickNode(node: FileNode) {
		setLastTouched(node.path);
	}

	return {
		isOpen,
		isDragOver,
		editValue,
		setEditValue,
		isRenaming,
		inputRef,
		setInputRef,
		toggleOpen,

		hasChildren,
		handleClick,

		handleDoubleClick,
		handleClickNode,

		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDragEnd,

		handleDrop,

		setIsOpen,
		setIsDragOver,
	};
};
