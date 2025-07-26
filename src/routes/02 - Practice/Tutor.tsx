import { Paperclip, Send } from "lucide-solid"; // Removed XCircle since stopping is disabled
import TextDisplayArea from "@/components/01 - Home/Notes/NoteArea";
import { createSignal, For, createEffect, onCleanup } from "solid-js"; // Import onCleanup

interface MessageData {
  id: number;
  text: string;
  user: boolean;
}

function Message(props: { text: string; user: boolean }) {
  return (
    <div
      class={`flex ${props.user ? `justify-end` : `justify-start`} my-2 mx-6 w-full`}
    >
      <TextDisplayArea
        class={`max-w-[80%] hyphens-auto px-4 rounded-lg text-lg break-words ${
          props.user ? `bg-gray-800 text-white` : `border-1 border-gray-600 bg-gray-900 text-text/90`
        } `}
        text={props.text}
      />
    </div>
  );
}

export default function Tutor() {
  const [currText, setCurrText] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [messages, setMessages] = createSignal<MessageData[]>([
    {
      id: Date.now(),
      text: "Hello There, how can I help you today?",
      user: false,
    },
  ]);

  let messageContainerRef: HTMLDivElement | undefined;
  let abortController = new AbortController(); // Initialize AbortController

  createEffect(() => {
    messages();
    if (messageContainerRef) {
      setTimeout(() => {
        messageContainerRef.scrollTop = messageContainerRef.scrollHeight;
      }, 0);
    }
  });

  // Cleanup on component unmount
  onCleanup(() => {
    abortController.abort(); // Abort any ongoing fetch request
  });

  // const handleStop = () => {
  //   if (isLoading()) {
  //     console.log("Stopping current bot response...");
  //     abortController.abort(); 
  //     // setIsLoading(false); UNTILL I FIX // the issue of stopping the response, we don't set isLoading to false here.
  //   }
  // };

const handleSend = async () => {
  // --- FIX START ---
  // If a response is already being generated, abort that request so we can start a new one.
  // We no longer return from the function here.
  // if (isLoading()) {
  //   console.log("Interrupting previous bot response to send a new message.");
  //   abortController.abort();
  // }
  // --- FIX END ---

  const messageText = currText().trim();
  if (!messageText) return;

  // Prevent sending new message while loading (normal behavior)
  if (isLoading()) return;

  setIsLoading(true);
  setCurrText("");

  // Add the new user message to the UI
  const newUserMessage: MessageData = {
    id: Date.now(),
    text: messageText,
    user: true,
  };
  setMessages((prev) => [...prev, newUserMessage]);
  
  // --- IMPORTANT IMPROVEMENT ---
  // Get the history *before* the new user message was added.
  const currentMessagesForHistoryProcessing = messages().slice(0, -1);

  // Re-initialize AbortController for the NEW request. This is correct.
  abortController = new AbortController();
  const signal = abortController.signal;

  // This part of your code for history processing is fine.
  const historyForBackend: { role: string; content: string }[] = [];
  let lastRoleInHistory: "user" | "assistant" | null = null;
  for (const msg of currentMessagesForHistoryProcessing) {
    const currentRole = msg.user ? "user" : "assistant";
    if (historyForBackend.length === 0 && currentRole === "assistant") {
      continue;
    }
    if (lastRoleInHistory === null || currentRole !== lastRoleInHistory) {
      historyForBackend.push({ role: currentRole, content: msg.text });
      lastRoleInHistory = currentRole;
    } else {
      console.warn(
        `Skipping history message for LLM due to non-alternating role: ${msg.text.substring(0,50)}...`
      );
    }
  }

  const botMessageId = Date.now() + 1;

  try {
    const response = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: messageText,
        history: historyForBackend,
      }),
      signal,
    });

    if (!response.ok || !response.body) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        setMessages((prev) => [
          ...prev.slice(0, -1), // Remove the last user message
          {
            id: Date.now(),
            text: `Error: ${errorText || "Failed to get response."}`,
            user: false,
          },
        ]);
        setIsLoading(false);
        return;
    }

    setMessages((prev) => [
      ...prev,
      { id: botMessageId, text: "", user: false },
    ]);

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedResponse = "";

    while (true) {
      if (signal.aborted) {
        console.log("Stream reading stopped due to new request.");
        break;
      }

      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.substring(6);
          accumulatedResponse += data;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, text: accumulatedResponse }
                : msg
            )
          );
        }
      }
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Fetch aborted successfully by the user's new action.");
    } else {
      console.error("Network or processing error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: Date.now(),
          text: `Network Error: ${error.message}`,
          user: false,
        },
      ]);
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <section class="w-full h-full flex flex-col items-center justify-end p-4 pb-24 mx-auto">
      <div
        id="message-container"
        ref={messageContainerRef}
        class="max-h-full mt-8 flex-col w-[80%] flex flex-nowrap items-center justify-start relative rounded-md mb-4 overflow-y-auto overflow-x-hidden"
      >
        <For each={messages()}>
          {(message) => <Message text={message.text} user={message.user} />}
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
            class={`bg-gray-700 p-2 rounded-md mx-4 cursor-pointer ${
              isLoading() ? "opacity-50 cursor-not-allowed" : "" 
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