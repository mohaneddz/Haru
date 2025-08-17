import { createSignal, createEffect, onCleanup } from 'solid-js';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { invoke } from '@tauri-apps/api/core';

interface UsePDFViewerReturn {
  loading: () => boolean;
  numPages: () => number;
  currentPage: () => number;
  scale: () => number;
  setScale: (scale: number) => void;
  zoomLevels: number[];
  fitToWidth: () => boolean;
  setFitToWidth: (fit: boolean) => void;
  isFullscreen: () => boolean;
  renderingPages: () => Set<number>;
  setCanvasRef: (canvas: HTMLCanvasElement | null, pageIndex: number) => void;
  handleScroll: (e: Event) => void;
  prevPage: () => void;
  nextPage: () => void;
  gotoPage: (event: Event) => void;
  scrollToPage: (page: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  rotateClockwise: () => void;
  toggleFullscreen: () => void;
}

export function usePDFViewer(getContainer: () => HTMLDivElement, path: string): UsePDFViewerReturn {
  
  const [loading, setLoading] = createSignal(true);
  const [numPages, setNumPages] = createSignal(0);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [scale, setScale] = createSignal(1.0);
  const [fitToWidth, setFitToWidth] = createSignal(false);
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const [renderingPages, setRenderingPages] = createSignal(new Set<number>());
  const [rotation, setRotation] = createSignal(0);

  const zoomLevels = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
  
  let pdfDocument: PDFDocumentProxy | null = null;
  let canvasRefs: Map<number, HTMLCanvasElement> = new Map();
  let textLayerRefs: Map<number, HTMLDivElement> = new Map();
  let renderTasks: Map<number, any> = new Map();

  const addRenderingPage = (pageNum: number) => {
    setRenderingPages(prev => new Set([...prev, pageNum]));
  };

  const removeRenderingPage = (pageNum: number) => {
    setRenderingPages(prev => {
      const newSet = new Set(prev);
      newSet.delete(pageNum);
      return newSet;
    });
  };

  const getClosestZoomIndex = (targetScale: number): number => {
    let closestIndex = 0;
    let closestDiff = Math.abs(zoomLevels[0] - targetScale);
    
    for (let i = 1; i < zoomLevels.length; i++) {
      const diff = Math.abs(zoomLevels[i] - targetScale);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    
    return closestIndex;
  };

  const calculateFitToWidthScale = (): number => {
    const container = getContainer();
    if (!container || !pdfDocument) return 1.0;
    
    const containerWidth = container.clientWidth - 32; // Account for padding
    const pageWidth = 612; // Standard PDF page width in points
    return Math.max(0.25, Math.min(5.0, containerWidth / pageWidth));
  };

  const renderPage = async (pageNum: number, canvas: HTMLCanvasElement, textLayer?: HTMLDivElement) => {
    if (!pdfDocument || !canvas) return;

    // Cancel any existing render task for this page
    const existingTask = renderTasks.get(pageNum);
    if (existingTask) {
      existingTask.cancel();
      renderTasks.delete(pageNum);
    }

    try {
      addRenderingPage(pageNum);
      const page = await pdfDocument.getPage(pageNum);
      
      const currentScale = fitToWidth() ? calculateFitToWidthScale() : scale();
      const viewport = page.getViewport({ 
        scale: currentScale, 
        rotation: rotation() 
      });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const context = canvas.getContext('2d')!;
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // Start rendering
      const renderTask = page.render(renderContext);
      renderTasks.set(pageNum, renderTask);

      await renderTask.promise;
      renderTasks.delete(pageNum);

      // Clean up old text layer before rendering
      const oldTextLayer = canvas.parentElement?.querySelector('.textLayer');
      if (oldTextLayer) oldTextLayer.remove();

      // Render text layer for selection
      if (textLayer) {
        textLayer.innerHTML = '';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;
        textLayer.style.position = 'absolute';
        textLayer.style.top = '0';
        textLayer.style.left = '0';
        textLayer.style.pointerEvents = 'auto';
        textLayer.style.fontSize = '1px';
        textLayer.style.transformOrigin = '0 0';

        const textContent = await page.getTextContent();
        
        // Create text layer items
        textContent.items.forEach((item: any) => {
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const angle = Math.atan2(tx[1], tx[0]);
          const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
          
          const textDiv = document.createElement('div');
          textDiv.style.position = 'absolute';
          textDiv.style.left = `${tx[4]}px`;
          textDiv.style.top = `${tx[5]}px`;
          textDiv.style.fontSize = `${fontSize}px`;
          textDiv.style.fontFamily = item.fontName || 'sans-serif';
          textDiv.style.transform = `rotate(${angle}rad)`;
          textDiv.style.transformOrigin = '0 0';
          textDiv.style.color = 'transparent';
          textDiv.style.userSelect = 'text';
          textDiv.style.pointerEvents = 'auto';
          textDiv.textContent = item.str;
          
          textLayer.appendChild(textDiv);
        });
      }

      removeRenderingPage(pageNum);
    } catch (error: any) {
      if (error.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNum}:`, error);
      }
      removeRenderingPage(pageNum);
    }
  };

  const renderAllPages = () => {
    canvasRefs.forEach((canvas, pageIndex) => {
      const textLayer = textLayerRefs.get(pageIndex);
      renderPage(pageIndex + 1, canvas, textLayer);
    });
  };

  // Re-render when scale or rotation changes
  createEffect(() => {
    // Track dependencies
    scale();
    rotation(); 
    fitToWidth();
    
    if (pdfDocument && canvasRefs.size > 0) {
      renderAllPages();
    }
  });

  // Handle fit to width changes
  createEffect(() => {
    if (fitToWidth()) {
      const newScale = calculateFitToWidthScale();
      setScale(newScale);
    }
  });

  // Handle container resize for fit to width
  createEffect(() => {
    const container = getContainer();
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (fitToWidth()) {
        const newScale = calculateFitToWidthScale();
        setScale(newScale);
      }
    });

    resizeObserver.observe(container);
    
    onCleanup(() => {
      resizeObserver.disconnect();
    });
  });

  const setCanvasRef = (canvas: HTMLCanvasElement | null, pageIndex: number) => {
    if (canvas) {
      canvasRefs.set(pageIndex, canvas);
      
      // Create text layer container
      const textLayer = document.createElement('div');
      textLayer.className = 'pdf-text-layer';
      textLayer.style.position = 'absolute';
      textLayer.style.top = '0';
      textLayer.style.left = '0';
      textLayer.style.pointerEvents = 'auto';
      
      // Insert text layer after canvas
      canvas.parentNode?.insertBefore(textLayer, canvas.nextSibling);
      textLayerRefs.set(pageIndex, textLayer);
      
      // Render the page
      if (pdfDocument) {
        renderPage(pageIndex + 1, canvas, textLayer);
      }
    }
  };

  const handleScroll = (e: Event) => {
    const container = e.target as HTMLDivElement;
    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    // Calculate which page is currently visible
    let visiblePage = 1;
    const canvasElements = Array.from(canvasRefs.values());
    
    for (let i = 0; i < canvasElements.length; i++) {
      const canvas = canvasElements[i];
      const canvasTop = canvas.offsetTop - containerTop;
      const canvasHeight = canvas.offsetHeight;
      
      if (canvasTop + canvasHeight > 0 && canvasTop < containerHeight) {
        visiblePage = i + 1;
        break;
      }
    }
    
    setCurrentPage(visiblePage);
  };

  const scrollToPage = (page: number) => {
    if (page >= 1 && page <= numPages()) {
      const canvas = canvasRefs.get(page - 1);
      if (canvas) {
        canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentPage(page);
      }
    }
  };

  const prevPage = () => {
    if (currentPage() > 1) {
      scrollToPage(currentPage() - 1);
    }
  };

  const nextPage = () => {
    if (currentPage() < numPages()) {
      scrollToPage(currentPage() + 1);
    }
  };

  const gotoPage = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.querySelector('input[name="page"]') as HTMLInputElement;
    if (!input) return;
    
    let pageNum = parseInt(input.value);
    const maxPages = numPages();
    
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    else if (pageNum > maxPages) pageNum = maxPages;
    
    if (pageNum !== currentPage() && maxPages > 0) {
      scrollToPage(pageNum);
    }
  };

  const zoomIn = () => {
    const currentIndex = getClosestZoomIndex(scale());
    if (currentIndex < zoomLevels.length - 1) {
      setScale(zoomLevels[currentIndex + 1]);
      setFitToWidth(false);
    }
  };

  const zoomOut = () => {
    const currentIndex = getClosestZoomIndex(scale());
    if (currentIndex > 0) {
      setScale(zoomLevels[currentIndex - 1]);
      setFitToWidth(false);
    }
  };

  const rotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Load PDF when path changes
  createEffect(() => {
    const loadPDF = async () => {
      if (!path) return;
      
      try {
        setLoading(true);
        // Use Tauri command to read PDF file
        const pdfData = await invoke<string>('read_pdf', { path });
        const loadingTask = pdfjsLib.getDocument(pdfData);
        pdfDocument = await loadingTask.promise;
        setNumPages(pdfDocument.numPages);
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setLoading(false);
      }
    };

    loadPDF();
  });

  // Cleanup on unmount
  onCleanup(() => {
    renderTasks.forEach(task => {
      if (task) task.cancel();
    });
    renderTasks.clear();
    canvasRefs.clear();
    textLayerRefs.clear();
  });

  return {
    loading,
    numPages,
    currentPage,
    scale,
    setScale: (newScale: number) => {
      setScale(newScale);
      setFitToWidth(false);
    },
    zoomLevels,
    fitToWidth,
    setFitToWidth,
    isFullscreen,
    renderingPages,
    setCanvasRef,
    handleScroll,
    prevPage,
    nextPage,
    gotoPage,
    scrollToPage,
    zoomIn,
    zoomOut,
    rotateClockwise,
    toggleFullscreen,
  };
}