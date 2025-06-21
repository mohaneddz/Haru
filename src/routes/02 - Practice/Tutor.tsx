import { Paperclip, Send } from "lucide-solid";
import TextDisplayArea from "@/components/01 - Home/NoteArea";
import { createSignal, For } from "solid-js";

interface MessageProps {
  text: string;
  user?: boolean;
}

interface MessageData {
  id: number;
  text: string;
  user: boolean;
}

function Message(props: MessageProps) {
  return <div class={`flex-1 ${props.user ? `ml-auto` : `mr-auto`} flex items-center justify-between my-2 mx-6`}>
    <TextDisplayArea class={`w-max px-4 rounded justify-self-end ${props.user ? ` bg-gray-800` : ` border-1 border-text/40`} `} text={props.text} />
  </div>;
}

export default function Tutor() {

  const [currText, setCurrText] = createSignal("");
  const [messages, setMessages] = createSignal<MessageData[]>([
    { id: 1, text: "Hello boty boty!", user: true },
    { id: 2, text: "Hello, how can I help you today?", user: false },
    { id: 3, text: "How many R's in straberry?", user: true },
  ]);

  let messageContainerRef: HTMLDivElement | undefined;

  const handleSend = () => {
    const messageText = currText().trim();
    if (!messageText) return;

    console.log("Sending message:", messageText);

    setMessages(prev => [...prev, {
      id: Date.now(),
      text: messageText,
      user: true
    }]);

    setCurrText("");
    setTimeout(() => {
      if (messageContainerRef) {
        messageContainerRef.scrollTop = messageContainerRef.scrollHeight;
      }
    }, 0);

    console.log("Message sent");

  };
  return (
    <section class="w-full h-full flex flex-col items-center justify-end p-4 pb-24 mx-auto ">

      <div id="message-container" class="h-full mt-8 flex-col w-[80%] flex flex-nowrap items-center justify-start relative rounded-md mb-4 overflow-y-auto">

        <For each={messages()}>
          {(message) => <Message text={message.text} user={message.user} />}
        </For>

      </div>



      <div class=" bg-background-light-3/25 h-max w-[80%] rounded-md bottom-20 text-center flex flex-wrap items-center py-4">

        <textarea class="text-sm pt-4 px-8 text-text-light-2/70 font-bold m-auto flex-1/1 outline-none h-max focus:outline-none focus:ring-0 focus:border-transparent text-wrap"
          placeholder="Type your message here..."
          value={currText()}
          onFocus={(e) => e.currentTarget.placeholder = ""}
          onInput={(e) => {
            setCurrText(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
              return;
            }
          }}
        />

        <div class="flex items-center justify-between w-full mt-4">

          <div class="bg-gray-700 p-2 rounded-md mx-4">
            <Paperclip class="text-text-light-2" size={20} />
          </div>

          <div class="bg-gray-700 p-2 rounded-md mx-4 cursor-pointer" onClick={handleSend}>
            <Send class="text-text-light-2" size={20} />
          </div>

        </div>

      </div>

    </section>
  );
};
