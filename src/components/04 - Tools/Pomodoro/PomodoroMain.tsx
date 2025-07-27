import Button from "@/components/core/Button"
import { ArrowLeft, Octagon, Pause, Play } from "lucide-solid";
import usePomodoro from "@/hooks/plugins/usePomodoro";
import { Show } from "solid-js";

interface Props {
    setPage: (page: 'main' | 'settings') => void;
}

export default function PomodoroMain(props: Props) {

    const { handleBackClick, isActive, formatTimeLeft , handlePlay,handleStop} = usePomodoro();

    return (
        <div class="center flex-col h-full w-full relative">


            <div class="absolute top-8 left-8 p-2 aspect-square flex items-center justify-center mb-4 border border-grey-400/40 rounded-full clickable" onclick={handleBackClick}>
                <ArrowLeft class="text-grey-400/40" />
            </div>

            <p class="text-9xl text-white select-none">{formatTimeLeft()}</p>
            <p class="text-xl text-gray-400/40 select-none">Focus on your task</p>

            <div class="absolute bottom-20 center flex-col gap-4">
                <div class="grid grid-cols-2 mt-4 gap-4">

                    <Button variant="secondary" class="center w-stretch h-4 p-1 text-[0.5rem]" onClick={handleStop}>
                        <Octagon class="mr-2 text-[0.5rem]" size={12} /> STOP
                    </Button>

                    <Button class="center w-stretch h-4 p-1 text-[0.5rem] bg-primary-dark-3" onClick={handlePlay}>
                        <Show when={!isActive()}>
                            <Play class="mr-2 text-[0.5rem]" size={12} /> START
                        </Show>
                        <Show when={isActive()}>
                            <Pause class="mr-2 text-[0.5rem]" size={12} /> PAUSE
                        </Show>
                    </Button>

                </div>
                <p class="text-[0.8rem] text-gray-400/40 underline clickable select-none" onclick={() => props.setPage('settings')}>Pomodoro Settings</p>
            </div>
        </div>

    );
};
