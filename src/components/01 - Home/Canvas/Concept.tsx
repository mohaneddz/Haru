import { createSignal, onCleanup } from 'solid-js';
import { Node, Transform } from '@/types/roadmap';
import ConceptTooltip from '@/components/01 - Home/Canvas/ConceptTooltip';

interface Props extends Node {
  transform: Transform;
  onMouseDown: (e: MouseEvent, node: Node) => void;
  onTooltipToggle?: (nodeId: string | null) => void;
  activeTooltipId?: string | null;
  onDelete?: (nodeId: string) => void;
  onMarkNotLearned?: (nodeId: string) => void;
  onMarkLearned?: (nodeId: string) => void;
  draggedNodeId?: string | null;
}

export default function Concept(props: Props) {
  const [isHovered, setIsHovered] = createSignal(false);
  const [isDragging, setIsDragging] = createSignal(false);
  let hoverTimeout: ReturnType<typeof setTimeout>;

  const isTooltipPinned = () => props.activeTooltipId === props.id;
  const shouldShowTooltip = () => 
    !isDragging() && 
    !props.draggedNodeId && 
    (isHovered() || isTooltipPinned());

  const handleMouseDown = (e: MouseEvent) => {
    // Handle different mouse buttons
    if (e.button === 0) { // Left click
      e.stopPropagation();
      
      setIsDragging(true);
      setIsHovered(false);
      clearTimeout(hoverTimeout);
      
      if (isTooltipPinned()) {
        props.onTooltipToggle?.(null);
      } else {
        props.onTooltipToggle?.(props.id);
      }
      
      props.onMouseDown(e, props);
    } else if (e.button === 1) { // Middle click
      e.preventDefault();
      e.stopPropagation();
      
      // Delete the node
      props.onDelete?.(props.id);
    } else if (e.button === 2) { // Right click
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle learned status
      if (props.learned) {
        props.onMarkNotLearned?.(props.id);
      } else {
        props.onMarkLearned?.(props.id);
      }
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault(); // Prevent default context menu
  };

  const handleMouseEnter = () => {
    if (!props.activeTooltipId && !isDragging() && !props.draggedNodeId) {
      hoverTimeout = setTimeout(() => {
        setIsHovered(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout);
    if (!isTooltipPinned()) {
      setIsHovered(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  onCleanup(() => {
    clearTimeout(hoverTimeout);
  });

  const getNodeClasses = () => {
    const baseClasses = "absolute flex cursor-grab hover:cursor-grab active:cursor-grabbing rounded-md z-10 select-none justify-center items-center text-center";
    
    if (props.learned) {
      return `${baseClasses} bg-accent hover:bg-accent-dark-1 active:brightness-90`;
    } else {
      return `${baseClasses} bg-accent-dark-3 hover:bg-accent-dark-2 active:brightness-80`;
    }
  };

  return (
    <>
      <div
        class={getNodeClasses()}
        style={{
          left: `${props.transform.x + props.x * props.transform.scale}px`,
          top: `${props.transform.y + props.y * props.transform.scale}px`,
          width: `${props.width * props.transform.scale}px`,
          height: `${props.height * props.transform.scale}px`,
          border: `${1 / props.transform.scale}px solid #FFFFFF`,
          'font-size': `${14 * props.transform.scale}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      >
        {props.text}
        {props.learned && (
          <div class="absolute top-1 right-1 text-xs">✓</div>
        )}
      </div>

      {shouldShowTooltip() && (
        <ConceptTooltip
          node={props}
          transform={props.transform}
          isPinned={isTooltipPinned()}
          onClose={() => props.onTooltipToggle?.(null)}
          onDelete={props.onDelete}
          onMarkNotLearned={props.onMarkNotLearned}
          onMarkLearned={props.onMarkLearned}
        />
      )}
    </>
  );
};