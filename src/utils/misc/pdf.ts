import * as pdfjs from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist';
import { convertFileSrc } from '@tauri-apps/api/core';

// This is a CRITICAL step.
// It tells pdf.js where to find its background processing script.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

/**
 * Generates a thumbnail for a local PDF file and returns it as a Base64 Data URL.
 * @param pdfPath The absolute path to the PDF file on the user's disk.
 * @returns A promise that resolves with the data URL (e.g., "data:image/png;base64,...").
 */
export async function generatePdfCover(pdfPath: string): Promise<string> {
  // Tauri's security model prevents direct file system access from the webview.
  // `convertFileSrc` creates a special URL that the Tauri backend will serve to the frontend.
  const assetUrl = convertFileSrc(pdfPath);

  const loadingTask = getDocument(assetUrl);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1); // Get the first page

  const scale = 1.5;
  const viewport = page.getViewport({ scale });

  // Create a temporary canvas to render the PDF page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not get 2D canvas context');
  }
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  // Render the page onto the canvas
  await page.render({ canvasContext: context, viewport }).promise;

  // Clean up the page and document to free memory
  page.cleanup();

  // Return the canvas content as a high-quality PNG data URL
  return canvas.toDataURL('image/png');
}