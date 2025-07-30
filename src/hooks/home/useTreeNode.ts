import { useFiles } from '@/hooks/home/useFiles';
import { createSignal, onCleanup, onMount } from 'solid-js';
import { moveApi } from '@/utils/filesManip';

export const useTreeNode = (props: TreeNodeProps) => {

	const {restoreFiles, dir, setLastTouched} = useFiles();

	const [isOpen, setIsOpen] = createSignal(false);
	const [isDragOver, setIsDragOver] = createSignal(false);
	const [editValue, setEditValue] = createSignal(props.node.name);
	const [isRenaming, setIsRenaming] = createSignal(false);
	const [draggedNode, setDraggedNode] = createSignal<FileNode | null>(null);
	const [inputRef, setInputRef] = createSignal<HTMLInputElement | undefined>(undefined);

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
	onMount(() => {
		if (props.renamingNode === props.node.path) {
			window.addEventListener('mousedown', handleClickOutside);
			setEditValue(props.node.name);
			setTimeout(() => {
				inputRef()?.focus();
				inputRef()?.select();
			}, 0);
		}
	});
	onCleanup(() => {
		window.removeEventListener('mousedown', handleClickOutside);
	});

	function handleDoubleClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		props.setRenamingNode?.(props.node.path);
		setIsRenaming(true);
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
		// Only clear drag over if we're actually leaving this element
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const isOutside =
			e.clientX < rect.left ||
			e.clientX > rect.right ||
			e.clientY < rect.top ||
			e.clientY > rect.bottom;
		if (isOutside) {
			setIsDragOver(false);
		}
	}

	function handleDragStart(e: DragEvent) {
		setDraggedNode(props.node);
		document.body.style.cursor = 'grabbing';
		e.dataTransfer?.setData('text/plain', props.node.path);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault(); // Allow drop
		setIsDragOver(true);
		e.dataTransfer!.dropEffect = 'move';
	}

	function handleDragEnd() {
		document.body.style.cursor = '';
		setIsDragOver(false);
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();

		const sourceNode = draggedNode();
		const targetNode = props.node;

		if (!sourceNode) {
			console.log('No source node found');
			return;
		}

		// Prevent dropping on itself
		if (targetNode && sourceNode.path === targetNode.path) {
			console.log('Cannot drop on itself');
			setDraggedNode(null);
			return;
		}

		// Prevent dropping a folder into its own child
		if (targetNode && sourceNode.type === 'folder') {
			if (targetNode.path.startsWith(sourceNode.path)) {
				console.log('Cannot drop folder into its own child');
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

		console.log(`Moving from ${sourceNode.path} to ${destinationPath}`);

		try {
			await moveApi(sourceNode.path, destinationPath);
			await restoreFiles(dir());
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
		setIsRenaming,
		inputRef,
		setInputRef,
		toggleOpen,
		hasChildren,
		handleClick,
		handleDoubleClick,
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd,
		handleClickNode,
		setIsOpen,
		setIsDragOver,
	};
};
