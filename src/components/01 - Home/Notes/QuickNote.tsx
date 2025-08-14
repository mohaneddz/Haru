import CodeMirrorEditor from "@/components/01 - Home/Notes/CodeMirrorEditor";
import { Accessor } from "solid-js/types/reactive/signal.js";
import { saveApi } from "@/utils/home/files/filesManip";
import { createSignal } from "solid-js";
import Checkbox from "@/components/core/Input/Checkbox";

interface Props {
    content: Accessor<string>;
    index: Accessor<number>;
    onChange: (newContent: string) => void;
    onSelectionChange: (selected: boolean) => void;
    selected: Accessor<boolean>;
}

export default function QuickNote(props: Props) {

    const [content, setContent] = createSignal(props.content());
    const notesFolder = "D:\\Programming\\Projects\\Tauri\\haru\\notes";

    return (
        <div
            class={`relative w-full h-full p-6 flex aspect-square border-2 rounded-lg bg-background-light-1 ${props.selected() ? 'border-primary' : 'border-gray-700'} transition-all duration-200 group`}>
            <Checkbox
                class="hidden group-hover:block absolute top-2 left-2"
                selected={props.selected()}
                onChange={() => props.onSelectionChange(!props.selected())}
            />
            <CodeMirrorEditor
                content={content()}
                onChange={(v) => {
                    setContent(v);
                    saveApi(notesFolder + `\\note_${props.index()}.md`, v);
                }}
            />
        </div>
    );
};
