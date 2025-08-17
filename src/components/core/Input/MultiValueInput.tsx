import { createSignal, For, JSX } from "solid-js";

interface Props {
  Value: string[];
  setValue: (v: string[]) => void;
  placeholder?: string;
  class?: string;
  disabled?: boolean;
  name?: string;
}

export default function MultiValueInput(props: Props): JSX.Element {
  const [draft, setDraft] = createSignal("");

  function addFromDraft() {
    const v = draft().trim();
    if (!v) return;
    const next = Array.from(new Set([...props.Value, v]));
    props.setValue(next);
    setDraft("");
  }

  function removeAt(i: number) {
    const next = props.Value.slice();
    next.splice(i, 1);
    props.setValue(next);
  }

  function onKeyDown(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFromDraft();
    } else if (e.key === "Backspace" && draft() === "" && props.Value.length > 0) {
      // quick remove last
      removeAt(props.Value.length - 1);
    }
  }

  return (
    <div class={`w-full bg-sidebar-light-2 border border-border-light-2 rounded-md text-sm text-text/70 placeholder-text/50 focus:outline-none focus:border-accent px-2 py-2 ${props.class || ""}`.trim()}>
      <div class="flex flex-wrap gap-2 w-full min-h-[2.25rem] max-h-8 overflow-y-auto pr-1">
        <For each={props.Value}>
          {(item, i) => (
            <span class="flex items-center gap-1 rounded-full bg-accent-dark-3 text-text px-2 py-1 text-xs">
              {item}
              <button
                type="button"
                class="text-muted hover:text-text"
                onClick={() => removeAt(i())}
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </span>
          )}
        </For>
        <input
          type="text"
          value={draft()}
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder={props.placeholder}
          disabled={props.disabled}
          name={props.name}
          class="flex-1 min-w-[6rem] bg-transparent outline-none text-sm text-text placeholder:text-muted px-1 py-1 overflow-y-auto resize-none"
        />
      </div>
    </div>
  );
}
