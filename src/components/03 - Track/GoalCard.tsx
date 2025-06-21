import { Goal } from 'lucide-solid'
import ProgressBar from '@/components/core/ProgressBar';
import LayoutCard from "@/components/02 - Practice/training/LayoutCard";

interface GoalProps {
  name: string;
  progress: number;
  category: 'learning' | 'project' | 'personal';
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  class?: string;
}

export default function GoalCard(props: GoalProps) {
  const getCategoryColor = () => {
    switch (props.category) {
      case 'learning': return 'text-accent';
      case 'project': return 'text-good';
      case 'personal': return 'text-tertiary';
      default: return 'text-accent';
    }
  };

  const getPriorityColor = () => {
    switch (props.priority) {
      case 'high': return 'bg-bad-dark-1/20 text-bad-light-1';
      case 'medium': return 'bg-neutral-dark-2/20 text-neutral-light-1';
      case 'low': return 'bg-good-dark-3/20 text-good-light-1';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDeadline = () => {
    const date = new Date(props.deadline);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <LayoutCard class="w-full">
      <div class="grid grid-cols-6 w-full items-center gap-4">
        
        {/* Goal Icon and Name */}
        <div class="flex items-center col-span-3 gap-3">
          <Goal class={`w-8 h-8 ${getCategoryColor()}`} />
          <div class="flex flex-col min-w-0">
            <p class='text-lg text-text/70 truncate'>{props.name}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor()}`}>
                {props.priority}
              </span>
              <span class="text-xs text-text/50">
                Due {formatDeadline()}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div class="col-span-2">
          <ProgressBar progress={props.progress} text={`${props.progress}%`} class='w-full' />
        </div>

        {/* Category Badge */}
        <div class="col-span-1 flex justify-end">
          <span class={`px-2 py-1 text-xs rounded-md bg-sidebar-light-2 ${getCategoryColor()}`}>
            {props.category}
          </span>
        </div>
        
      </div>
    </LayoutCard>
  );
}

