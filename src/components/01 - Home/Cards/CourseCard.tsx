import overlay from '@/assets/overlay.png';
import * as LucideIcons from 'lucide-solid';
import { For } from 'solid-js';
import Tooltip from '@/components/core/Tooltip';

interface Props {
  img: string;
  title: string;
  description: string;
  icon: string;
  tags?: string[];
  field?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export default function CourseCard(props: Props) {

  const IconComponent = (LucideIcons as any)[props.icon];

  // Create tooltip content with tags, field, and difficulty
  const tooltipContent = (
    <div class="space-y-3 min-w-[200px]">
      {/* Tags */}
      {props.tags && props.tags.length > 0 && (
        <div>
          <div class="text-xs text-gray-300 mb-2 font-medium">Tags:</div>
          <div class="flex flex-wrap gap-1">
            <For each={props.tags}>
              {(tag) => (
                <span class="px-2 py-1 bg-accent/30 text-accent text-xs rounded-full font-medium">
                  {tag}
                </span>
              )}
            </For>
          </div>
        </div>
      )}

      {/* Field */}
      {props.field && (
        <div>
          <div class="text-xs text-gray-300 mb-1 font-medium">Field:</div>
          <span class="text-sm text-accent-light-1 font-medium">
            {props.field}
          </span>
        </div>
      )}

      {/* Difficulty */}
      {props.difficulty && (
        <div>
          <div class="text-xs text-gray-300 mb-1 font-medium">Difficulty:</div>
          <span class={`text-sm px-3 py-1 rounded-full font-medium ${props.difficulty === 'Beginner' ? 'bg-green-500/30 text-green-300' :
            props.difficulty === 'Intermediate' ? 'bg-yellow-500/30 text-yellow-300' :
              'bg-red-500/30 text-red-300'
            }`}>
            {props.difficulty}
          </span>
        </div>
      )}
    </div>
  );

  // Only show tooltip if there's metadata to display
  const hasMetadata = props.tags?.length || props.field || props.difficulty;

  return (
    <Tooltip 
      content={tooltipContent} 
      position="top" 
      delay={300}
      disabled={!hasMetadata}
      class="block"
    >
      <a class="p-0.25 bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md hover:shadow-lg transition duration-100 hover:scale-105 hover:cursor-pointer active:scale-100 overflow-hidden block"
        href={`/home/discover/${props.title.toLowerCase().replace(/\s+/g, '-')}`}>

        <div class="relative animated pulse bg-background-light-3 rounded-lg p-0 shadow-md hover:shadow-lg transition-shadow duration-300 aspect-[5/3] w-full">

          <img
            src={props.img}
            alt="Course"
            class="w-full h-full object-fill rounded-lg absolute z-0"
          />
          <img src={overlay} class="w-full h-full object-fill rounded-lg absolute z-10" />

          <div class="flex flex-col gap-0 absolute bottom-0 left-0 right-0 px-4 p-2 bg-gradient-to-t from-shadow-2 to-transparent rounded-lg z-20">
            <div class="flex gap-4 items-center">
              {IconComponent && <IconComponent class="text-accent w-6 h-6 mb-2" />}
              <span class="text-center text-lg font-semibold text-accent z-30">{props.title}</span>
            </div>
            <span class="text-sm text-accent-dark-3 z-30 truncate">{props.description}</span>
          </div>

        </div>
      </a>
    </Tooltip>
  );
}
