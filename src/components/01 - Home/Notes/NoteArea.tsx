import { Component, createEffect,  createSignal } from "solid-js";
import { SolidMarkdown } from "solid-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

interface Props {
  text: string;
  id: string;
  class?: string;
  editable?: boolean;
  onClick?: () => void;
}

const TextDisplayArea: Component<Props> = (props) => {
  const [displayText, setDisplayText] = createSignal("");

  createEffect(() => {
    setDisplayText(props.text);
  });

  return (
    <div
      class={`w-full text-text-light rounded-md p-2 focus:outline-none focus:ring-none focus:ring-primary transition-colors duration-200 cursor-text ${props.class || ""}`} onclick={props.onClick}
      id={props.id}
    >
      <SolidMarkdown
        children={displayText()}
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      />
    </div>
  );
};

export default TextDisplayArea;