import { lazy } from "solid-js";
import { createSignal } from "solid-js";
import UpperNavigation from "@/layout/UpperNavigation";
import Toast from "@/components/core/Toast";

const Appearance = lazy(() => import("@/routes/06 - Misc/Settings/Appearance"));
const Behavior = lazy(() => import("@/routes/06 - Misc/Settings/Behavior"));
const Advanced = lazy(() => import("@/routes/06 - Misc/Settings/Advanced"));
const Paths = lazy(() => import("@/routes/06 - Misc/Settings/Paths"));
const Downloads = lazy(() => import("@/routes/06 - Misc/Settings/Downloads"));

export default function Settings() {

  const tabs = ["Paths", "Behavior", "Appearance", "Advanced", "Downloads"];
  const [activeTab, setActiveTab] = createSignal(tabs[2]);

  return (
    <main class="w-full h-full flex flex-col items-center justify-start">

      <Toast type="info" message="Settings are experimental and may change in future releases." />
      <UpperNavigation tabs={tabs} onTabChange={setActiveTab} activeTab={activeTab()} />

      <div class="bg-sidebar mb-8 h-full w-[80%] mt-20 flex justify-center border-[1px] border-gray-700 rounded-lg p-4 overflow-y-auto">
        {activeTab() === "Appearance" && <Appearance />}
        {activeTab() === "Behavior" && <Behavior />}
        {activeTab() === "Advanced" && <Advanced />}
        {activeTab() === "Paths" && <Paths />}
        {activeTab() === "Downloads" && <Downloads />}
      </div>
    </main>
  );
};
