import { For } from 'solid-js';
import { FolderOpen, Folder, File } from 'lucide-solid';
import { useTreeNode } from '@/hooks/home/useTreeNode';

export default function TreeNode(props: TreeNodeProps) {

    const {
        isOpen,
        isDragOver,
        editValue,
        setEditValue,
        isRenaming,
        handleClick,
        handleDoubleClick,
        // handleDragStart,
        // handleDragOver,
        // handleDragLeave,
        // handleDrop,
        // handleDragEnd,
        hasChildren,
        inputRef,
    } = useTreeNode(props);

    return (
        <li class="ml-2">
            <div
                class={`tree-item cursor-pointer hover:bg-white/5 transition-colors duration-150 ${props.node.type === 'file' ? 'tree-node-file' : 'tree-node-folder'}
                 ${isDragOver() ? 'bg-blue-500/20 border border-accent' : ''} ${(props.lastTouched?.() === props.node.path) ? 'brightness-110 text-accent' : ''}`}
                data-path={props.node.path}
                // draggable
                // onDragStart={handleDragStart}
                // onDragOver={handleDragOver}
                // onDragLeave={handleDragLeave}
                // onDrop={handleDrop}
                // onDragEnd={handleDragEnd}
                onClick={handleClick}
                onDblClick={handleDoubleClick}
                onContextMenu={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onContextMenu?.(e, props.node);
                }}
            >
                {props.node.type === 'folder' ? (
                    <>
                        {isOpen() ? (
                            <FolderOpen size={18} class="icon text-accent" />
                        ) : (
                            <Folder size={18} class="icon text-accent" />
                        )}
                    </>
                ) : (
                    <File size={18} class="icon text-gray-300" />
                )}
                {isRenaming() ? (
                    <input
                        ref={inputRef}
                        value={editValue().replace(/\.md$/, '')}
                        class="bg-background text-text px-1 rounded outline-accent w-full focus:outline-none focus:ring-none text-text"
                        onChange={e => setEditValue(e.currentTarget.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                const currentName = props.node.name;
                                const extensionIndex = currentName.lastIndexOf('.');
                                const hasExtension = extensionIndex > 0 && currentName.includes('.');
                                const extension = hasExtension ? currentName.slice(extensionIndex) : '';
                                hasExtension ? currentName.slice(0, extensionIndex) : currentName;

                                const newName = e.currentTarget.value.trim();
                                const finalName = hasExtension ? `${newName}${extension}` : newName;

                                if (newName && finalName !== currentName) {
                                    console.log('Renaming node:', currentName, 'to', finalName);
                                    props.onRename?.(props.node, finalName);
                                } else {
                                    console.warn('Rename cancelled: new name is empty or same as current name');
                                }
                                props.setRenamingNode?.(null);
                                e.currentTarget.blur();
                                e.stopPropagation();
                            } else if (e.key === 'Escape') {
                                props.setRenamingNode?.(null);
                                e.currentTarget.blur();
                                e.stopPropagation();
                            }
                        }}
                        onBlur={() => {
                            props.setRenamingNode?.(null);
                        }}
                    />
                ) : (
                    <span class="select-none w-full">{props.node.name}</span>
                )}
            </div>
            {props.node.type === 'folder' && hasChildren && isOpen() && (
                <ul>
                    <For each={props.node.children}>
                        {(child) => <TreeNode
                            node={child}
                            level={props.level + 1}
                            path={child.path}
                            setCurrFile={props.setCurrFile}
                            onRename={props.onRename}
                            onDelete={props.onDelete}
                            onContextMenu={props.onContextMenu}
                            onDragStart={props.onDragStart}
                            onDragOver={props.onDragOver}
                            onDragEnd={props.onDragEnd}
                            onDrop={props.onDrop}
                            lastTouched={props.lastTouched}
                            setLastTouched={props.setLastTouched}
                            handleClickNode={props.handleClickNode}
                            renamingNode={props.renamingNode}
                            setRenamingNode={props.setRenamingNode}
                        />}
                    </For>
                </ul>
            )}
        </li>
    );
}