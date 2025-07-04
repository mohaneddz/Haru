import { createEffect, createSignal } from "solid-js";
import { useKatex } from "@/utils/katexSupport";
import { useMarkdown } from "@/utils/markdownSupport";

interface Props {
  text: string;
  class?: string;
}

export default function TextDisplayArea(props: Props) {
  let textContainerRef: HTMLDivElement | undefined;
  const { renderInElement } = useKatex();
  const { parse } = useMarkdown();

  const [accumulatedText, setAccumulatedText] = createSignal("");

  createEffect(() => {
    if (props.text) {
        setAccumulatedText(prev => prev + props.text);
    }
  });

  createEffect(async () => {
    if (!textContainerRef) return;

    const currentFullText = accumulatedText();

    console.log("String being sent to parse (accumulated):", currentFullText);

    if (currentFullText) {
      const htmlContent = await parse(currentFullText);
      textContainerRef.innerHTML = htmlContent;

      renderInElement(textContainerRef);
    } else {
      textContainerRef.innerHTML = '';
    }
  });

  return (
    <div
      class={`p-4 prose prose-sm max-w-full dark:prose-invert select-all whitespace-pre-wrap ${props.class || ""}`}
      id="text"
      ref={textContainerRef}
      contentEditable={false}
      data-placeholder=""
    />
  );
}