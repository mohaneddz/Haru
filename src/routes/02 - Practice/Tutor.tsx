import { Paperclip, Send } from "lucide-solid"; 
import { For } from "solid-js"; 
import Message from "@/components/02 - Practice/Tutor/Messasge";
import useTutor from "@/hooks/training/useTutor";

export default function Tutor() {

  const { messages, currText, setCurrText, isLoading, handleSend, messageContainerRef } = useTutor();

  return (
    <section class="w-full h-full flex flex-col items-center justify-end p-4 pb-12 mx-auto">
      <div
        id="message-container"
        ref={messageContainerRef}
        class="max-h-full mt-8 flex-col w-full px-[10%] flex flex-nowrap items-center justify-start relative rounded-md mb-4 overflow-y-auto overflow-x-hidden"
      >
        <For each={messages()}>
          {(message) => <Message text={message.text} user={message.user} id={message.id} />}
        </For>

        {/* {isLoading() && <TypingIndicator />} */}
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
              // if (isLoading()) {
              //   handleStop();
              // } else {
              //   handleSend();
              // }
              if (!isLoading()) {
                handleSend();
              }
              return;
            }
          }}
        />

        <div class="flex items-center justify-between w-full mt-4">
          <div class="bg-gray-700 p-2 rounded-md mx-4">
            <Paperclip class="text-text-light-2" size={20} />
          </div>

          <button
            class={`bg-gray-700 p-2 rounded-md mx-4 cursor-pointer ${isLoading() ? "opacity-50 cursor-not-allowed" : ""
              }`}
            onClick={handleSend}
            disabled={currText().trim() === "" || isLoading()}
          >
            {/* {isLoading() ? (
              <XCircle class="text-white" size={20} /> 
            ) : ( */}
            <Send class="text-text-light-2" size={20} />
            {/* )} */}
          </button>
        </div>
      </div>
    </section>
  );
}