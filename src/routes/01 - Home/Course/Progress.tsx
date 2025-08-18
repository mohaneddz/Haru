import Concept from '@/components/01 - Home/Canvas/ConceptNode';
import CanvasControls from '@/components/01 - Home/Canvas/CanvasControls';
import CanvasToolbar from '@/components/01 - Home/Canvas/CanvasToolbar';

import useProgress from '@/hooks/home/useProgress';

import Earth from 'lucide-solid/icons/earth';
import Check from 'lucide-solid/icons/check';

import { Show } from 'solid-js';

export default function Progress() {
  const {
    canvas,
    nodeManager,
    activeTooltipId,
    handleCanvasClick,
    handleCanvasContextMenu,
    handleNodeMouseDown,
    handleTooltipToggle,
    handleDeleteNode,
    handleMarkNotLearned,
    handleMarkLearned,
    createConcepts,
    changed,
    saveConcepts,
  } = useProgress();

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-hidden mt-8">
      <div class="w-full h-full relative bg-background brightness-75">
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
      <Show
        when={changed()}
        fallback={
          <div
            class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-8 bg-primary rounded-full p-2 hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
            onClick={createConcepts}
          >
            <Earth class="w-6 h-6 text-text " />
          </div>
        }
      >
        <div
          class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-8 bg-primary rounded-full p-2 hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
          onClick={saveConcepts}
        >
          <Check class="w-6 h-6 text-text " />
        </div>
      </Show>
    </div>
  );
}