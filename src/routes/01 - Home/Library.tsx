import { createSignal } from "solid-js";
import UpperNavigation from "@/layout/UpperNavigation";

// lazy load tabs
import { lazy } from "solid-js";

const Courses = lazy(() => import("@/routes/01 - Home/tabs/Courses"));
// @ts-ignore
const Videos = lazy(() => import("@/routes/01 - Home/tabs/Videos"));
const Documents = lazy(() => import("@/routes/01 - Home/tabs/Documents"));
const Books = lazy(() => import("@/routes/01 - Home/tabs/Books"));


const tabs = ["Courses", "Videos", "Documents", "Books"];

export default function Library() {

  const [activeTab, setActiveTab] = createSignal(tabs[0]);

  return (
    <div class="w-full h-full flex flex-col items-center justify-start">
      <UpperNavigation tabs={tabs} onTabChange={setActiveTab} />
      
      <div class="h-full w-full justify-center items-center flex flex-col">
        {activeTab() === "Courses" ? <Courses /> :
          activeTab() === "Videos" ? <Videos /> :
            activeTab() === "Documents" ? <Documents /> :
              activeTab() === "Books" ? <Books /> : null
        }
      </div>
    </div>
  );
};
