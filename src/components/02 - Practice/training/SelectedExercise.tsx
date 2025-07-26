import * as LucideIcons from 'lucide-solid'
import { Component } from 'solid-js'
type IconName = keyof typeof LucideIcons;

interface ExerciseProps {
  icon: string;
  id: number;
  name: string;
  description: string;
  difficulty: string;
}

export default function SelectedExercise(props: ExerciseProps) {

  const getIcon = () => {
    const IconComponent = LucideIcons[props.icon as IconName] as Component<any>;
    if (IconComponent) {
      return <IconComponent size={24} class="text-accent w-8 h-8 group-hover:text-white" />;
    } else {
      console.warn(`Icon "${props.icon}" not found in LucideIcons.`);
      return null;
    }
  };

  return (
    <div class="p-0.5 bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md hover:shadow-lg transition duration-100 hover:scale-102 cursor-pointer active:scale-100 overflow-hidden group">

      <div class="flex flex-col justify-between w-full h-full p-6 bg-gradient-to-b from-gray-800 to-gray-900 text-white rounded-lg transition-all duration-300 group-hover:from-gray-700 group-hover:to-gray-800 group-hover:shadow-[0_0_15px_2px_rgba(255,255,255,0.1)]">

        <div class="flex items-center gap-4 mb-4">
          <div class="bg-accent-dark-2 rounded-full p-2 flex items-center justify-center transition-all duration-300 group-hover:bg-accent-dark-1 group-hover:scale-110">
            {getIcon()}
          </div>
          <span class="text-xl font-semibold text-accent">{props.name}</span>
        </div>

        <p class="text-sm text-gray-300 mb-4 flex-1 transition-colors duration-300 group-hover:text-gray-200">
          {props.description}
        </p>

        <div class="flex justify-end">
          <span class={`text-sm font-medium transition-colors duration-300 group-hover:text-gray-400 ${
            props.difficulty === 'Easy' ? 'text-green-500' :
            props.difficulty === 'Medium' ? 'text-yellow-500' :
            'text-red-500'
          }`}>
            {props.difficulty}
          </span>
        </div>

      </div>
    </div>
  );
}

export const exampleSelectedExercises = [
  {
    icon: "Pi",
    id: 1,
    name: "Math Problem",
    description: "Solve the equation: 2x + 5 = 15",
    difficulty: "Easy"
  },
  {
    icon: "Code",
    id: 2,
    name: "Coding Challenge",
    description: "Write a function to reverse a string in JavaScript.",
    difficulty: "Medium"
  },
  {
    icon: "Brain",
    id: 3,
    name: "Logic Puzzle",
    description: "What has an eye, but cannot see?",
    difficulty: "Easy"
  },
];
