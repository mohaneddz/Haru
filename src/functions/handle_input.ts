import { scheduleProcessing } from "./schedule_processing";

export function handleInput(
  ref: HTMLDivElement | undefined,
  markdown: any,
  katex: any,
  isProcessing: any,
  setIsProcessing: any
) {
  if (!ref) return;
  const rawContent = ref.textContent || "";
  ref.dataset.markdown = rawContent;
  scheduleProcessing(ref, markdown, katex, isProcessing, setIsProcessing);
}
