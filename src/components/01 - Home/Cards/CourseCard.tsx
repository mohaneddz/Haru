import overlay from '@/assets/overlay.png';
import * as LucideIcons from 'lucide-solid';
import { For } from 'solid-js';

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

  return (
      <a
        class="group p-0.25 bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg transition duration-100 hover:scale-105 cursor-pointer active:scale-100 overflow-hidden block"
        style="box-shadow: 0 8px 32px 0 rgba(0,0,0,0.45);"
        href={`/home/discover/${props.title.toLowerCase().replace(/\s+/g, '-')}`}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 16px 64px 0 rgba(0,0,0,0.55)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.45)'}
      >

        <div class="relative animated pulse bg-background-light-3 rounded-lg p-0 shadow-md hover:shadow-lg transition-shadow duration-300 aspect-[5/3] w-full">

          <img
            src={props.img}
            alt="Course"
            class="w-full h-full object-fill rounded-lg absolute z-0"
          />
          <img src={overlay} class="w-full h-full object-fill rounded-lg absolute z-10" />

          <div class="flex flex-col gap-0 absolute bottom-0 left-0 right-0 px-4 p-2 bg-gradient-to-t from-shadow-2 to-transparent rounded-lg z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <div class="flex gap-4 items-center">
              {IconComponent && <IconComponent class="text-accent w-8 h-8 mb-4 absolute right-4 bottom-2" />}
              <span class="text-center text-lg font-semibold text-accent z-30">{props.title}</span>
            </div>
            <span class="text-[0.7rem] text-accent-dark-3 w-70 z-30 truncate">{props.description}</span>
            
            {/* Tags with hover mechanism */}
            {props.tags && props.tags.length > 0 ? (
              <div class="flex flex-wrap gap-1 mt-1">
                <For each={props.tags.slice(0, 2)}>
                  {(tag) => (
                    <span class="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded-full transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
                      {tag}
                    </span>
                  )}
                </For>
              </div>
            ) : (
              <div class="mt-4"></div>
            )}
          </div>

        </div>
      </a>
  );
}
