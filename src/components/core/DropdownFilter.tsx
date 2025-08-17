import { createSignal, For, Show, onMount, onCleanup, JSX } from "solid-js";
import ChevronDown from "lucide-solid/icons/chevron-down";

interface DropdownFilterProps {
    label: string;
    items: string[];
    selectedItems: string[];
    onToggleItem: (item: string) => void;
    icon: JSX.Element;
}

export default function DropdownFilter(props: DropdownFilterProps) {
    const [isOpen, setIsOpen] = createSignal(false);
    let dropdownRef: HTMLDivElement | undefined;

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    onMount(() => document.addEventListener("mousedown", handleClickOutside));
    onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));

    const buttonLabel = () => {
        const count = props.selectedItems.length;
        return count > 0 ? `${props.label} (${count})` : props.label;
    };

    return (
        <div class="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen())}
                class="w-full flex items-center justify-between px-4 py-3 bg-[#1D293E] border border-[#3A4B67] rounded-lg text-gray-300 hover:border-[#66D9EF] focus:outline-none focus:ring-2 focus:ring-[#66D9EF] transition-all truncate"
            >
                <div class="flex items-center gap-2">
                    {props.icon}
                    <span>{buttonLabel()}</span>
                </div>
                <ChevronDown class={`w-5 h-5 transition-transform duration-200 ${isOpen() ? 'rotate-180' : ''}`} />
            </button>
            <Show when={isOpen()}>
                <div class="absolute z-[100] w-full mt-1 p-2 bg-[#1D293E] border border-[#3A4B67] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <For each={props.items}>
                        {(item) => (
                            <label class="flex items-center gap-3 p-2 rounded-md hover:bg-[#3A4B67]/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={props.selectedItems.includes(item)}
                                    onChange={() => props.onToggleItem(item)}
                                    class="h-4 w-4 rounded bg-[#101827] border-[#3A4B67] text-[#66D9EF] focus:ring-[#66D9EF]"
                                />
                                <span class="text-sm">{item}</span>
                            </label>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};
