import overlay from '@/assets/overlay.png';
import * as LucideIcons from 'lucide-solid';

interface Props {
  title: string;
  description: string;
  icon: string;
  img?: string; 
  type: 'PDF' | 'Book' | 'Sheet' | 'Paper' | 'Notes';
  href?: string;
}

export default function DocumentCard(props: Props) {
  const IconComponent = (LucideIcons as any)[props.icon];

  return (
    <a
      href={props.href || '#'}
      target="_blank"
      class="p-0.5 bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md hover:shadow-lg transition duration-150 hover:scale-105 active:scale-100 overflow-hidden group w-full max-w-[280px] h-[360px]"
    >
      <div class="relative rounded-lg overflow-hidden bg-background-light-3 w-full h-full transition-shadow duration-300 group-hover:shadow-[0_0_15px_2px_rgba(255,255,255,0.1)]">

        {props.img && (
          <img
            src={props.img}
            alt="Document"
            class="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}

        <img
          src={overlay}
          class="absolute opacity-70 inset-0 w-full h-full object-cover z-10 pointer-events-none"
        />

        <div class="absolute top-4 right-4 z-20">
          <span class="text-xs font-medium px-2 py-0.5 bg-black/60 rounded text-white uppercase">
            {props.type}
          </span>
        </div>

        <div class="absolute top-4 left-4 z-20">
          <div class="bg-black/40 p-2 rounded-full">
            {IconComponent && (
              <IconComponent class="w-6 h-6 text-accent group-hover:text-white transition-colors" />
            )}
          </div>
        </div>

        <div class="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 py-4 flex flex-col gap-2">
          <h3 class="text-lg font-bold text-accent line-clamp-2 group-hover:text-white transition-colors">
            {props.title}
          </h3>
          <p class="text-sm text-gray-300 line-clamp-3 group-hover:text-gray-200">
            {props.description}
          </p>
        </div>

      </div>
    </a>
  );
}
