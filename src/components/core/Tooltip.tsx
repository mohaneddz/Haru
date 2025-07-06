import { createSignal, Show, onCleanup, JSX } from 'solid-js';

interface Props {
  content: JSX.Element;
  children: JSX.Element;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  class?: string;
  disabled?: boolean;
}

export default function Tooltip(props: Props) {
  const [isVisible, setIsVisible] = createSignal(false);
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  
  let hoverTimeout: number | undefined;
  let tooltipRef: HTMLDivElement | undefined;
  let triggerRef: HTMLDivElement | undefined;

  const handleMouseEnter = (e: MouseEvent) => {
    if (props.disabled) return;
    
    const delay = props.delay || 300;
    hoverTimeout = window.setTimeout(() => {
      updatePosition(e);
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setIsVisible(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isVisible() && !props.position) {
      updatePosition(e);
    }
  };

  const updatePosition = (e: MouseEvent) => {
    if (!props.position) {
      // Follow cursor
      setPosition({ x: e.clientX, y: e.clientY });
    } else if (triggerRef) {
      // Position relative to trigger element
      const rect = triggerRef.getBoundingClientRect();
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      
      let x = 0, y = 0;
      
      switch (props.position) {
        case 'top':
          x = rect.left + rect.width / 2 + scrollX;
          y = rect.top + scrollY;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2 + scrollX;
          y = rect.bottom + scrollY;
          break;
        case 'left':
          x = rect.left + scrollX;
          y = rect.top + rect.height / 2 + scrollY;
          break;
        case 'right':
          x = rect.right + scrollX;
          y = rect.top + rect.height / 2 + scrollY;
          break;
      }
      
      setPosition({ x, y });
    }
  };

  onCleanup(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
  });

  const getTooltipClasses = () => {
    const baseClasses = "fixed z-50 px-4 py-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg border border-gray-700 max-w-xs pointer-events-none transition-opacity duration-200";
    
    if (!props.position) {
      return `${baseClasses} transform -translate-x-2 -translate-y-full`;
    }
    
    switch (props.position) {
      case 'top':
        return `${baseClasses} transform -translate-x-1/2 -translate-y-full -mt-2`;
      case 'bottom':
        return `${baseClasses} transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} transform -translate-x-full -translate-y-1/2 -mr-2`;
      case 'right':
        return `${baseClasses} transform translate-y-1/2 ml-2`;
      default:
        return baseClasses;
    }
  };

  const getArrowClasses = () => {
    if (!props.position) return "";
    
    const baseArrow = "absolute w-0 h-0";
    
    switch (props.position) {
      case 'top':
        return `${baseArrow} left-1/2 transform -translate-x-1/2 top-full border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800`;
      case 'bottom':
        return `${baseArrow} left-1/2 transform -translate-x-1/2 bottom-full border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800`;
      case 'left':
        return `${baseArrow} top-1/2 transform -translate-y-1/2 left-full border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-800`;
      case 'right':
        return `${baseArrow} top-1/2 transform -translate-y-1/2 right-full border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-gray-800`;
      default:
        return "";
    }
  };

  return (
    <div class={`${props.class || ''}`}>
      <div
        ref={triggerRef}
        onMouseEnter={props.disabled ? undefined : handleMouseEnter}
        onMouseLeave={props.disabled ? undefined : handleMouseLeave}
        onMouseMove={props.disabled ? undefined : handleMouseMove}
        class={props.disabled ? "" : "cursor-pointer"}
      >
        {props.children}
      </div>
      
      <Show when={isVisible() && !props.disabled}>
        <div
          ref={tooltipRef}
          class={getTooltipClasses()}
          style={{
            left: `${position().x}px`,
            top: `${position().y}px`,
            opacity: isVisible() ? 1 : 0
          }}
        >
          {props.content}
          <Show when={props.position}>
            <div class={getArrowClasses()}></div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
