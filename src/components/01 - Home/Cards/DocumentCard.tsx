import { For } from 'solid-js';

interface Props {
  title: string;
  description: string;
  icon: string;
  img?: string; 
  type: 'Exercises' | 'Book' | 'Sheet' | 'Paper' | 'Notes';
  href?: string;
  tags?: string[];
}

export default function DocumentCard(props: Props) {

  return (
    <a
      href='/pdf'
      // href={props.href || '#'}
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

        {/* Gradient overlay instead of image */}
        <div
          class="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{
            "background": "linear-gradient(0deg, rgba(30,30,40,1) 0%, rgba(30,30,40,0.7) 25%, rgba(0,0,0,0.0) 40%)"
          }}
        />

        <div class="absolute top-0 right-2 z-20">
          <span class="text-[0.6rem] font-medium px-2 py-0.5 bg-black/60 rounded text-white uppercase">
            {props.type ? props.type : 'Document'}
          </span>
        </div>


        <div class="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 flex flex-col gap-2 translate-y-8 group-hover:-translate-y-4 transition-transform duration-300">
          <p class="text-sm text-nowrap  font-bold text-accent line-clamp-2 transition-colors">
            {props.title}
          </p>
          <p class="text-[0.75rem] text-gray-300 line-clamp-2  truncate w-[80%]">
            {props.description}
          </p>
          
          {/* Tags */}
          {props.tags && props.tags.length > 0 && (
            <div class="flex-wrap gap-1 mt-1 flex transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
              <For each={props.tags.slice(0, 2)}>
                {(tag) => (
                  <span class="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                    {tag}
                  </span>
                )}
              </For>
              {props.tags.length > 3 && (
                <span class="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
                  +{props.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
        </div>
      </div>
    </a>
  );
}
