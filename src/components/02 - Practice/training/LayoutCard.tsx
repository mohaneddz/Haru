import { JSX } from 'solid-js';

interface TrainingCardProps {
  variation?: 'default' | 'tall' | 'wide';
  children?: JSX.Element;
  hoverable?: boolean;
  class?: string;
  border?: boolean;
  href?: string;
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
    ? 'hover:scale-95 active:scale-90 hover:from-gray-700 hover:to-gray-800 hover:cursor-pointer'
    : '';

  const borderHoverClasses = (props.hoverable ?? true)
    ? 'hover:shadow-lg transition duration-100 hover:scale-103 active:scale-100'
    : 'transition duration-100';

  const href = props.href ? `${props.href}` : undefined;

  return (
    <>
      {props.border ? (
        <a href={href} class={`bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md overflow-hidden ${borderHoverClasses} block w-full h-full`}>
          <div class="p-0.5 h-full w-full">
            <div
              class={`h-full w-full flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-md transition-all duration-300 ${props.class || ''} ${getVariationClasses()}`}
            >
              {props.children}
            </div>
          </div>
        </a>
      ) : (
        <a href={href}
          class={`flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg transition-all duration-300 ${props.class || ''} ${hoverClasses} ${getVariationClasses()} block w-full h-full`}
        >
          {props.children}
        </a>
      )}
    </>
  );
}
