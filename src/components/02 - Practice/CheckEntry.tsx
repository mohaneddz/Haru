import { createSignal } from 'solid-js';

interface Props {
    title: string;
    done: boolean;
    color?: string;
}


export default function CheckEntry(props: Props) {

    const [checked, setChecked] = createSignal(props.done);

    return (
        <div class="grid grid-cols-3 w-full justify-start mb-4">

            <label class="text-xs mb-1 text-start text-nowrap text-gray-400 col-span-2">{props.title}</label>

            <div class={`aspect-square w-4 h-4 ${checked() ? `bg-accent-light-3 `: `bg-accent-dark-3 `}`} onClick={() => setChecked(!checked())} ></div>

        </div>
    );
};
