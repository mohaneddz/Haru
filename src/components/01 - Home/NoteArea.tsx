import { createEffect } from "solid-js";

interface Props {
  text: string;
  class?: string;

}

export default function TextDisplayArea(props: Props) {
  let textContainerRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!textContainerRef) return;
    const htmlContent = props.text.replace(/\n/g, '<br>');
    textContainerRef.innerHTML = htmlContent;
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