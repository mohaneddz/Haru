import { createSignal, For } from 'solid-js';
import { FolderOpen, Folder, File, ChevronRight, ChevronDown } from 'lucide-solid';

interface FileNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: FileNode[];
}

export default function TreeNode(props: { node: FileNode; level: number }) {
    const [isOpen, setIsOpen] = createSignal(true); // Start with folders open

    const toggleOpen = () => {
        if (props.node.type === 'folder') {
            setIsOpen(!isOpen());
        }
    };

    const hasChildren = props.node.children && props.node.children.length > 0;

    return (
        <li class='ml-2'> 
            <div
                class="tree-item cursor-pointer hover:bg-white/5 transition-colors duration-150"
                onClick={toggleOpen}
                // Removed inline padding-left style
            >
                {props.node.type === 'folder' ? (
                    <>
                        {isOpen() ? (
                            <FolderOpen size={18} class="icon text-blue-400" />
                        ) : (
                            <Folder size={18} class="icon text-blue-400" />
                        )}
                    </>
                ) : (
                    <File size={18} class="icon text-gray-300" /> 
                )}
                <span class="select-none">{props.node.name}</span>
            </div>

            {props.node.type === 'folder' && hasChildren && isOpen() && (
                <ul> 
                    <For each={props.node.children}>
                        {(child) => <TreeNode node={child} level={props.level + 1} />}
                    </For>
                </ul>
            )}
        </li>
    );
}