// import { Settings, User } from "lucide-solid";
import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface Props {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
}

export default function BottomSection(props: Props) {

  const [LLM, setLLM] = createSignal(false);
  const [app, setApp] = createSignal(false);

  const stopLLM = async () => {
    setLLM(false);
    try {
      const response = await fetch("http://localhost:5000/stop-llama-server", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      console.log("LLM stopped successfully");
    } catch (error) {
      console.error("Failed to stop LLM:", error);
    }
  };

  const stopApp = async () => {
    setApp(false);
    try {
      await invoke("stop_app");
      console.log("App stopped successfully");
    } catch (error) {
      console.error("Failed to stop app:", error);
    }
  };

  const startLLM = async () => {
    setLLM(true);
    try {
      const response = await fetch("http://localhost:5000/start-llama-server", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      console.log("LLM started successfully");
    } catch (error) {
      console.error("Failed to start LLM:", error);
    }
  };

  const startApp = async () => {
    setApp(true);
    try {
      await invoke("run_app");
      console.log("App started successfully");
    } catch (error) {
      console.error("Failed to start app:", error);
    }
  };

  const handleToggleLLM = () => {
    if (LLM()) {
      stopLLM();
    } else {
      startLLM();
    }
  }

  const handleToggleApp = () => {
    if (app()) {
      stopApp();
    } else {
      startApp();
    }
  };

  return (
    <div class={`h-24 flex items-center justify-between w-full px-4 py-2 bg-sidebar text-white ${props.isOpen ? 'flex-row' : 'flex-col gap-2'}`}>

      {/* user icon + username + settings button */}
      <div class="flex w-full gap-8">
        <button onClick={handleToggleLLM} class={`clickable rounded-md w-full ${LLM() ? 'bg-error' : 'bg-accent'}`}>LLM</button>
        <button onClick={handleToggleApp} class={`clickable rounded-md w-full ${app() ? 'bg-error' : 'bg-accent'}`}>App</button>
      </div>

      {/* <a class="flex justify-center items-center gap-4" href="/auth/profile">

        <div class="bg-gradient-to-br from-primary to-primary-dark-3 rounded-full px-2 py-2 flex items-center gap-2 overflow-hidden">
          < User class="w-4 h-4 text-text" />
        </div>
        <span class={`truncate text-primary-dark-1 text-sm font-semibold ${props.isOpen ? 'w-30' : 'hidden'}`}>
          Mohaned_Dz
        </span>
      </a>

      <a href="/settings">
        < Settings class="w-6 h-6 text-primary-dark-1 hover:text-text hover:scale-105 cursor-pointer transition duration-75" />
      </a> */}

    </div>
  );
};
