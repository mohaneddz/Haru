import LayoutCard from '@/components/02 - Practice/training/LayoutCard';
import { Trash2 } from 'lucide-solid';


interface Props {
    title: string;
    description?: string;
    id?: number;
    class?: string;
    onDelete?: () => void;
}

export default function FlashDeckCard(props: Props) {

    return (
        <div class="h-min w-full">
            <LayoutCard hoverable={false} class="px-6 py-12 border rounded-2xl shadow-xl bg-background-dark-1 text-text flex flex-col gap-4 relative">

                <Trash2 class="absolute right-2 top-2 text-gray-400 hover:text-error transition-colors cursor-pointer" onClick={props.onDelete} />

                <p class="text-lg text-accent-light-1 truncate font-bold" value-id={props.id}>{props.title}
                </p>

                <p class="text-xs opacity-80 truncate text-left w-[80%]">{props.description}</p>

                <div class="flex gap-2 w-full">
                    <a href={`/practice/flashcards/revision?id=${props.id}`} class="text-center bg-accent w-full hover:scale-103 hover:bg-accent-dark-1 transition-all duration-75 cursor-pointer p-1 rounded">Start</a>
                    <a href={`/practice/flashcards/${props.id}`} class="text-center bg-sidebar-light-3 w-full hover:scale-103 hover:bg-sidebar-light-1 transition-all duration-75 cursor-pointer p-1 rounded">Edit</a>
                </div>

            </LayoutCard>
        </div>
    );
}
