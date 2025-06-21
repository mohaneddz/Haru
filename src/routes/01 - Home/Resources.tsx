import { createSignal } from "solid-js";
import UpperNavigation from "@/layout/UpperNavigation";

// lazy load tabs
import { lazy } from "solid-js";

const Featured = lazy(() => import("@/routes/01 - Home/resources/Featured"));
const Videos = lazy(() => import("@/routes/01 - Home/resources/Videos"));
const Documents = lazy(() => import("@/routes/01 - Home/resources/Documents"));
const Books = lazy(() => import("@/routes/01 - Home/resources/Books"));


const tabs = ["Featured", "Videos", "Documents", "Links"];

export default function Resources() {

  const [activeTab, setActiveTab] = createSignal(tabs[0]);

  return (
    <div class="w-full h-full flex flex-col items-center justify-start">
      <UpperNavigation  tabs={tabs} onTabChange={setActiveTab} />
      
      <div class="h-full w-full justify-center items-center flex flex-col">
        {activeTab() === "Featured" ? <Featured /> :
          activeTab() === "Videos" ? <Videos /> :
            activeTab() === "Documents" ? <Documents /> :
              activeTab() === "Books" ? <Books /> : null
        }
      </div>
    </div>
  );
};

