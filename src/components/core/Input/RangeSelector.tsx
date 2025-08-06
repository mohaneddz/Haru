import { createSignal, createEffect, onMount } from 'solid-js';

interface Props {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  onChange?: (value: number) => void;
  class?: string;
  disabled?: boolean;
  showValue?: boolean;
}

export default function RangeSelector(props: Props) {
  const [value, setValue] = createSignal(props.value ?? props.min ?? 0);
  const [isDragging, setIsDragging] = createSignal(false);
  
  let rangeRef: HTMLDivElement | undefined;
  
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const step = () => props.step ?? 1;
  
  const percent = () => ((value() - min()) / (max() - min())) * 100;
  
  createEffect(() => {
    props.onChange?.(value());
  });
  
  const handleMouseDown = (e: MouseEvent) => {
    if (props.disabled) return;
    e.preventDefault();
    setIsDragging(true);
    updateValue(e);
  };
  
  const updateValue = (e: MouseEvent) => {
    if (!rangeRef) return;
    
    const rect = rangeRef.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newValue = min() + (percent / 100) * (max() - min());
    const steppedValue = Math.round(newValue / step()) * step();
    
    setValue(Math.max(min(), Math.min(max(), steppedValue)));
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    updateValue(e);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  });
  
  return (
    <div class={`w-full pt-4 ${props.class || ''}`}>
      <div
      ref={rangeRef}
      class={`relative h-2 bg-sidebar-light-2 rounded-full cursor-pointer ${
        props.disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onMouseDown={handleMouseDown}
      >
      {/* Track fill */}
      <div
        class="absolute h-full bg-accent rounded-full"
        style={{
        width: `${percent()}%`,
        }}
      />
      
      {/* Handle */}
      <div
        class={`absolute w-4 h-4 bg-white border-2 border-accent rounded-full cursor-grab transform -translate-y-1 shadow-md transition-transform ${
        isDragging() ? 'cursor-grabbing scale-110' : ''
        } ${props.disabled ? 'cursor-not-allowed' : ''}`}
        style={{
        left: `calc(${percent()}% - 8px)`,
        }}
      />
      </div>
      
      {/* Value display */}
      {props.showValue !== false && (
      <div class="flex justify-center mt-2 text-sm text-text-dark-1">
        <span>{value().toFixed(1)}</span>
      </div>
      )}
    </div>
  );
}
