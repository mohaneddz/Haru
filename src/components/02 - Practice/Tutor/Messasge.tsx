import { createEffect, createSignal } from "solid-js";
import { SolidMarkdown } from "solid-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
interface MessageProps {
  text: string;
  user: boolean;
  id: number;
}

export default function Message(props: MessageProps) {

  const [displayText, setDisplayText] = createSignal("");

  createEffect(() => {
    setDisplayText(props.text);
  });

  return (
    <div
      class={`flex ${props.user ? `justify-end` : `justify-start`} my-2 mx-6 w-full`}
    >
      <div
        class={`p-4 max-w-full prose whitespace-pre-wrap [&_p]:whitespace-pre-wrap hyphens-auto px-4 rounded-lg text-lg break-words ${
          props.user ? `bg-gray-800 text-white` : `border-1 border-gray-600 bg-gray-900 text-text/90`
        }`}
        id="text"
      >
        <SolidMarkdown
          children={displayText()}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
        />
      </div>
    </div>
  );
}