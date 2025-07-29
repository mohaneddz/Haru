import { For } from 'solid-js';
import TreeNode from '@/components/01 - Home/Notes/TreeNode';
import { useFiles } from '@/hooks/home/useFiles';

interface Props {
    class?: string;
    currFile?: (file: string) => void; 
    setCurrFile: (file: string) => void;
}

export default function Files(props: Props) {

    const { fileTree , loadFiles  } = useFiles();

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
                <For each={fileTree()}>
                    {(node) => <TreeNode path={node.path} node={node} level={0} setCurrFile={props.setCurrFile} />}
                </For>
            </ul>

            <div onClick={loadFiles} class="absolute bottom-4 w-full text-white px-4 py-2 cursor-pointer text-center border-t-1 bg-background hover:brightness-120 border-border-light-1">
                Select Folder
            </div>

        </div>
    );
}