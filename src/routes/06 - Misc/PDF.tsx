import TopBar from "@/components/06 - Misc/PDF/TopBar";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import { usePDFViewer } from "@/hooks/misc/usePDFViewer";
import { createEffect } from "solid-js";
import { useLocation } from '@solidjs/router';

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

export default function PDF() {
  let containerRef!: HTMLDivElement;
  const location = useLocation();

  // Extract and decode path key from URL
  const urlParams = new URLSearchParams(location.search);
  const encodedPath = urlParams.get('path') || '';
  const path = decodeURIComponent(encodedPath);

  const pdfViewer = usePDFViewer(() => containerRef, path);

  // Add CSS for text selection
  createEffect(() => {
    const style = document.createElement('style');
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  });

  return (
    <div
      ref={el => (containerRef = el)}
      class={`h-full w-full flex flex-col bg-gray-900 ${pdfViewer.isFullscreen() ? 'fixed inset-0 z-50' : ''}`}
    >
      <TopBar
        currentPage={pdfViewer.currentPage}
        loading={pdfViewer.loading}
        numPages={pdfViewer.numPages}
        zoomLevels={pdfViewer.zoomLevels}
        scale={pdfViewer.scale}
        setScale={pdfViewer.setScale}
        fitToWidth={pdfViewer.fitToWidth}
        setFitToWidth={pdfViewer.setFitToWidth}
        prevPage={pdfViewer.prevPage}
        nextPage={pdfViewer.nextPage}
        gotoPage={pdfViewer.gotoPage}
        zoomIn={pdfViewer.zoomIn}
        zoomOut={pdfViewer.zoomOut}
        rotateClockwise={pdfViewer.rotateClockwise}
        toggleFullscreen={pdfViewer.toggleFullscreen}
      />

      {/* PDF Content Area */}
      <div
        class="pdf-content-area flex-1 overflow-auto bg-gray-900 p-4 z-40"
        onScroll={pdfViewer.handleScroll}
      >
        <div class="flex flex-col items-center space-y-4">
          {pdfViewer.loading() && (
            <div class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 ">
              <div class="text-text text-lg">Loading PDF...</div>
            </div>
          )}
          {Array.from({ length: pdfViewer.numPages() }, (_, i) => i + 1).map(pageNumber => (
            <div class="pdf-page-container relative">
              <div class="absolute -bottom-3 left-0 text-gray-400 text-sm z-10">
                Page {pageNumber}
              </div>
              <canvas
                ref={el => pdfViewer.setCanvasRef(el, pageNumber - 1)}
                class="border border-gray-600 rounded-lg shadow-2xl bg-white max-w-full mb-2 block z-50"
                style="z-index: 1; position: relative;"
              />
              {pdfViewer.renderingPages().has(pageNumber) && (
                <div class="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded-lg z-70">
                  <div class="text-text text-sm">Rendering...</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}