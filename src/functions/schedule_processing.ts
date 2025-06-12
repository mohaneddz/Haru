import { processContent } from "./use_process_content";

let processingTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleProcessing(
  ref: HTMLDivElement | undefined,
  markdown: any,
  katex: any,
  isProcessing: any,
  setIsProcessing: any
) {
  if (processingTimeout) clearTimeout(processingTimeout);

  processingTimeout = setTimeout(() => {
    processContent(ref, markdown, katex, isProcessing, setIsProcessing);
  }, 500);
}
