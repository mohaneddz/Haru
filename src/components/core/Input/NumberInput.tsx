import { JSX } from "solid-js";

interface Props {
  Value: number;
  setValue: (v: number) => void;
  placeholder?: string;
  class?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  name?: string;
}

export default function NumberInput(props: Props): JSX.Element {
  const onInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const raw = e.currentTarget.value;
    const n = raw === "" ? NaN : Number(raw);
    if (!Number.isNaN(n)) {
      props.setValue(n);
    }
  };

  return (
    <input
      type="number"
      value={String(props.Value ?? "")}
      onInput={onInput}
      placeholder={props.placeholder}
      min={props.min}
      max={props.max}
      step={props.step}
      disabled={props.disabled}
      name={props.name}
      class={`w-full rounded-md px-3 py-2 border border-border-light-2 outline-none bg-sidebar-light-2 text-text placeholder:text-muted focus:ring-2 focus:ring-accent ${props.class || ""}`.trim()}
    />
  );
}
