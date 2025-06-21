import { createEffect } from "solid-js";
import { useKatex } from "@/utils/katex_support";
import { useMarkdown } from "@/utils/markdown_support";

interface Props {
  text: string;
  class?: string;
}

export default function TextDisplayArea(props: Props) {
  let textContainerRef: HTMLDivElement | undefined;
  const { renderInElement } = useKatex();
  const { parse } = useMarkdown();

  createEffect(async () => {
    if (!textContainerRef) return;
    
    // Parse markdown first (which preserves LaTeX as script tags)
    const htmlContent = await parse(props.text);
    textContainerRef.innerHTML = htmlContent;
    
    // Then render LaTeX/KaTeX from the script tags and any remaining LaTeX
    renderInElement(textContainerRef);
  });

  return (
    <div
      class={`p-4 prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap ${props.class || ""}`}
      id="text"
      ref={textContainerRef}
      contentEditable={false}
      data-placeholder=""
    />
  );
}