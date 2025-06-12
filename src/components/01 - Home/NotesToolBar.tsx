import { createSignal, JSX, ParentComponent, Show } from 'solid-js';
import {
  Wand2, Sparkles, Languages, Highlighter, List, MessageSquareText,
  HelpCircle, Code2
} from 'lucide-solid';

// Tooltip Component with Animation
interface TooltipProps {
  content: string;
  position?: 'right' | 'left' | 'top' | 'bottom';
  delay?: number;
  children: JSX.Element;
}

const Tooltip: ParentComponent<TooltipProps> = (props) => {
  const [isVisible, setIsVisible] = createSignal(false);
  let timeoutId: any;

  const showTooltip = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setIsVisible(true);
    }, props.delay || 300);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (props.position || 'right') {
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'top':
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      default:
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
    }
  };

  const getArrowClasses = () => {
    switch (props.position || 'right') {
      case 'right':
        return 'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800';
      case 'left':
        return 'absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800';
      case 'top':
        return 'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800';
      case 'bottom':
        return 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800';
      default:
        return 'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800';
    }
  };

  return (
    <div 
      class="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {props.children}
      <Show when={isVisible()}>
        <div 
          class={`absolute z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200 ${getPositionClasses()}`}
        >
          <div class="bg-gray-800 text-white text-xs px-3 py-2 rounded-md shadow-lg whitespace-nowrap relative">
            {props.content}
            <div class={getArrowClasses()}></div>
          </div>
        </div>
      </Show>
    </div>
  );
};

// Enhanced Toolbar Button with Tooltip
interface NotesToolBarButtonProps {
  icon: any;
  toolTip: string;
  onClick?: () => void;
}

function NotesToolBarButton(props: NotesToolBarButtonProps) {
  const [isPressed, setIsPressed] = createSignal(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    props.onClick?.();
  };

  return (
    <Tooltip content={props.toolTip} position="left" delay={200}>
      <div
        onClick={handleClick}
        class={`
          group relative w-10 h-10 my-1 cursor-pointer 
          rounded-lg flex items-center justify-center
          transition-all duration-200 ease-in-out
          hover:bg-primary/10 hover:scale-105 hover:shadow-md
          active:scale-95 active:bg-primary/20
          ${isPressed() ? 'bg-primary/20 scale-95' : ''}
          border border-transparent hover:border-primary/20
        `}
      >
        <props.icon 
          size={18} 
          class={`
            transition-all duration-200
            text-white group-hover:text-accent-light-1
            ${isPressed() ? 'text-accent' : ''}
          `}
        />
      </div>
    </Tooltip>
  );
}

// Main Toolbar Component
export default function NotesToolBar() {
  const handleAction = (action: string) => {
    console.log(`Executing action: ${action}`);
    // Add your action handlers here
  };

  return (
    <div class='
      absolute top-[25vh] flex flex-col h-[24rem] w-12 
      bg-sidebar-light-1/80 backdrop-blur-sm border border-gray-200 
      rounded-xl right-4 justify-start items-center py-3 
      shadow-lg hover:shadow-xl transition-shadow duration-300
      overflow-visible
    '>
      <NotesToolBarButton 
        icon={Wand2} 
        toolTip='Rewrite with AI' 
        onClick={() => handleAction('rewrite')}
      />
      <NotesToolBarButton 
        icon={Sparkles} 
        toolTip='Summarize content' 
        onClick={() => handleAction('summarize')}
      />
      <NotesToolBarButton 
        icon={Languages} 
        toolTip='Translate text' 
        onClick={() => handleAction('translate')}
      />
      <NotesToolBarButton 
        icon={Highlighter} 
        toolTip='Highlight key points' 
        onClick={() => handleAction('highlight')}
      />
      <NotesToolBarButton 
        icon={List} 
        toolTip='Extract bullet points' 
        onClick={() => handleAction('extract')}
      />
      <NotesToolBarButton 
        icon={MessageSquareText} 
        toolTip='Ask AI questions' 
        onClick={() => handleAction('ask')}
      />
      <NotesToolBarButton 
        icon={HelpCircle} 
        toolTip='Generate quiz' 
        onClick={() => handleAction('quiz')}
      />
      <NotesToolBarButton 
        icon={Code2} 
        toolTip='Explain code snippets' 
        onClick={() => handleAction('explain')}
      />
    </div>
  );
}