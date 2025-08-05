import { createEffect, onMount, onCleanup, createSignal } from 'solid-js';
import { useCanvas } from '@/hooks/home/useCanvas';
import { useNodes } from '@/hooks/home/useNodes';

import Concept from '@/components/01 - Home/Canvas/Concept';
import CanvasControls from '@/components/01 - Home/Canvas/CanvasControls';
import CanvasToolbar from '@/components/01 - Home/Canvas/CanvasToolbar';

import { CanvasRenderer } from '@/utils/canvas/canvaDraw';

export default function Progress() {
  const canvas = useCanvas();
  const nodeManager = useNodes();
  const [activeTooltipId, setActiveTooltipId] = createSignal<string | null>(null);

  let renderer: CanvasRenderer | null = null;

  const handleMouseMove = (e: MouseEvent): void => {
    if (nodeManager.draggedNodeId()) {
      nodeManager.handleNodeDrag(e, canvas.lastMouse(), canvas.setLastMouse, canvas.transform());
    }
  };

  const handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      nodeManager.stopNodeDrag();
    }
  };

  const handleNodeMouseDown = (e: MouseEvent, node: any): void => {
    const canvasElement = canvas.getCanvasElement?.() || null;
    nodeManager.handleNodeMouseDown(e, node, canvas.setLastMouse, canvasElement);
  };

  const handleCanvasClick = (e: MouseEvent): void => {
    // Only handle left clicks for canvas operations
    if (e.button === 0) {
      setActiveTooltipId(null);
      canvas.handleMouseDown?.(e);
    }
  };

  const handleCanvasContextMenu = (e: MouseEvent): void => {
    e.preventDefault(); // Prevent default context menu
  };

  const handleTooltipToggle = (nodeId: string | null): void => {
    setActiveTooltipId(nodeId);
  };

  // Add these handlers for node actions
  const handleDeleteNode = (nodeId: string): void => {
    console.log('Deleting node:', nodeId);
    nodeManager.deleteNode(nodeId);
    setActiveTooltipId(null);
  };

  const handleMarkNotLearned = (nodeId: string): void => {
    console.log('Marking as not learned:', nodeId);
    nodeManager.markAsNotLearned(nodeId);
    setActiveTooltipId(null);
  };

  const handleMarkLearned = (nodeId: string): void => {
    console.log('Marking as learned:', nodeId);
    nodeManager.markAsLearned(nodeId);
    setActiveTooltipId(null);
  };

  const drawCanvasContent = (): void => {
    const ctx = canvas.ctx();
    const canvasElement = canvas.getCanvasElement?.();
    if (!ctx || !canvasElement) return;

    if (!renderer) {
      renderer = new CanvasRenderer(ctx, canvasElement);
    }

    renderer.render(nodeManager.nodes(), nodeManager.connections(), canvas.transform());
  };

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  createEffect(() => {
    drawCanvasContent();
  });

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-hidden mt-8">
      <div class="w-full h-full relative bg-slate-900">
        <canvas
          ref={canvas.canvasRef}
          class="w-full h-full block"
          onMouseDown={handleCanvasClick}
          onWheel={canvas.handleWheel}
          onContextMenu={handleCanvasContextMenu}
        />

        {nodeManager.nodes().map(node => (
          <Concept
            {...node}
            transform={canvas.transform()}
            onMouseDown={handleNodeMouseDown}
            onTooltipToggle={handleTooltipToggle}
            activeTooltipId={activeTooltipId()}
            onDelete={handleDeleteNode}
            onMarkNotLearned={handleMarkNotLearned}
            onMarkLearned={handleMarkLearned}
            draggedNodeId={nodeManager.draggedNodeId()} 
          />
        ))}

        <CanvasControls transform={canvas.transform()} />

        <CanvasToolbar
          onResetView={canvas.resetView}
          onAddNode={() => {
            const canvasElement = canvas.getCanvasElement?.();
            if (canvasElement) {
              nodeManager.addNode(canvasElement, canvas.transform());
            }
          }}
        />
      </div>
    </div>
  );
}