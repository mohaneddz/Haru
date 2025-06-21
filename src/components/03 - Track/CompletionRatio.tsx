import { createMemo } from 'solid-js';

interface CompletionRatioProps {
  percentage: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  strokeWidth?: number;
}

export default function CompletionRatio(props: CompletionRatioProps) {
  const percentage = () => Math.min(Math.max(props.percentage, 0), 100);
  const strokeWidth = () => props.strokeWidth || 8;
  
  const dimensions = createMemo(() => {
    switch (props.size) {
      case 'sm':
        return { size: 80, fontSize: 'text-sm' };
      case 'lg':
        return { size: 160, fontSize: 'text-2xl' };
      default:
        return { size: 120, fontSize: 'text-lg' };
    }
  });

  const radius = createMemo(() => (dimensions().size - strokeWidth()) / 2);
  const circumference = createMemo(() => 2 * Math.PI * radius());
  const strokeDashoffset = createMemo(() => circumference() - (percentage() / 100) * circumference());
  
  const colorClass = () => {
    const color = props.color || 'bg-accent';
    // Convert bg- classes to stroke colors
    if (color.includes('accent')) return 'stroke-accent';
    if (color.includes('blue')) return 'stroke-blue-500';
    if (color.includes('green')) return 'stroke-green-500';
    if (color.includes('red')) return 'stroke-red-500';
    if (color.includes('purple')) return 'stroke-purple-500';
    if (color.includes('yellow')) return 'stroke-yellow-500';
    return 'stroke-accent'; // fallback
  };

  return (
    <div class={`relative inline-flex items-center justify-center ${props.class || ''}`}>
      <svg
        width={dimensions().size}
        height={dimensions().size}
        class="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={dimensions().size / 2}
          cy={dimensions().size / 2}
          r={radius()}
          stroke="currentColor"
          stroke-width={strokeWidth()}
          fill="transparent"
          class="text-gray-600"
        />
          {/* Progress circle */}
        <circle
          cx={dimensions().size / 2}
          cy={dimensions().size / 2}
          r={radius()}
          stroke="currentColor"
          stroke-width={strokeWidth()}
          fill="transparent"
          stroke-dasharray={`${circumference()}`}
          stroke-dashoffset={`${strokeDashoffset()}`}
          stroke-linecap="round"
          class={`${colorClass()} transition-all duration-1000 ease-out`}
        />
      </svg>
      
      {/* Percentage text */}
      <div class={`absolute inset-0 flex items-center justify-center font-bold text-white ${dimensions().fontSize}`}>
        {percentage()}%
      </div>
    </div>
  );
}
