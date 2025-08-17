import { JSX } from "solid-js";

interface Props {
  Value: string;
  setValue: (v: string) => void;
  placeholder?: string;
  class?: string;
  rows?: number;
  disabled?: boolean;
  name?: string;
}

export default function Textarea(props: Props): JSX.Element {
  return (
    <textarea
      value={props.Value}
      onInput={(e) => props.setValue(e.currentTarget.value)}
      placeholder={props.placeholder}
      rows={props.rows ?? 4}
      disabled={props.disabled}
      name={props.name}
      class={`w-full resize-y rounded-md px-3 py-2 border border-border-light-2 outline-none bg-sidebar-light-2 text-sm text-text placeholder:text-muted focus:ring-2 focus:ring-accent ${props.class || ""}`.trim()}
    />
  );
}
