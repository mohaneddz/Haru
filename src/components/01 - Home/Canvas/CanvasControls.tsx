import { Transform } from '@/types/home/roadmap';

interface CanvasControlsProps {
  transform: Transform;
}

export default function CanvasControls(props: CanvasControlsProps) {
  // remove after 7 seconds and only keep the zoom
  setTimeout(() => {
    const controls = document.querySelector('.canvas-controls');
    if (controls) {
      controls.remove();
    }
  }, 100);


  return (
    <div class="absolute top-8 left-4 bg-black bg-opacity-50 text-text p-3 rounded-lg text-sm z-10" id='canvas-controls'>
      <div class="font-semibold mb-2">Canvas Controls:</div>
      <div>• Left click + drag: Pan canvas or Drag nodes</div>
      <div>• Mouse wheel: Zoom in/out</div>
      <div>• Zoom: {Math.round(props.transform.scale * 100)}%</div>
    </div>
  );
}