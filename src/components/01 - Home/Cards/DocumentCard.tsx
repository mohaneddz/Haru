import { For, onMount, createSignal } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
// 1. Import pdf.js
import * as pdfjsLib from 'pdfjs-dist';

// 2. Set the path to the pdf.js worker. This is essential for it to work.
// This CDN link is the easiest setup.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  title: string;
  description: string;
  icon: string;
  type: string;
  href?: string;
  offline?: boolean;
  tags?: string[];
}

export default function DocumentCard(props: Props) {
  // A reference to the canvas element we will render on
  let canvasRef: HTMLCanvasElement | undefined;

  const pdfPath = props.href || 'D:\\Programming\\Projects\\Tauri\\haru\\public\\pdf\\example.pdf';
  console.log('PDF Path:', pdfPath, ' recieved: ', props.title);
  const encodedPath = encodeURIComponent(pdfPath);

  onMount(async () => {
    if (!canvasRef) return;

    try {
      // Use the existing Rust command. It now returns Base64.
      // NOTE: You have 'generate_pdf_thumbnail' in your JS but the Rust function
      // is 'get_pdf_first_page'. Make sure they match. I'll use 'get_pdf_first_page'.
      const base64 = await invoke<string>('get_pdf_first_page', { pdfPath });

      // Decode the Base64 string into a byte array that pdf.js can read
      const pdfData = atob(base64);
      const pdfBytes = new Uint8Array(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) {
        pdfBytes[i] = pdfData.charCodeAt(i);
      }

      // Load the PDF data using pdf.js
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1); // Get the first (and only) page

      // Prepare the canvas to match the PDF page's aspect ratio
      const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale for quality
      const context = canvasRef.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      canvasRef.height = viewport.height;
      canvasRef.width = viewport.width;

      // Render the PDF page onto the canvas
      await page.render({ canvasContext: context, viewport }).promise;

    } catch (err) {
      console.error('Thumbnail generation failed:', err);
    }
  });

  return (
    <a
      href={`/pdf?path=${encodedPath}`}
      class="p-0.5 bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md hover:shadow-lg transition duration-150 hover:scale-105 active:scale-100 overflow-hidden group w-full max-w-[280px] h-[360px]"
    >
      <div class="relative rounded-lg overflow-hidden bg-background-light-3 w-full h-full transition-shadow duration-300 group-hover:shadow-[0_0_15px_2px_rgba(255,255,255,0.1)]">

        {/* Use a canvas element instead of an img element for the thumbnail */}
        <canvas
          ref={canvasRef}
          class="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Gradient overlay to ensure text is readable */}
        <div
          class="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{
            "background": "linear-gradient(0deg, rgba(30,30,40,1) 0%, rgba(30,30,40,0.7) 25%, rgba(0,0,0,0.0) 40%)"
          }}
        />

        {/* The rest of your component remains exactly the same */}
        <div class="absolute top-0 right-2 z-20">
          <span class={`text-[0.6rem] font-medium px-2 py-0.5 bg-black/60 rounded uppercase ${props.offline ? 'text-accent' : 'text-gray-300'}`}>
            {props.type ? props.type : 'Document'}
          </span>
        </div>

        <div class="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 flex flex-col gap-2 translate-y-8 group-hover:-translate-y-4 transition-transform duration-300">
          <p class="text-sm text-nowrap  font-bold text-accent line-clamp-2 transition-colors">
            {props.title}
          </p>
          <p class="text-[0.75rem] text-gray-300 line-clamp-2  truncate w-[80%]">
            {props.description}
          </p>

          {props.tags && props.tags.length > 0 && (
            <div class="flex-wrap gap-1 mt-1 flex transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
              <For each={props.tags.slice(0, 2)}>
                {(tag) => (
                  <span class="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                    {tag}
                  </span>
                )}
              </For>
              {props.tags.length > 3 && (
                <span class="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
                  +{props.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}