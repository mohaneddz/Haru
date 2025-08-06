import * as LucideIcons from 'lucide-solid';

interface Props {
  title: string;
  description: string;
  icon: string;
  difficulty: string; 
}

export default function ChallengeCard(props: Props) {

  const IconComponent = (LucideIcons as any)[props.icon];

  const getDifficultyColor = () => {
    switch (props.difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'hard':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <a class="p-0.25 bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md hover:shadow-lg transition duration-100 hover:scale-105 cursor-pointer active:scale-100 overflow-hidden"
      href={`/practice/challenge/${props.title.toLowerCase().replace(/\s+/g, '-')}`}
      >
      <div class="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 aspect-[2] w-full flex flex-col justify-between">

        <div class="flex gap-4 items-center mb-4">
          {IconComponent && <IconComponent class="text-accent w-8 h-8" />}
          <span class="text-xl font-semibold text-accent">{props.title}</span>
        </div>

        <p class="text-sm text-gray-300 mb-4 flex-1">{props.description}</p>
        
        <div class="flex justify-end">
          <span class={`text-sm font-medium ${getDifficultyColor()}`}>
            {props.difficulty}
          </span>
        </div>

      </div>
    </a>
  );
}
