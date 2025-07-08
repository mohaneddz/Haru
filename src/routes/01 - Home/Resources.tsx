import { createSignal } from "solid-js";
import UpperNavigation from "@/layout/UpperNavigation";

// lazy load tabs
import { lazy } from "solid-js";

const Featured = lazy(() => import("@/routes/01 - Home/Resources/Featured"));
const Videos = lazy(() => import("@/routes/01 - Home/Resources/Videos"));
const Documents = lazy(() => import("@/routes/01 - Home/Resources/Documents"));
const Tools = lazy(() => import("@/routes/01 - Home/Resources/Tools"));


const tabs = ["Featured", "Videos", "Documents", "Tools"];

export default function Resources() {

  const [activeTab, setActiveTab] = createSignal(tabs[0]);

  return (
    <div class="w-full h-full flex flex-col items-center justify-start">
      <UpperNavigation  tabs={tabs} onTabChange={setActiveTab} />
      
      <div class="h-full w-full justify-center items-center flex flex-col">
        {activeTab() === "Featured" ? <Featured /> :
          activeTab() === "Videos" ? <Videos /> :
            activeTab() === "Documents" ? <Documents /> :
              activeTab() === "Tools" ? <Tools /> : null
        }
      </div>
    </div>
  );
};

