interface TreeNodeProps {
    node: FileNode;
    path: string;
    level: number;
    setCurrFile: (file: string) => void;
    onRename?: (node: FileNode, name: string) => void;
    onDelete?: (node: FileNode) => void;
    onContextMenu?: (e: MouseEvent, node: FileNode) => void;
    onDragStart?: (node: FileNode) => void;
    onDragOver?: (e: DragEvent) => void;
    onDragEnd?: () => void;
    onDrop?: (node: FileNode | null, e?: DragEvent) => void;
    lastTouched?: () => string | null;
    setLastTouched?: (path: string) => void;
    handleClickNode?: (node: FileNode) => void;
    renamingNode?: string | null;
    setRenamingNode?: (node: string | null) => void;
}
    
