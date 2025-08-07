import { createSignal } from "solid-js";

export function useInlineStyle() {
  const [fullText, setFullText] = createSignal("");

  return {
    fullText,
    setFullText
  };
}