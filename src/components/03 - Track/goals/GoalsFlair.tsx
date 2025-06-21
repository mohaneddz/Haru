import { Scroll } from 'lucide-solid';

import LayoutCard from "@/components/02 - Practice/training/LayoutCard";
import CompletionRatio from '@/components/03 - Track/CompletionRatio';

interface Props {
    progress: number;
    name: string;
}

export default function GoalsFlair(props: Props) {
    return (
        <LayoutCard hoverable={false} class="relative flex-1 bg-gray-700 w-full h-full flex justify-between ">

            <div class="flex items-center justify-between gap-4 p-4 w-full pt-6">

                <div class="flex items-center gap-4">
                    <p class='absolute text-text/50 top-4 left-4'>Closest Goal : </p>
                    <CompletionRatio percentage={props.progress} color="bg-accent" size="sm" />
                    <p class='text-2xl text-accent font-black'>{props.name}</p>
                </div>

                <div class="cursor-pointer active:scale-95 bg-sidebar-light-2/30 border-accent/40 border-[1px] p-2 rounded-full mr-8 w-16 h-16 flex items-center justify-center hover:bg-sidebar-light-3 hover:text-gray-300 transition-all duration-200 active:bg-sidebar-dark-2 active:text-gray-400">
                    <Scroll
                        size={16}
                        strokeWidth={1}
                        class="text-accent w-8 h-8 scale-x-[-1] transition-all duration-200"
                    />
                </div>

            </div>

        </LayoutCard>
    );
};
