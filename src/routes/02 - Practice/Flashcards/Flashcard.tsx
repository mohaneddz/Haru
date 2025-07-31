import { ArrowLeft } from 'lucide-solid';
import { createSignal, onCleanup } from "solid-js";

export default function Flashcard() {

    const INITIAL_TIME = 5;
    const [timer, setTimer] = createSignal(INITIAL_TIME);
    const [width, setWidth] = createSignal(100);

    const interval = setInterval(() => {
        setTimer(prev => {
            const newTime = Math.max(prev - 1, 0);
            setWidth((newTime / INITIAL_TIME) * 100);
            return newTime;
        });
    }, 1000);

    onCleanup(() => clearInterval(interval)); 

    return (
        <div class="w-full h-screen flex justify-center mb-8">

            <div class="w-[80%] flex flex-col items-center justify-between mt-20 ">

                <div class="absolute top-0 px-6 py-8 h-12 w-full flex items-center justify-start gap-8 border-b border-gray-500 flex-shrink-0 z-50">
                    <a href="/practice/flashcards p-4" class="text-accent clickable"><ArrowLeft class="w-8 h-8" /></a>
                    <p class="text-sm text-gray-400">Flashcard Deck Details</p>
                    <p class="text-sm text-gray-400">Flashcard Deck Details</p>
                </div>

                <div class="h-40 w-full bg-background-light-1 center rounded-md border border-gray-500">What is the tallest building in the world?</div>

                <div class="flex flex-col gap-2 w-full">
                    <p class="text-gray-400/60 text-[0.75rem] text-center">Time left: {timer()} seconds</p>
                    <div class="h-2 relative bg-background-dark-1 rounded-md border border-gray-800">
                        <div
                            class="bg-accent h-1 rounded-md transition-all duration-1000 ease-linear"
                            style={{ width: `${width()}%` }}
                        ></div>
                    </div>
                    <input type="text" class="h-40 bg-background-light-2 text-center center rounded-md border border-gray-500" placeholder="Your answer here.." />
                </div>
            </div>

        </div>

    );
};