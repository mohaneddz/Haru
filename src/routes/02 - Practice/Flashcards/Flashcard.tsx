import { ArrowLeft } from "lucide-solid";
import { Show } from "solid-js";

import Octagon from "lucide-solid/icons/octagon";
import Pause from "lucide-solid/icons/pause";
import Play from "lucide-solid/icons/play";
import SkipBack from "lucide-solid/icons/skip-back";
import SkipForward from "lucide-solid/icons/skip-forward";
import RotateCw from "lucide-solid/icons/rotate-cw";

import useFlashCard from "@/hooks/training/useFlashCard";

export default function Flashcard() {
    const {
        timer,
        width,
        question,
        answer,
        result,
        isPaused,
        setAnswer,
        startTimer,
        compareAnswers,
        setIsPaused,
        pauseTimer
    } = useFlashCard();

    return (
        <div class="w-full h-screen flex justify-center mb-8">
            <div class="w-[80%] flex flex-col items-center justify-between mt-20">
                <div class="absolute top-0 px-6 py-8 h-12 w-full flex items-center justify-start gap-8 border-b border-gray-500 z-50">
                    <a href="/practice/flashcards" class="text-accent clickable">
                        <ArrowLeft class="w-8 h-8" />
                    </a>
                </div>

                <div class="h-40 w-full bg-background-light-1 center rounded-md border border-gray-500 relative">
                    {question()}
                    <Show when={result()}>
                        <RotateCw class="absolute bottom-4 right-4 w-4 h-4 text-gray-400 hover:text-accent transition-colors cursor-pointer"
                            onClick={() => {
                                setAnswer('');
                                setIsPaused(false);
                                startTimer();
                            }} />
                    </Show>
                </div>


                <Show when={result() == "Correct!"}
                    fallback={<div class="text-2xl font-bold mt-4 text-error">{result()}</div>}>
                    <div class="text-2xl font-bold mt-4 text-success">
                        {result()}
                    </div>
                </Show>

                <div class="flex flex-col gap-2 w-full">
                    <p class="text-gray-400/60 text-[0.75rem] text-center">
                        Time left: {timer()} seconds
                    </p>
                    <div class="h-2 relative bg-background-dark-1 rounded-md border border-gray-800">
                        {/* Removed 'transition-all duration-1000 ease-linear' */}
                        <div
                            class="bg-accent h-1 rounded-md"
                            style={{ width: `${width()}%`, transition: result() === "" ? 'width 1s linear' : 'none' }}
                        ></div>
                    </div>
                    <input
                        type="text"
                        class="h-40 bg-background-light-2 text-center center rounded-md border border-gray-500"
                        placeholder="Your answer here.."
                        onInput={(e) => setAnswer(e.currentTarget.value)}
                        value={answer()}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                compareAnswers();
                            }
                        }}
                    />
                    <div class="flex justify-between gap-8 mt-4">
                        <SkipBack class="w-8 h-8" />
                        <div class="center">
                            <Show when={!isPaused()} fallback={
                                <Play class="w-8 h-8" onClick={() => {
                                    setIsPaused(false);
                                    startTimer();
                                }} />
                            }>
                                <Pause class="w-8 h-8" onClick={() => {
                                    setIsPaused(true);
                                    pauseTimer();
                                }} />
                            </Show>
                            <Octagon class="w-8 h-8" />
                        </div>
                        <SkipForward class="w-8 h-8" />
                    </div>
                </div>
            </div>
        </div >
    );
}