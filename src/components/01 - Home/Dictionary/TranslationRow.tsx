import { createSignal } from "solid-js";
import Checkbox from "@/components/core/Input/Checkbox";

export default function TranslationRow(props: Translation & { onEdit?: (field: 'term' | 'translation', value: string) => void }) {
    const [term, setTerm] = createSignal(props.term);
    const [translation, setTranslation] = createSignal(props.translation);

    return (
        <tr class={`hover:bg-background-light-3 ${props.selected ? 'bg-background-light-2' : ''}`}>
            <td class="px-4 py-2 align-top select-all">
                <Checkbox
                    selected={props.selected}
                    onChange={(e) => props.onSelect(e)}
                />
            </td>
            <td class="px-4 py-2 align-top select-all  text-sm">
                {new Date(props.dateAdded).toLocaleDateString()}
            </td>
            <td class="px-4 py-2 align-top select-all text-sm">
                <textarea
                    class="bg-transparent px-1 w-full resize-none"
                    value={term()}
                    rows={1}
                    style="white-space:pre-wrap;word-break:break-word;overflow:hidden;"
                    onInput={e => {
                        setTerm(e.currentTarget.value);
                        props.onEdit?.('term', e.currentTarget.value);
                        e.currentTarget.style.height = "auto";
                        e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                    }}
                />
            </td>
            <td class="px-4 py-2 align-top select-all text-sm">
                <textarea
                    class="bg-transparent px-1 w-full resize-none"
                    value={translation()}
                    rows={1}
                    style="white-space:pre-wrap;word-break:break-word;overflow:hidden;"
                    onInput={e => {
                        setTranslation(e.currentTarget.value);
                        props.onEdit?.('translation', e.currentTarget.value);
                        e.currentTarget.style.height = "auto";
                        e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                    }}
                />
            </td>
        </tr>
    );
}