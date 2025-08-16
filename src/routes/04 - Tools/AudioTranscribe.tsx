import { createSignal } from "solid-js";
import UpperNavigation from "@/layout/UpperNavigation";

// lazy load tabs
import { lazy } from "solid-js";

const FileTranscription = lazy(() => import("@/routes/04 - Tools/Transcription/FileTranscription"));
const FolderTranscription = lazy(() => import("@/routes/04 - Tools/Transcription/FolderTranscription"));

const tabs = ["File", "Folder"];

export default function Dictionary() {

  const [activeTab, setActiveTab] = createSignal(tabs[0]);

  return (
    <div class="w-full h-full flex flex-col items-center justify-start">
      <UpperNavigation tabs={tabs} onTabChange={setActiveTab} />
      
      <div class="h-full w-full justify-center items-center flex flex-col">
        {activeTab() === "File" ? <FileTranscription /> :
          activeTab() === "Folder" ? <FolderTranscription /> : null
        }
      </div>
    </div>
  );
};

