interface CanvasToolbarProps {
  onResetView: () => void;
  onAddNode: () => void;
}

export default function CanvasToolbar(props: CanvasToolbarProps) {
  return (
    <div class="flex gap-4 items-center justify-center absolute top-8 right-4 z-50">
      <button
        class="bg-accent hover:bg-accent-dark-1 active:bg-accent-dark-3 cursor-pointer hover:scale-102 active:scale-97 text-text px-4 py-2 rounded-lg transition-colors"
        onClick={props.onResetView}
      >
        Reset View
      </button>

      <button
        class="bg-sidebar-light-2 hover:bg-sidebar-light-1 active:bg-sidebar cursor-pointer hover:scale-102 active:scale-97 text-text px-4 py-2 rounded-lg transition-colors"
        onClick={props.onAddNode}
      >
        Add Node
      </button>
    </div>
  );
}