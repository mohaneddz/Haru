import overlay from '@/assets/overlay.png';
import * as LucideIcons from 'lucide-solid';

interface Props {
  img: string;
  title: string;
  description: string;
  icon: string; 
}

export default function CourseCard(props: Props) {

  const IconComponent = (LucideIcons as any)[props.icon];

  return (
    <a class="p-0.25 bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md hover:shadow-lg transition duration-100 hover:scale-105 hover:cursor-pointer active:scale-100 overflow-hidden"
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
  );
}
