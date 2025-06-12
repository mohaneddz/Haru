import { Accessor } from "solid-js";

export async function processContent(
  ref: HTMLDivElement | undefined,
  markdown: { parse: (s: string) => Promise<string> },
  katex: { renderInElement: (el: HTMLElement) => void },
  isProcessing: Accessor<boolean>,
  setIsProcessing: (v: boolean) => void
) {
  if (!ref || isProcessing()) return;

  setIsProcessing(true);
  try {
    const rawMarkdown = ref.dataset.markdown || ref.textContent || "";
    if (!rawMarkdown.trim()) return;

    const htmlContent = await markdown.parse(rawMarkdown);
    const wasEditable = ref.contentEditable;
    ref.contentEditable = "false";

    ref.innerHTML = htmlContent;
    katex.renderInElement(ref);

    ref.contentEditable = wasEditable;
  } catch (error) {
    console.error("Error processing content:", error);
  } finally {
    setIsProcessing(false);
  }
}
