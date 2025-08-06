import { Show, createEffect } from "solid-js";

interface ContextMenuProps {
    visible: boolean;
    x: number;
    y: number;
    context: "background" | "file" | "folder";
    onClose: () => void;
    onAction: (action: string) => Promise<void>;
    items?: { label: string; action: string }[];
}

export default function ContextMenu(props: ContextMenuProps) {
    let menuRef: HTMLDivElement | undefined;

    // Close menu on click outside
    function handleClick(e: MouseEvent) {
        if (menuRef && !menuRef.contains(e.target as Node)) props.onClose();
    }

    // Use SolidJS effect for event listener management
    createEffect(() => {
        if (props.visible) {
            window.addEventListener("mousedown", handleClick);
            return () => window.removeEventListener("mousedown", handleClick);
        }
    });

    return (
        <Show when={props.visible}>
            <div
                ref={el => menuRef = el}
                style={{
                    top: `${props.y}px`,
                    left: `${props.x}px`,
                }}
                class="fixed bg-background text-text rounded-lg shadow-lg w-max overflow-hidden z-9999"
            >
                {(props.items ?? []).map(item => (
                    <div
                        class="px-4 py-2 cursor-pointer border-b border-neutral-700 last:border-b-0 hover:bg-neutral-700 transition select-none"
                        onClick={async () => {
                            await props.onAction(item.action);
                            props.onClose();
                        }}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </Show>
    );
}