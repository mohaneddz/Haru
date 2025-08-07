import { For } from 'solid-js';
import TreeNode from '@/components/01 - Home/Notes/TreeNode';

import { useFiles } from '@/hooks/home/useFiles';
import { useFilesContext } from '@/hooks/home/useFilesContext';

import { RefreshCcwIcon, FilePlus, FolderPlus, Trash } from 'lucide-solid';
import ContextMenu from "@/components/01 - Home/Notes/FilesContextMenu";

interface Props {
    class?: string;
    currFile?: (file: string) => void;
    setCurrFile: (file: string) => void;
}

export default function Files(props: Props) {

    const filesInstance = useFiles();
    const {
        fileTree,
        loadFiles,
        resize,
        size,
        createFileNode,
        createFolderNode,
        restoreFiles,
        dir,
        deleteNode,
        renameNode,
        renamingNode,
        setRenamingNode,
        lastTouched,
        setLastTouched,
        deleteLastTouched,
    } = filesInstance;
    const { handleContextMenu, contextMenuItems, menuVisible, menuX, menuY, menuContext, setMenuVisible, handleMenuAction } = useFilesContext(filesInstance);

    return (
        <div
            class={`z-50 relative transition-[width] duration-75 ease-out h-full flex flex-col bg-cyan-dark-2 border-r border-border text-text overflow-x-clip ${props?.class || ""}`}
            style={{ width: `${size()}px` }}
            id="sidebar"
            onContextMenu={e => handleContextMenu(e)}
        >
            <div class="w-1 h-full cursor-ew-resize absolute right-0" onMouseDown={resize.start} />

            <div class="py-4 h-16 max-h-16 w-full bg-background-light-1 flex items-center px-4 border-b-1 border-border-light-1 justify-center z-50 ">

                <div class="text-lg font-semibold text-text-light-1 justify-center text-nowrap select-none z-1010">
                    Files
                </div>
            </div>

            <ul
                id="files-list"
                class="pl-4 tree flex-1 overflow-hidden"
            >

                <div class="center relative top-0 gap-4 min-w-full max-w-full overflow-hidden py-4">

                    <div class=" aspect-square h-min rounded-md bg-background-light-1 flex items-center justify-center cursor-pointer" onClick={() => restoreFiles(dir())}>
                        <RefreshCcwIcon class="text-center hover:text-accent inline-block" size={16} />
                    </div>
                    <div class=" aspect-square h-min rounded-md bg-background-light-1 flex items-center justify-center cursor-pointer" onClick={() => createFileNode()}>
                        <FilePlus class="text-center hover:text-accent inline-block" size={16} />
                    </div>
                    <div class=" aspect-square h-min rounded-md bg-background-light-1 flex items-center justify-center cursor-pointer" onClick={() => createFolderNode()}>
                        <FolderPlus class="text-center hover:text-accent inline-block" size={16} />
                    </div>
                    <div class={`aspect-square h-min rounded-md bg-background-light-1 flex items-center justify-center cursor-pointer ${lastTouched() ? 'hover:text-accent' : 'hover:text-text-light-1'}`}
                        onClick={async () => {
                            await deleteLastTouched();
                            await restoreFiles(dir());
                        }}>
                        <Trash class="text-center inline-block" size={16} />
                    </div>
                </div>

                <For each={fileTree()}>
                    {(node) => (
                        <TreeNode
                            path={node.path}
                            node={node}
                            level={0}
                            setCurrFile={props.setCurrFile}
                            onRename={renameNode}
                            onDelete={() => deleteNode(node)}
                            onContextMenu={handleContextMenu}
                            lastTouched={lastTouched}
                            setLastTouched={setLastTouched}
                            renamingNode={renamingNode()}
                            setRenamingNode={setRenamingNode}
                        />
                    )}
                </For>

            </ul>


            <div onClick={loadFiles} class="absolute bottom-4 w-full text-text px-4 py-2 cursor-pointer text-center border-t-1 bg-background hover:brightness-120 border-border-light-1 select-none">
                Select Folder
            </div>

            <ContextMenu
                visible={menuVisible()}
                x={menuX()}
                y={menuY()}
                context={menuContext()}
                onClose={() => setMenuVisible(false)}
                onAction={handleMenuAction}
                items={contextMenuItems[menuContext()]}
            />
        </div>
    );
}