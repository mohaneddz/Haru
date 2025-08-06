import overlay from '@/assets/overlay.png';
import * as LucideIcons from 'lucide-solid';

interface Props {
  img?: string;
  title: string;
  description: string;
  icon: string;
}

export default function GameCard(props: Props) {
  const IconComponent = (LucideIcons as any)[props.icon];

  return (
    <a
      href={`/practice/games/${props.title.toLowerCase().replace(/\s+/g, '-')}`}
      class="p-0.5 bg-gradient-to-br h-full w-full from-border-light-2 to-border-dark-2 rounded-lg shadow-md hover:shadow-lg transition duration-150 hover:scale-105 active:scale-100 overflow-hidden group"
    >
      <div class="relative rounded-lg overflow-hidden bg-background-light-3 aspect-[5/3] w-full transition-shadow duration-300 group-hover:shadow-[0_0_15px_2px_rgba(255,255,255,0.1)]">

        {/* Background Image */}
        <img
          src={props.img}
          alt="Game"
          class="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Overlay */}
        <img
          src={overlay}
          class="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
        />

        {/* Info Panel */}
        <div class="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 py-3 flex flex-col gap-1">
          <div class="flex items-center gap-2">
            {IconComponent && (
              <IconComponent class="text-accent w-5 h-5 group-hover:text-text transition-colors duration-200" />
            )}
            <span class="text-accent text-sm font-semibold group-hover:text-text transition-colors duration-200">
              {props.title}
            </span>
          </div>
          <span class="text-xs text-gray-300 truncate">{props.description}</span>
        </div>

      </div>
    </a>
  );
}
