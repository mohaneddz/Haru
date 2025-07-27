import Button from "@/components/core/Button";
import { ArrowLeft } from "lucide-solid";
import UsePomodoro from "@/hooks/plugins/usePomodoro";

interface Props {
    setPage: (page: 'main' | 'settings') => void;
}
export default function PomodoroSettings(props: Props) {

    const { handleBackClick } = UsePomodoro();

    return (
        <div>

            <div class="absolute top-8 left-8 p-2 aspect-square flex items-center justify-center mb-4 border border-grey-400/40 rounded-full clickable" onclick={handleBackClick}>
                <ArrowLeft class="text-grey-400/40" />
            </div>

            <h1 class="text-2xl text-white text-center mb-4">Pomodoro Settings</h1>
            <div class="">

                <div class="grid grid-cols-2 gap-4 mb-4 w-full">
                    <label for="pomodoro-time">Pomodoro Time</label>
                    <input type="time" id="pomodoro-time" />
                </div>

                <Button variant="primary" onClick={() => props.setPage('main')}>Save</Button>
            </div>
        </div>
    );
};
