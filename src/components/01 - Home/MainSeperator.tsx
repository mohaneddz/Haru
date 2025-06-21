import { ChevronRight } from "lucide-solid";

interface Props {
    title?: string;
    description?: string;
    class?: string;
}

export default function MainSeperator(props: Props) {
    return (

        <div class={`flex items-center justify-between w-full px-4 py-2 text-accent-dark-1 max-w-[80%]` + (props.class || "")}>
            {props.title ? <ChevronRight class="w-6 h-6 text-accent hover:cursor-pointer" /> : null}
            <span class="pr-8 text-nowrap">{props.title}</span>
            <div class="bg-accent w-full h-0.5"> </div>
        </div>
    );
};
