import { createSignal, onMount, onCleanup } from 'solid-js';
import { Transform, MousePosition } from '@/types/home/roadmap';

export function useCanvas() {
  let canvasRef: HTMLCanvasElement | undefined;
  let ctx: CanvasRenderingContext2D | null = null;
  let canvasElement: HTMLCanvasElement | undefined;

  const [transform, setTransform] = createSignal<Transform>({
    x: 0,
    y: 0,
    scale: 1
  });

  const [isDraggingCanvas, setIsDraggingCanvas] = createSignal<boolean>(false);
  const [lastMouse, setLastMouse] = createSignal<MousePosition>({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) {
      if (!canvasRef) return;
      setIsDraggingCanvas(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
      if (canvasRef) {
        canvasRef.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (isDraggingCanvas()) {
      const deltaX = e.clientX - lastMouse().x;
      const deltaY = e.clientY - lastMouse().y;

      setTransform(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      setIsDraggingCanvas(false);
      if (canvasRef) {
        canvasRef.style.cursor = 'grab';
      }
    }
  };

  const handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, transform().scale * scaleFactor));

    const { x, y, scale } = transform();
    const newX = mouseX - (mouseX - x) * (newScale / scale);
    const newY = mouseY - (mouseY - y) * (newScale / scale);

    setTransform({
      x: newX,
      y: newY,
      scale: newScale
    });
  };

  const handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  const resizeCanvas = (): void => {
    if (!canvasRef || !canvasRef.parentElement) return;

    const rect = canvasRef.parentElement.getBoundingClientRect();
    canvasRef.width = rect.width;
    canvasRef.height = rect.height;

    const context = canvasRef.getContext('2d');
    if (context) {
      ctx = context;
    }
  };

  const resetView = (): void => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  onMount(() => {
    if (!canvasRef) return;

    const context = canvasRef.getContext('2d');
    if (context) {
      ctx = context;
    }

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    if (canvasRef) {
      canvasRef.style.cursor = 'grab';
    }
  });

  onCleanup(() => {
    window.removeEventListener('resize', resizeCanvas);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  const canvasRefSetter = (ref: HTMLCanvasElement) => {
    canvasRef = ref;
    canvasElement = ref;
  };

  const getCanvasElement = () => canvasElement;

  return {
    canvasRef: canvasRefSetter,
    ctx: () => ctx,
    transform,
    setTransform,
    isDraggingCanvas,
    lastMouse,
    setLastMouse,
    handleMouseDown,
    handleWheel,
    handleContextMenu,
    resetView,
    resizeCanvas,
    getCanvasElement
  };
}