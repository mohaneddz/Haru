import LayoutCard from "@/components/02 - Practice/training/LayoutCard";
import * as LucideIcons from 'lucide-solid';

interface Props {
    title?: string;
    description?: string;
    points?: number;
    icon: string;
    unlocked?: boolean;
}

export default function AchivementCard(props: Props) {

    const IconComponent = (LucideIcons as any)[props.icon] || LucideIcons['Award'];
    const LockIcon = (LucideIcons as any)['Lock'] || LucideIcons['Lock'];

    return (
        <LayoutCard border class="relative h-full w-full bg-sidebar-light-1/40 rounded-lg p-4 flex flex-col items-center justify-center ">
            {props.unlocked ? (
                <>
                    <div class="bg-sidebar-light-3 p-4 rounded-full mb-2 flex justify-center items-center">
                        {IconComponent && <IconComponent class="text-accent w-8 h-8" />}
                    </div>

                    <h3 class="text-text text-lg font-semibold mb-1 text-nowrap">{props.title}</h3>

                    {/* replace with dots */}
                    <p class="text-gray-400 text-sm hyphens-auto">{props.description}</p>

                    <div class="">

                    </div>

                    <div class="mt-2">
                        <span class="text-good">+{props.points} Points</span>
                    </div>
                </>

            ) :
                (
                    <>
                        <div class="absolute inset-0 bg-gradient-to-b from-sidebar-dark-1/10 to-transparent rounded-lg pointer-events-none">
                            <LockIcon class="absolute top-2 right-2 text-accent-dark-3/40 w-6 h-6" />
                        </div>

                        <div class="bg-sidebar-light-1 p-4 rounded-full mb-2 flex justify-center items-center">
                            {IconComponent && <IconComponent class="text-accent-dark-3/40 w-8 h-8" />}
                        </div>

                        <p class="text-accent-dark-3/40 text-lg font-semibold mb-1">{props.title}</p>

                        <p class="text-gray-600 text-sm hyphens-auto">{props.description}</p>

                        <div class="">

                        </div>

                        <div class="mt-2">
                            <span class="text-good/40">+{props.points} Points</span>
                        </div>

                    </>
                )
            }

        </LayoutCard>
    );
} 