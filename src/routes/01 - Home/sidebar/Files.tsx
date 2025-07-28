import { For } from 'solid-js';
import TreeNode from '@/components/01 - Home/Notes/TreeNode';

interface FileNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: FileNode[];
}

interface Props {
    class?: string;
}

// Sample data structure
const fileData: FileNode[] = [
    {
        id: '1',
        name: 'AI',
        type: 'folder',
        children: [
            {
                id: '2',
                name: 'Machine Learning',
                type: 'folder',
                children: [
                    {
                        id: '3',
                        name: 'Stanford',
                        type: 'folder',
                        children: Array.from({ length: 7 }, (_, i) => ({
                            id: `lecture-${i + 1}`,
                            name: `Lecture ${i + 1}`,
                            type: 'file' as const,
                        }))
                    }
                ]
            }
        ]
    }
];

export default function Files(props: Props) {
    return (
        <div
            class={`relative h-full w-80 resize-x flex flex-col bg-cyan-dark-2 border-r border-border text-white overflow-x-auto ${props?.class || ""}`}
        >
            <div class="py-4 h-16 w-full bg-background-light-1 flex items-center px-4 border-b-1 border-border-light-1 justify-center z-50 ">
                <div class="text-lg font-semibold text-text-light-1 justify-center">
                    Notes
                </div>
            </div>

            <ul id="files-list" class="pl-4 tree flex-1 overflow-hidden"> 
                <For each={fileData}>
                    {(node) => <TreeNode node={node} level={0} />}
                </For>
            </ul>

        </div>
    );
}