import Button from "@/components/core/Input/Button"
import { Octagon, Pause, Play, RotateCcw } from "lucide-solid";
import usePomodoro from "@/hooks/plugins/usePomodoro";
import { Show } from "solid-js";

interface Props {
    setPage: (page: 'main' | 'settings') => void;
    settings: () => PomodoroSettings;
}

export default function PomodoroMain(props: Props) {

    const { isActive, formatTimeLeft, handlePlay, handleStop, handleReset, turn, handleSkip, pomodorosCompleted } = usePomodoro();

    const getPhaseText = () => {
        switch (turn()) {
            case 0: return "Focus on your task";
            case 1: return "Take a short break";
            case 2: return "Take a long break";
            default: return "Focus on your task";
        }
    };

    const getPhaseColor = () => {
        switch (turn()) {
            case 0: return "text-text";
            case 1: return "text-text-light-3";
            case 2: return "text-accent";
            default: return "text-text";
        }
    };

    return (
        <div class="center flex-col h-full w-full relative">

            <div class="center flex-col gap-4 mb-8 relative">
                <p class={`absolute -right-8 -top-4 ${getPhaseColor()}`}>{pomodorosCompleted() % props.settings().numberOfRounds}/{props.settings().numberOfRounds}</p>
                <p class={`text-9xl select-none clickable ${getPhaseColor()}`} onclick={handleSkip}>{formatTimeLeft()}</p>
                <p class={`text-xl select-none ${getPhaseColor()}`}>{getPhaseText()}</p>
            </div>

            <div class="absolute bottom-20 center flex-col gap-4">
                <div class="grid grid-cols-3 mt-4 gap-4">

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

                    <Button variant="secondary" class="center w-stretch h-4 p-1 text-[0.5rem]" onClick={handleReset}>
                        <RotateCcw class="mr-2 text-[0.5rem]" size={12} /> RESET
                    </Button>

                </div>
                <p class="text-[0.8rem] text-gray-400/40 underline clickable select-none" onclick={() => props.setPage('settings')}>Pomodoro Settings</p>
            </div>
        </div>

    );
};
