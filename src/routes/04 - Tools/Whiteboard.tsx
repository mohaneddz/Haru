import { onMount } from "solid-js";

export default function Whiteboard() {
  onMount(() => {
    const iframe = document.querySelector("iframe") as HTMLIFrameElement;

    iframe.onload = () => {
      const style = iframe.contentDocument?.createElement("style");
      if (style && iframe.contentDocument?.head) {
        style.innerHTML = `
          .layer-ui__wrapper__top-right {
            display: none !important;
          }
        `;
        iframe.contentDocument.head.appendChild(style);
      }
    };
  });

  return (
    <div class="w-full h-full z-50">
      <iframe
        src="http://localhost:3001"
        class="w-full h-full rounded-lg"
      />
    </div>
  );
}
