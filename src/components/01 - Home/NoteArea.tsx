// Rendering Logic 
import { onMount, onCleanup, createSignal } from "solid-js";
import { useKatex } from "@/utils/katex_support";
import { useMarkdown } from "@/utils/markdown_support";
import { TextExample } from "@/data/TextExample";

// Functions 
import { handleInput } from "@/functions/handle_input";
import { scheduleProcessing } from "@/functions/schedule_processing";
import { setupMarkdownWatcher } from "@/functions/use_markdown_watcher";
import { processContent } from "@/functions/use_process_content";

export default function NoteArea() {
  let textContainerRef: HTMLDivElement | undefined;
  const [observer, setObserver] = createSignal<MutationObserver | null>(null);
  const [isProcessing, setIsProcessing] = createSignal(false);

  const katex = useKatex();
  const markdown = useMarkdown();

  onMount(() => {
    if (!textContainerRef) return;

    textContainerRef.textContent = TextExample;
    textContainerRef.dataset.markdown = TextExample;

    processContent(textContainerRef, markdown, katex, isProcessing, setIsProcessing);

    const inputHandler = () =>
      handleInput(textContainerRef, markdown, katex, isProcessing, setIsProcessing);

    textContainerRef.addEventListener("input", inputHandler);
    textContainerRef.addEventListener("paste", () =>
      setTimeout(() => inputHandler(), 0)
    );

    const mutationObserver = setupMarkdownWatcher(textContainerRef, () => {
      if (!isProcessing()) {
        scheduleProcessing(textContainerRef, markdown, katex, isProcessing, setIsProcessing);
      }
    });

    if (mutationObserver) setObserver(mutationObserver);

    onCleanup(() => {
      textContainerRef?.removeEventListener("input", inputHandler);
      const obs = observer();
      if (obs) obs.disconnect();
    });
  });

  return (
    <div
      class="p-4 prose prose-sm max-w-none dark:prose-invert"
      id="text"
      ref={textContainerRef}
      contentEditable={false}
      data-placeholder=""
    />
  );
}
