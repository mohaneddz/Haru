import { Accessor } from "solid-js";

export default function NoteTopBar({ currFile }: { currFile: Accessor<string> }) {
    return (
        <div class="py-4 h-16 min-h-16 max-h-16 w-full bg-background-light-1 flex items-center px-4 border-b-1 border-border-light-1 justify-center z-50 ">
            <div class="text-lg font-semibold text-text-light-1 justify-center select-none">
                {currFile() === '' ? 'Notes' : currFile().split('\\').pop()}
            </div>
        </div>
    );
};
