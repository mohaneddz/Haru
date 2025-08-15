import { Show, For } from 'solid-js';
import useTranscript from '@/hooks/plugins/useFolderTranscript';
import { Dynamic } from 'solid-js/web';
import Checkbox from '@/components/core/Input/Checkbox';
import Button from '@/components/core/Input/Button';
import Pen from 'lucide-solid/icons/pen';
import Stars from 'lucide-solid/icons/stars';

export default function FolderTranscription() {
    const {
        dragging,
        setDragging,
        error,
        files,
        folderPath,
        refineSelection,
        loadingRefinement,
        transcriptSelection,
        loadingTranscript,
        getIcon,
        isSelected,
        toggleSelected,
        selectAll,
        deselectAll,
        areAllSelected,
        selectedCount,
        isTranscribed,
        isRefined,
    } = useTranscript();

    return (
        <main
            class="center flex-col my-8 p-8 h-full w-full max-w-6xl mx-auto relative items-center z-80 mt-20"
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => {
                e.preventDefault();
                if (e.currentTarget === e.target) setDragging(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
            }}
        >
            <p class="text-center text-text-light-2/70">
                Drop your folder anywhere on this page to start transcription
            </p>

            <Show when={dragging()}>
                <div class="absolute inset-0 bg-primary/20 border-4 border-dashed border-primary rounded-lg flex items-center justify-center text-primary text-xl font-bold pointer-events-none transition-all z-1000">
                    Drop your audio here
                </div>
            </Show>

            <div class="mt-4 text-sm text-text-light-2 w-full">
                <div>Dropped Folder:
                    <p class="text-accent">
                        {folderPath() || '—'}
                    </p>
                </div>
                <Show when={error()}>
                    <p class="text-red-400 mt-2">{error()}</p>
                </Show>
            </div>

            <div class="relative h-bg-sidebar grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 rounded-md border-1 border-sidebar-light-3 my-8 h-full w-full overflow-y-auto p-8 pt-16 content-start">
                <div class="absolute top-4 left-4 flex items-center gap-4">
                    <Checkbox
                        selected={areAllSelected()}
                        onChange={() => (areAllSelected() ? deselectAll() : selectAll())}
                    />
                    <p class="text-sm md:text-base text-text-light-2">
                        {selectedCount()} selected / {files().length} files
                    </p>
                </div>

                <For each={files()}>
                    {(file) => {
                        const fileStr = file.toString();
                        const Icon = getIcon(fileStr);
                        const selected = () => isSelected(fileStr);
                        const name = fileStr.split('\\').pop();
                        const isT = () => isTranscribed(fileStr);
                        const isR = () => isRefined(fileStr);
                        return (
                            <div
                                class={`relative aspect-square  rounded-md border transition-colors cursor-pointer
                                    ${selected() ? 'border-primary bg-primary/10' : 'border-sidebar-light-3/40 hover:border-sidebar-light-3 bg-sidebar-light-2'}`}
                                onClick={() => toggleSelected(fileStr)}
                                aria-selected={selected()}
                            >
                                <div class="absolute top-2 left-2 flex items-center gap-2">
                                    <Checkbox
                                        class='h-6 w-6'
                                        selected={selected()}
                                        onChange={() => { toggleSelected(fileStr); }}
                                    />
                                </div>
                                <div class="absolute top-1 right-1 flex gap-1">
                                    <Show when={isT() && !isR()}>
                                        <span class="text-xs px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                                            Done
                                        </span>
                                    </Show>
                                    <Show when={isR()}>
                                        <span class="text-xs px-1 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/40">
                                            Refined
                                        </span>
                                    </Show>
                                </div>
                                <div class="h-full w-full flex flex-col items-center justify-end gap-4 p-4">
                                    <Dynamic component={Icon} class="aspect-square w-3/4 h-3/4 text-primary mt-4" />
                                    <p class="text-xs w-[95%] truncate text-center">{name}</p>
                                </div>
                            </div>
                        );
                    }}
                </For>
            </div>

            <div class="grid grid-cols-2 gap-8 w-full max-w-lg">
                <Button
                    variant='primary'
                    onClick={transcriptSelection}
                    disabled={loadingTranscript() || loadingRefinement() }
                    class='flex gap-4 center'
                >
                    <Pen class=" cursor-pointer ml-2" />
                    {loadingTranscript() ? 'Transcribing…' : 'Transcribe'}
                </Button>
                <Button
                    variant='secondary'
                    class="flex gap-4 center"
                    disabled={loadingRefinement() }
                    onClick={refineSelection}
                >
                    <Stars class=" cursor-pointer ml-2" />
                    {loadingRefinement() ? 'Refining…' : 'Refine'}
                </Button>
            </div>
        </main>
    );
}
