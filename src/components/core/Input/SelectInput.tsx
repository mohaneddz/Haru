import { For } from "solid-js";

interface Props {
    options?: Array<{ value: string; label: string }>;
    class?: string;
    selected?: string;
    onChange?: (value: string) => void;
    id?: string;
}

export default function SelectInput(props: Props) {
    return (
        <select id={props.id} class={`justify-self-end p-2 rounded bg-background-light-3 ${props.class}`} onChange={(e) => props.onChange?.(e.currentTarget.value)}>
            <For each={props.options}>
                {(option) => (
                    <option value={option.value} selected={option.value === props.selected}>
                        {option.label}
                    </option>
                )}
            </For>
        </select>
    );
};
