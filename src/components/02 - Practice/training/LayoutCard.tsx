import { JSX } from 'solid-js';

interface TrainingCardProps {
  variation?: 'default' | 'tall' | 'wide';
  children?: JSX.Element;
  hoverable?: boolean;
  class?: string;
  border?: boolean;
}

export default function LayoutCard(props: TrainingCardProps) {
  const getVariationClasses = () => {
    switch (props.variation) {
      case 'tall':
        return 'row-span-2';
      case 'wide':
        return 'col-span-2';
      default:
        return '';
    }
  };

  const hoverClasses = (props.hoverable ?? true)
    ? 'hover:scale-95 active:scale-90 hover:from-gray-700 hover:to-gray-800'
    : '';

  const borderHoverClasses = (props.hoverable ?? true)
    ? 'hover:shadow-lg transition duration-100 hover:scale-103 hover:cursor-pointer active:scale-100'
    : 'transition duration-100';

  return (
    <>
      {props.border ? (
        <div class={`bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md overflow-hidden ${borderHoverClasses} `}>
          <div class="p-0.5 h-full">
            <div
              class={`h-full w-full flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-md cursor-pointer transition-all duration-300 ${props.class || ''} ${getVariationClasses()}`}
            >
              {props.children}
            </div>
          </div>
        </div>
      ) : (
        <div
          class={`flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg cursor-pointer transition-all duration-300 ${props.class || ''} ${hoverClasses} ${getVariationClasses()}`}
        >
          {props.children}
        </div>
      )}
    </>
  );
}
