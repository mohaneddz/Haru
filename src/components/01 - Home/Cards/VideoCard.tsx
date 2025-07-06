import overlay from '@/assets/overlay.png';
import * as LucideIcons from 'lucide-solid';
import { For } from 'solid-js';

interface Props {
  img: string;
  title: string;
  description: string;
  icon: string;
  duration?: string;
  type?: 'video' | 'playlist';
  count?: number;
  tags?: string[];
  field?: string;
}

export default function VideoCard(props: Props) {
  const IconComponent = (LucideIcons as any)[props.icon];
  const isPlaylist = props.type === 'playlist';

  return (
    <a
      class="p-0.5 bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md hover:shadow-lg transition duration-100 hover:scale-105 hover:cursor-pointer active:scale-100 overflow-hidden group"
      href={`/home/discover/${props.title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div class="relative bg-background-light-3 rounded-lg shadow-md overflow-hidden aspect-[5/3] w-full group-hover:shadow-[0_0_15px_2px_rgba(255,255,255,0.1)] transition-shadow duration-300">

        {/* Background Image */}
        <img
          src={props.img}
          alt={props.title}
          class="absolute inset-0 w-full h-full object-cover z-0"
        />

        <img
          src={overlay}
          class="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
        />

        <div class="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 py-3 flex flex-col gap-1">
          <div class="flex items-center gap-2">
            {IconComponent && (
              <IconComponent class="text-accent w-5 h-5 group-hover:text-white transition-colors duration-200" />
            )}
            <span class="text-sm font-semibold text-accent group-hover:text-accent-light-1 transition-colors duration-200">
              {props.title}
            </span>
          </div>
          <span class="text-xs text-gray-300 truncate w-70 group-hover:text-gray-300">{props.description}</span>
          
          {/* Tags */}
          {props.tags && props.tags.length > 0 && (
            <div class="flex flex-wrap gap-1 mt-1">
              <For each={props.tags.slice(0, 2)}>
                {(tag) => (
                  <span class="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                    {tag}
                  </span>
                )}
              </For>
              {props.tags.length > 2 && (
                <span class="px-1.5 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
                  +{props.tags.length - 2}
                </span>
              )}
            </div>
          )}
          
          {/* Field indicator */}
          {props.field && (
            <span class="text-xs text-accent-light-1 font-medium mt-0.5">
              {props.field}
            </span>
          )}
        </div>

        <div class="absolute top-2 right-2 z-30 px-2 py-0.5 rounded text-xs font-medium bg-black/70 text-white group-hover:text-accent">
          {isPlaylist ? 'Playlist' : props.duration || 'Video'}
        </div>

        {isPlaylist && props.count !== undefined && (
          <div class="absolute bottom-2 right-2 z-30 px-2 py-0.5 rounded text-xs font-medium bg-black/70 text-white group-hover:text-accent">
            {props.count} videos
          </div>
        )}
      </div>
    </a>
  );
}
