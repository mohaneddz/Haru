import { createSignal, For } from 'solid-js';
import { FolderOpen, Folder, File } from 'lucide-solid';

interface Props {
    node: FileNode;
    path: string;
    level: number;
    setCurrFile: (file: string) => void;
}

export default function TreeNode(props: Props) {
    const [isOpen, setIsOpen] = createSignal(true);

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
                    <File size={18} class="icon text-gray-300" onClick={() => { console.log(`Selected file: ${props.path}`); props.setCurrFile(props.path); }} />
                )}
                <span class="select-none">{props.node.name}</span>
            </div>

            {props.node.type === 'folder' && hasChildren && isOpen() && (
                <ul>
                    <For each={props.node.children}>
                        {(child) => <TreeNode node={child} level={props.level + 1} path={child.path} setCurrFile={props.setCurrFile} />}
                    </For>
                </ul>
            )}
        </li>
    );
}