import { Component, JSXElement } from 'solid-js';

type ButtonVariant = 'number' | 'operator' | 'function' | 'special';
type ButtonSize = 'normal' | 'wide' | 'tall';

interface CalculatorButtonProps {
  children: JSXElement;
  onClick: () => void;
  class?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const CalculatorButton: Component<CalculatorButtonProps> = (props) => {
  const getVariantClasses = (): string => {
    switch (props.variant) {
      case 'number':
        return 'bg-sidebar-light-2 hover:bg-sidebar-light-3 text-text border-border-light-1';
      case 'operator':
        return 'bg-accent/20 hover:bg-accent/30 text-accent border-accent/30';
      case 'function':
        return 'bg-primary/20 hover:bg-primary/30 text-primary border-primary/30';
      case 'special':
        return 'bg-warning/20 hover:bg-warning/30 text-warning border-warning/30';
      default:
        return 'bg-sidebar-light-1 hover:bg-sidebar-light-2 text-text/80 border-border-light-1';
    }
  };

  const getSizeClasses = (): string => {
    switch (props.size) {
      case 'wide':
        return 'col-span-2';
      case 'tall':
        return 'row-span-2';
      default:
        return '';
    }
  };

  return (
    <button
      class={`
        h-full max-h-20 py-2 rounded-lg border transition-all duration-150 
        hover:scale-105 active:scale-95 font-medium
        flex items-center justify-center text-sm
        ${getVariantClasses()} ${getSizeClasses()} ${props.class || ''}
      `}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

export default CalculatorButton;