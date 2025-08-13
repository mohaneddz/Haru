import { For, Show } from "solid-js";

import Chat from "@/components/02 - Practice/Tutor/Chat";
import Sphere from "@/components/02 - Practice/Tutor/Shpere";
import useTutor from "@/hooks/training/useTutor";
import useChat from "@/hooks/home/useChat";
import Globe from "lucide-solid/icons/globe";
import Mic from "lucide-solid/icons/mic";
import Paperclip from "lucide-solid/icons/paperclip";
import Send from "lucide-solid/icons/send";
import XCircle from "lucide-solid/icons/x-circle";

export default function Tutor() {
  const {
    messages, currText, transcript, voice, toggleVoice, voiceStatus, setCurrText, isLoading, handleSend, web, toggleWeb,
    rag, toggleRag, mode, setMode, newChat, images, removeImage, addImage,
  } = useTutor();

  // Helper to get the latest assistant message as the live response
  const latestAssistantText = () => {
    const arr = messages();
    for (let i = arr.length - 1; i >= 0; i--) {
      if (!arr[i].user) return arr[i].text || "";
    }
    return "";
  };

  const { setTextareaRef, handlePastedContent } = useChat({ currText, setCurrText, addImage });

  const messageContainerRef = (ref: HTMLDivElement) => ref;

  return (
    <section class="w-full h-full flex flex-col items-center justify-end p-4 pb-12 mx-auto transition duration-300">

      <Show when={!voice()} fallback={<Sphere />}>
        <Chat
          messages={messages}
          messageContainerRef={messageContainerRef}
          newChat={newChat}
          isLoading={isLoading}
          setMode={setMode}
          mode={mode}
        />
      </Show>

      <Show when={voice()}>
        <div class="flex-grow flex flex-col justify-center items-center w-[80%] text-center px-4">

          <p
            class="mt-6 text-md font-semibold text-text-light-2 transition-opacity duration-300 absolute bottom-[30%] w-full text-center max-w-[50%] max-h-30 overflow-y-auto z-50"
            classList={{ 'opacity-100': !!latestAssistantText(), 'opacity-0': !latestAssistantText() }}
          >
            {latestAssistantText()}
          </p>
        </div>
      </Show>

      <div class="bg-background-light-3/25 h-max w-[80%] rounded-md bottom-20 text-center flex flex-wrap items-center py-4 transition duration-300">

        <textarea
          ref={setTextareaRef}
          class="text-lg pt-4 px-8 text-text-light-2/70 font-bold m-auto flex-1 outline-none h-max focus:outline-none focus:ring-0 focus:border-transparent text-wrap bg-transparent resize-none transition duration-300"
          value={voice() ? transcript() : currText()}
          placeholder={voice() ? voiceStatus() : isLoading() ? "Bot is typing..." : "Type your message here..."}
          readOnly={voice()}
          onInput={(e) => {
            if (!voice()) {
              setCurrText(e.currentTarget.value);
            }
          }}
          onKeyDown={async (e) => {
            if (voice()) return;
            if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) return;
            if (e.key === "Enter") {
              e.preventDefault();
              if (!isLoading()) handleSend();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
              e.preventDefault();
              handlePastedContent();
            }
          }}
        />

        <div class={`flex items-center justify-between w-full mt-4 z-50 gap-2 transition duration-300`}>
          <div class="flex gap-4 w-min mx-4 transition duration-300">

            <button
              class={`p-2 rounded-md clickable transition duration-300 ${voice() ? "bg-accent animate-pulse" : "bg-gray-700"}`}
              onClick={toggleVoice}
            >
              <Mic size={20} />
            </button>

            <button
              class={`p-2 rounded-md clickable transition duration-300 ${rag() ? "bg-accent" : "bg-gray-700"} ${voice() ? "opacity-0 cursor-default" : ""}`}
              onClick={toggleRag}
            >
              <Paperclip size={20} />
            </button>

            <button
              class={`p-2 rounded-md clickable transition duration-300 ${web() ? "bg-accent" : "bg-gray-700"} ${voice() ? "opacity-0 cursor-default" : ""}`}
              onClick={toggleWeb}
            >
              <Globe size={20} />
            </button>
          </div>

          <div class="flex w-full gap-4">
            <For each={images()}>{(image, index) => (
              <div class="relative group center">
                <img
                  src={image}
                  class="max-w-full h-auto rounded-md max-h-8 transition duration-300 group-hover:brightness-40 cursor-pointer"
                  data-index={index()}
                  onClick={() => removeImage(index())}
                />
                <XCircle
                  class="absolute m-1 cursor-pointer opacity-0 group-hover:opacity-100 transition duration-300"
                  size={16}
                  onClick={() => removeImage(index())}
                />
              </div>
            )}</For>
          </div>

          <button
            class={`bg-gray-700 p-2 rounded-md mx-4 transition duration-300 ${(!currText().trim() && images().length === 0) || isLoading() ? "cursor-not-allowed" : "clickable"} ${voice() ? "opacity-0 cursor-default" : ""}`}
            onClick={handleSend}
            disabled={(!currText().trim() && images().length === 0) || isLoading()}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
