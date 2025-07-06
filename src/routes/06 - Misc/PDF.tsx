import TopBar from "@/components/06 - Misc/PDF/TopBar";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import { usePDFViewer } from "@/hooks/content/usePDFViewer";
import { createEffect } from "solid-js";

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

export default function PDF() {
  let containerRef!: HTMLDivElement;
  const pdfViewer = usePDFViewer(() => containerRef);

  // Add CSS for text selection
  createEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pdf-page-container {
        position: relative;
        display: inline-block;
        margin-bottom: 20px;
      }
      
      .pdf-text-layer {
        position: absolute;
        top: 0;
        left: 0;
        color: transparent;
        user-select: text;
        pointer-events: auto;
        z-index: 2;
      }
      
      .pdf-text-layer::selection {
        background: rgba(0, 123, 255, 0.3);
      }
      
      .pdf-text-layer::-moz-selection {
        background: rgba(0, 123, 255, 0.3);
      }
      
      .pdf-text-layer div {
        position: absolute;
        color: transparent;
        user-select: text;
        pointer-events: auto;
        white-space: nowrap;
        transform-origin: 0 0;
      }
      
      .pdf-text-layer div::selection {
        background: rgba(0, 123, 255, 0.3);
        color: transparent;
      }
      
      .pdf-text-layer div::-moz-selection {
        background: rgba(0, 123, 255, 0.3);
        color: transparent;
      }
    `;
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
              <div class="text-white text-lg">Loading PDF...</div>
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
                  <div class="text-white text-sm">Rendering...</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}