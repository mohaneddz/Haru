import { createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";


export default function ModelsControl() {

    const [llm, setLlm] = createSignal(false);
    const [chat, setChat] = createSignal(false);
    const [rag, setRag] = createSignal(false);
    const [web, setWeb] = createSignal(false);
    const [tts, setTts] = createSignal(false);
    const [stt, setStt] = createSignal(false);

    const checkServices = async () => {
        invoke('is_running', { process: 'llm' }).then((isRunning) => setLlm(isRunning as boolean));
        invoke('is_running', { process: 'chat' }).then((isRunning) => setChat(isRunning as boolean));
        invoke('is_running', { process: 'rag' }).then((isRunning) => setRag(isRunning as boolean));
        invoke('is_running', { process: 'web' }).then((isRunning) => setWeb(isRunning as boolean));
        invoke('is_running', { process: 'tts' }).then((isRunning) => setTts(isRunning as boolean));
        invoke('is_running', { process: 'stt' }).then((isRunning) => setStt(isRunning as boolean));
    }

    onMount(() => {
        checkServices();
    });

    const toggleService = async (service: string, state: boolean, port?: number) => {
        try {
            if (state) {
                await invoke("shutdown_app", { process: service });
            } else {
                await invoke("run_app", { process: service, port });
            }
            checkServices();
        } catch (error) {
            console.error(`Failed to toggle ${service}:`, error);
        }
    };

    const options = [
        { name: "LLM", action: () => toggleService("llm", llm()), state: llm },
        { name: "Chat", action: () => toggleService("chat", chat(), 5000), state: chat },
        { name: "RAG", action: () => toggleService("rag", rag(), 5001), state: rag },
        { name: "Web", action: () => toggleService("web", web(), 5002), state: web },
        { name: "TTS", action: () => toggleService("tts", tts(), 5003), state: tts },
        { name: "STT", action: () => toggleService("stt", stt(), 5004), state: stt },
    ];

    const [open, setOpen] = createSignal(false);

    return (
        <div class="relative inline-block text-left">
            {/* Dropdown Button */}
            <button
                class="inline-flex justify-center w-full h-16 center shadow-sm px-4 py-2  text-sm font-medium text-accent hover:bg-sidebar-light-1 focus:outline-none"
                onClick={() => setOpen(!open())}
                aria-haspopup="true"
                aria-expanded={open()}
            >
                Microservices
                <svg
                    class="ml-2 -mr-1 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fill-rule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {open() && (
                <div
                    class="origin-bottom-right absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabindex="-1"
                >
                    <div class="py-1" role="none">
                        {options.map((opt) => (
                            <div
                                class="flex justify-between items-center px-4 py-2 hover:bg-sidebar-light-3 cursor-default"
                                role="menuitem"
                                tabindex="-1"
                            >
                                <span class="text-text text-sm">{opt.name}</span>
                                <button
                                    class={`ml-4 inline-flex items-center border rounded-full w-4 h-4 aspect-square text-xs font-medium text-text  focus:outline-none`
                                        + (opt.state() ? ' bg-accent hover:bg-accent-dark' : ' bg-gray-700 hover:bg-accent-light-3')}
                                    onClick={() => {
                                        opt.action();
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
