import TopSection from "@/layout/sidebar/TopSection";
import MiddleSection from "@/layout/sidebar/MiddleSection";
import BottomSection from "@/layout/sidebar/BottomSection";

import Seperator from '@/assets/sidebar-seperator.png';

export default function Sidebar() {
    return (
        <div class='relative h-full min-w-64 bg-sidebar text-white flex flex-col items-center justify-center '>
            
            <TopSection />

            <img src={Seperator} class='w-[80%] mb-8'/>
            
            <MiddleSection />

            <img src={Seperator} class='w-[80%] mt-8'/>

            <BottomSection />
        </div>
    );
};