import UpperNavigation from "@/layout/UpperNavigation";
import { createSignal } from "solid-js";

const tabs = ['Dashboard', 'Statistics'];

import { lazy } from "solid-js";

const Dashboard = lazy(() => import("@/routes/02 - Practice/Training/Flashcards/FlashCardsDashboard"));
const Statistics = lazy(() => import("@/routes/02 - Practice/Training/Flashcards/FlashCardsStatistics"));


export default function Flashcards() {

  const [activeTab, setActiveTab] = createSignal(tabs[0]);

  return (
    <div class="w-full h-full flex flex-col items-center justify-start">

      <UpperNavigation tabs={tabs} onTabChange={setActiveTab} />

      <div class="flex flex-col items-center justify-start h-full w-full bg-background-dark-2 pt-16">
        {activeTab() === "Dashboard" ? <Dashboard /> :
          activeTab() === "Statistics" ? <Statistics /> : null
        }
      </div>
    </div>
  );
};
