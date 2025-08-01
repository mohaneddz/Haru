import { Paperclip, Send } from "lucide-solid";
import { For } from "solid-js";
import Message from "@/components/02 - Practice/Tutor/Messasge";
import useTutor from "@/hooks/training/useTutor";
import { Globe } from "lucide-solid";

export default function Tutor() {

  const { messages, currText, setCurrText, isLoading, handleSend, messageContainerRef, web, toggleWeb, rag, toggleRag, mode, setMode, newChat } = useTutor();

  return (
    <section class="w-full h-full flex flex-col items-center justify-end p-4 pb-12 mx-auto">

      <div class="absolute top-8 left-4 flex flex-col justify-center z-50">

        <select class="mb-4 backdrop:blur-lg focus:outline-none focus:ring-0" onChange={(e) => setMode(e.currentTarget.value)} value={mode()}>
          <option value="tutor" class="bg-background-light-1">General</option>
          <option value="explorer" class="bg-background-light-1">Explorer</option>
          <option value="objective" class="bg-background-light-1">Objective</option>
        </select>

        <p class="text-text-light-2 text-sm clickable w-min text-nowrap" onClick={newChat}>New Chat</p>

      </div>


      <div
        id="message-container"
        ref={messageContainerRef}
        class="max-h-full mt-8 flex-col w-full px-[10%] flex flex-nowrap items-center justify-start relative rounded-md mb-4 overflow-y-auto overflow-x-hidden"
      >
        <For each={messages()}>
          {(message) => <Message text={message.text} user={message.user} id={message.id} sources={message.sources} showSources={!isLoading() || message.id < messages().length } />}
        </For>

      </div>


      <div class="bg-background-light-3/25 h-max w-[80%] rounded-md bottom-20 text-center flex flex-wrap items-center py-4">

        <textarea
          class="text-lg pt-4 px-8 text-text-light-2/70 font-bold m-auto flex-1/1 outline-none h-max focus:outline-none focus:ring-0 focus:border-transparent text-wrap bg-transparent resize-none"
          placeholder={isLoading() ? "Bot is typing..." : "Type your message here..."}
          value={currText()}
          onFocus={(e) => (e.currentTarget.placeholder = "")}
          onInput={(e) => {
            setCurrText(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (!isLoading()) {
                handleSend();
              }
              return;
            }
          }}
        />

        <div class="flex items-center justify-between w-full mt-4 z-50">

          <div class="flex gap-4 w-min mx-4">

            <button class={` p-2 rounded-md clickable ${rag() ? "bg-accent" : "bg-gray-700"}`} onClick={toggleRag} >
              <Paperclip size={20} />
            </button>

            <button class={` p-2 rounded-md clickable ${web() ? "bg-accent" : "bg-gray-700"}`} onClick={toggleWeb}>
              <Globe size={20} />
            </button>

          </div>

          <button class={`bg-gray-700 p-2 rounded-md mx-4 ${isLoading() ? "cursor-not-allowed" : "clickable"}`} onClick={handleSend} disabled={currText().trim() === "" || isLoading()}>
            <Send size={20} />
          </button>

        </div>

      </div>
    </section>
  );
}