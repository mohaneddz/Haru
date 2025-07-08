import { JSX, onCleanup, onMount } from "solid-js";
import { createSignal } from "solid-js";
import { X } from "lucide-solid";

interface Props {
  children?: JSX.Element | JSX.Element[];
  onClose?: () => void;
}

export default function Modal(props: Props) {
  let modalRef: HTMLDivElement | undefined;

  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef && !modalRef.contains(e.target as Node)) {
      props.onClose?.();
    }
  };

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));
  });

  return (
    <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-100">
      <div ref={modalRef} class="relative bg-sidebar rounded-lg p-4 shadow-lg border border-gray-600 z-101">
        <button
          onClick={props.onClose}
          class="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
        {props.children}
      </div>
    </div>
  );
}
