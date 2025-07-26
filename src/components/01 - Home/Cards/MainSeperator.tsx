import { ChevronRight } from "lucide-solid";
import { createSignal } from "solid-js";

interface Props {
    title?: string;
    description?: string;
    class?: string;
    onToggle?: (isExpanded: boolean) => void;
}

export default function MainSeperator(props: Props) {
    const [isExpanded, setIsExpanded] = createSignal(true);

    const handleToggle = () => {
        const newState = !isExpanded();
        setIsExpanded(newState);
        props.onToggle?.(newState);
    };

    return (
        <div 
            class={`flex items-center justify-between w-full px-4 py-2 text-accent-dark-1 max-w-[80%] cursor-pointer` + (props.class || "")}
            onClick={handleToggle}
        >
            {props.title ? (
                <ChevronRight 
                    class={`w-6 h-6 text-accent transition-transform duration-200 ${
                        isExpanded() ? 'rotate-90' : 'rotate-0'
                    }`} 
                />
            ) : null}
            <span class="pr-8 text-nowrap">{props.title}</span>
            <div class="bg-accent w-full h-0.5"></div>
        </div>
    );
};