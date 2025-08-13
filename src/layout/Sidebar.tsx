import TopSection from "@/layout/sidebar/TopSection";
import MiddleSection from "@/layout/sidebar/MiddleSection";
import BottomSection from "@/layout/sidebar/BottomSection";
import { createSignal } from "solid-js";

export default function Sidebar() {

    const [isOpen, setIsOpen] = createSignal(true);

    return (
        <>
            {isOpen() ? (
                <div class='relative h-full min-w-max w-64 bg-sidebar text-text flex flex-col items-center justify-center '>

                    <TopSection isOpen={isOpen()} setIsOpen={setIsOpen} />

                    <div class='h-0.5 bg-primary w-[80%] mb-8' />

                    <MiddleSection isOpen={isOpen()} setIsOpen={setIsOpen} />

                    <div class='h-0.5 bg-primary w-[80%]' />

                    <BottomSection isOpen={isOpen()} setIsOpen={setIsOpen} />
                    
                </div>
            ) : (
                <div class='relative h-full min-w-max w-24 bg-sidebar text-text flex flex-col items-center justify-start '>

                    <TopSection isOpen={isOpen()} setIsOpen={setIsOpen} />


                    <div class='h-0.5 bg-primary w-12 mb-8' />

                    <MiddleSection isOpen={isOpen()} setIsOpen={setIsOpen} />

                    <div class='h-0.5 bg-primary w-12 ' />

                    <BottomSection isOpen={isOpen()} setIsOpen={setIsOpen} />

                </div>
            )
            }
            {/*
                <div class='absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 p-4'>
                    <span class='text-xs text-text'>Powered by</span>
                    <img src={logo} alt="Logo" class="w-8 h-8" />
                </div>
            */
            }
        </>

    );
};