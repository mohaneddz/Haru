import UpperNavigation from "@/layout/UpperNavigation";
import { createSignal } from "solid-js";

const tabs = ['Overview', 'Syllabus', 'Resources', 'Progress'];

import { lazy } from "solid-js";

const Overview = lazy(() => import("@/routes/01 - Home/Course/Overview"));
const Syllabus = lazy(() => import("@/routes/01 - Home/Course/Syllabus"));
const Resources = lazy(() => import("@/routes/01 - Home/Course/Resources"));
const Progress = lazy(() => import("@/routes/01 - Home/Course/Progress"));

export default function Course() {
    
    const [activeTab, setActiveTab] = createSignal(tabs[0]);
    
    return (
        <div class="w-full h-full flex flex-col items-center justify-start">

            <UpperNavigation tabs={tabs} onTabChange={setActiveTab} />

            <div class="flex flex-col items-center justify-start h-full w-full bg-background-dark-2">
                {activeTab() === "Overview" ? <Overview /> :
                    activeTab() === "Syllabus" ? <Syllabus /> :
                        activeTab() === "Resources" ? <Resources /> :
                            activeTab() === "Progress" ? <Progress /> : null
                }
            </div>
        </div>
    );
};
