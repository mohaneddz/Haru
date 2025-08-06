import { Accessor, For, Setter } from "solid-js";
import Message from "@/components/02 - Practice/Tutor/Messasge";

interface Props {
    messages: Accessor<MessageData[]>
    messageContainerRef: (ref: HTMLDivElement) => HTMLDivElement;
    newChat: () => void;
    isLoading: Accessor<boolean>;
    setMode:  Setter<string>;
    mode: Accessor<string>;
}

export default function Chat(props: Props) {
    return (
        <>
            <div class="absolute top-8 left-4 flex flex-col justify-center z-50">

                <select class="mb-4 backdrop:blur-lg focus:outline-none focus:ring-0" onChange={(e) => props.setMode(e.currentTarget.value)} value={props.mode()}>
                    <option value="tutor" class="bg-background-light-1">General</option>
                    <option value="explorer" class="bg-background-light-1">Explorer</option>
                    <option value="objective" class="bg-background-light-1">Objective</option>
                </select>

                <p class="text-text-light-2 text-sm clickable w-min text-nowrap" onClick={props.newChat}>New Chat</p>

            </div>


            <div
                id="message-container"
                ref={props.messageContainerRef}
                class="max-h-full mt-8 flex-col w-full px-[10%] flex flex-nowrap items-center justify-start relative rounded-md mb-4 overflow-y-auto overflow-x-hidden"
            >
                <For each={props.messages()}>
                    {(message) => <Message text={message.text} user={message.user} id={message.id} sources={message.sources} showSources={!props.isLoading() || message.id < props.messages().length} />}
                </For>

            </div>
        </>
    );
};
