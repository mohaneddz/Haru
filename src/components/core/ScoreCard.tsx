import * as lucide from 'lucide-solid';

interface Props {
    icon: lucide.LucideIcon;
    title?: string;
    value?: string | number;
}

export default function ScoreCard(props: Props) {

    const { icon: Icon } = props;

    return (
        <div class="bg-gradient-to-br from-sidebar-light-3 to-accent-dark-3 aspect-[2] rounded-md hover:scale-95 transition-transform duration-200 flex items-center justify-center">
            <div class="flex items-center gap-4">
                <Icon class="w-12 h-12 text-white" />
                <div>
                    <p class="text-white/80 text-sm">{props.title}</p>
                    <p class="text-white text-2xl font-bold">{props.value}</p>
                </div>
            </div>
        </div>
    );
};
