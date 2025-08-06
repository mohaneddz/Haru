import { Paperclip, Send, Mic, Globe } from "lucide-solid";
import Chat from "@/components/02 - Practice/Tutor/Chat";
import useTutor from "@/hooks/training/useTutor";
import { Show } from "solid-js";
import Sphere from "@/components/02 - Practice/Tutor/Shpere";

export default function Tutor() {
  // useTutor manages the non-voice state
  const { messages, currText, transcript, voice, toggleVoice, voiceStatus, response, setCurrText, isLoading, handleSend, messageContainerRef, web, toggleWeb, rag, toggleRag, mode, setMode, newChat } = useTutor();

  return (
    <section class="w-full h-full flex flex-col items-center justify-end p-4 pb-12 mx-auto transition duration-300">

      <Show when={!voice()} fallback={<Sphere />}>
        {/* Standard Chat UI */}
        <Chat
          messages={messages}
          messageContainerRef={messageContainerRef}
          newChat={newChat}
          isLoading={isLoading}
          setMode={setMode}
          mode={mode}
        />
      </Show>

      {/* This is the new, clean display for voice mode */}
      <Show when={voice()}>
        <div class="flex-grow flex flex-col justify-center items-center w-[80%] text-center px-4">
            {/* Display the user's transcribed text */}
            <p class="text-2xl text-text-light-2/60 transition-opacity duration-300"
               classList={{ 'opacity-100': !!transcript(), 'opacity-0': !transcript() }}>
              {/* {transcript()} */}
            </p>

            {/* Display the assistant's response text */}
            <p class="mt-6 text-xl font-semibold text-text-light-2 transition-opacity duration-300 absolute bottom-[30%] w-full text-center max-w-[50%]"
                 classList={{ 'opacity-100': !!response(), 'opacity-0': !response() }}               >
              {response()}
            </p>
        </div>
      </Show>

      {/* The input bar at the bottom */}
      <div class="bg-background-light-3/25 h-max w-[80%] rounded-md bottom-20 text-center flex flex-wrap items-center py-4 transition duration-300">

        <textarea
          class="text-lg pt-4 px-8 text-text-light-2/70 font-bold m-auto flex-1 outline-none h-max focus:outline-none focus:ring-0 focus:border-transparent text-wrap bg-transparent resize-none transition duration-300"
          // In voice mode, display the live transcript or status. Otherwise, show the user's input.
          value={voice() ? transcript() : currText()}
          // In voice mode, show status. Otherwise, show standard placeholder.
          placeholder={voice() ? voiceStatus() : isLoading() ? "Bot is typing..." : "Type your message here..."}
          // Make the textarea read-only in voice mode
          readOnly={voice()}
          onInput={(e) => {
            // Only allow input when not in voice mode
            if (!voice()) {
              setCurrText(e.currentTarget.value);
            }
          }}
          onKeyDown={(e) => {
            // Only handle Enter key when not in voice mode
            if (voice()) return;
            if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) return;
            if (e.key === "Enter") {
              e.preventDefault();
              if (!isLoading()) handleSend();
            }
          }}
        />

        <div class={`flex items-center justify-between w-full mt-4 z-50 gap-2 transition duration-300`}>
          <div class="flex gap-4 w-min mx-4 transition duration-300">

            {/* Voice toggle button */}
            <button class={`p-2 rounded-md clickable transition duration-300 ${voice() ? "bg-accent animate-pulse" : "bg-gray-700"}`} onClick={toggleVoice} >
              <Mic size={20} />
            </button>

            {/* Other buttons are hidden in voice mode for a cleaner look */}
            <button class={`p-2 rounded-md clickable transition duration-300 ${rag() ? "bg-accent" : "bg-gray-700"} ${voice() ? "opacity-0 cursor-default" : ""}`} onClick={toggleRag} >
              <Paperclip size={20} />
            </button>

            <button class={`p-2 rounded-md clickable transition duration-300 ${web() ? "bg-accent" : "bg-gray-700"} ${voice() ? "opacity-0 cursor-default" : ""}`} onClick={toggleWeb}>
              <Globe size={20} />
            </button>
          </div>

          {/* Send button is also hidden in voice mode */}
          <button class={`bg-gray-700 p-2 rounded-md mx-4 transition duration-300 ${isLoading() ? "cursor-not-allowed" : "clickable"} ${voice() ? "opacity-0 cursor-default" : ""}`} onClick={handleSend} disabled={currText().trim() === "" || isLoading()}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}