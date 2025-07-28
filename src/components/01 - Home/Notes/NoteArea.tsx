import { Component, createEffect,  createSignal } from "solid-js";
import { SolidMarkdown } from "solid-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

interface Props {
  text: string;
  class?: string;
}

const TextDisplayArea: Component<Props> = (props) => {
  // displayText is the "batched" version of the text that we actually render.
  const [displayText, setDisplayText] = createSignal("");

  createEffect(() => {
    setDisplayText(props.text);
  });

  return (
    <div
      // This class combination is the key to the visuals:
      // prose: Base styles for markdown from Tailwind Typography.
      // whitespace-pre-wrap: Makes the browser respect newlines immediately, even in raw text.
      // [&_p]:whitespace-pre-wrap: Overrides prose's paragraph styling to also respect newlines.
      class={`p-4 max-w-full prose whitespace-pre-wrap [&_p]:whitespace-pre-wrap ${props.class || ""}`}
      id="text"
    >
      <SolidMarkdown
        // We render the displayText, which updates smoothly on our schedule.
        children={displayText()}
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      />
    </div>
  );
};

export default TextDisplayArea;