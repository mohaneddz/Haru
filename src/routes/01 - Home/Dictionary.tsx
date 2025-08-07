import { createSignal } from "solid-js";
import UpperNavigation from "@/layout/UpperNavigation";

// lazy load tabs
import { lazy } from "solid-js";

const Definitions = lazy(() => import("@/routes/01 - Home/Dictionary/Definitions"));
const Translations = lazy(() => import("@/routes/01 - Home/Dictionary/Translations"));

const tabs = ["Definitions", "Translations"];

export default function Dictionary() {

  const [activeTab, setActiveTab] = createSignal(tabs[0]);

  return (
    <div class="w-full h-full flex flex-col items-center justify-start">
      <UpperNavigation tabs={tabs} onTabChange={setActiveTab} />
      
      <div class="h-full w-full justify-center items-center flex flex-col">
        {activeTab() === "Definitions" ? <Definitions /> :
          activeTab() === "Translations" ? <Translations /> : null
        }
      </div>
    </div>
  );
};

