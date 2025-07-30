import { Trash2, Play } from 'lucide-solid';

interface Props {
    title?: string;
    description?: string;
    id?: number;
    class?: string;
    accuracy?: string;
    attempts?: string;
    lastModified?: string;
    onDelete?: (id: number) => void;
}

export default function FlashcCardListItem(props: Props) {
    return (
        <li class="p-3 bg-sidebar-light-1 rounded-md flex justify-start items-start flex-col border-gray-100 border-1">
            <div class="flex justify-between w-full">
                <span class="text-accent text-xl">{props.title || "Flashcard 1"}</span>
                <div class="flex gap-4">
                    <Play
                        class="text-gray-400 hover:text-accent transition-colors cursor-pointer"
                        onClick={() => props.onDelete?.(props.id || 0)}
                    />
                    <Trash2
                        class="text-gray-400 hover:text-error transition-colors cursor-pointer"
                        onClick={() => props.onDelete?.(props.id || 0)}
                    />
                </div>
            </div>
            <span class="text-white text-sm">{props.description || "Because it's black and white, it has a classic look"}</span>
            <div class="flex justify-between items-center mt-2 gap-16 w-full">
                <div class="flex items-center gap-2 bg-accent-dark-3 text-white text-xs px-3 py-1 rounded-full shadow">
                    <span>🎯 {props.accuracy || "80%"}</span>
                    <span class="text-gray-300/80">({props.attempts || "5 Attempts"})</span>
                </div>
                <span class="text-gray-400 text-xs">Last modified: {props.lastModified || "2023-10-05"}</span>
            </div>

            <div class="grid grid-cols-3 gap-2">
            </div>
        </li>
    );
};
