import Button from "@/components/core/Input/Button";
import { ArrowLeft } from "lucide-solid";
import TimeInput from "@/components/core/Input/TimeInput";
import SelectInput from "@/components/core/Input/SelectInput";
import usePomodoro from "@/hooks/plugins/usePomodoro";

interface Props {
    setPage: (page: 'main' | 'settings') => void;
    settings: () => PomodoroSettings;
}

export default function PomodoroSettings(props: Props) {

    const { saveSettings, setPomodoroTime, setShortBreakTime, setLongBreakTime, setAudioEnabled, setNumberOfRounds } = usePomodoro();

    return (
        <div>
            <div class="absolute top-8 left-8 p-2 aspect-square flex items-center justify-center mb-4 border border-grey-400/40 rounded-full clickable" onclick={() => props.setPage('main')}>
                <ArrowLeft class="text-grey-400/40" />
            </div>

            <div class=" bg-background-light-3 rounded-xl px-8 py-12 w-max center flex-col">

                <h1 class="text-2xl text-white text-center text-nowrap">Pomodoro Settings</h1>

                <div class="flex flex-col gap-4 mb-4 h-min w-full items-center content-center">

                    <div class="w-full flex gap-4 items-center justify-between">
                        <label for="pomodoro-time" class="text-start justify-self-start">Pomodoro Time</label>
                        <TimeInput id="pomodoro-time" class="justify-self-end p-2 rounded" value={props.settings().pomodoroTimeSeconds} onChange={(val) => {
                            setPomodoroTime(val);
                        }} />
                    </div>
                    <div class="w-full flex gap-4 items-center justify-between">
                        <label for="pomodoro-break" class="text-start justify-self-start">Short Break</label>
                        <TimeInput id="pomodoro-break" class="justify-self-end p-2 rounded" value={props.settings().shortBreakTimeSeconds} onChange={(val) => {
                            setShortBreakTime(val);
                        }} />
                    </div>

                    <div class="w-full flex gap-4 items-center justify-between">
                        <label for="pomodoro-long-break" class="text-start justify-self-start">Long Break</label>
                        <TimeInput id="pomodoro-long-break" class="justify-self-end p-2 rounded" value={props.settings().longBreakTimeSeconds} onChange={(val) => {
                            setLongBreakTime(val);
                        }} />
                    </div>

                    <div class="w-full flex gap-4 items-center justify-between">
                        <label for="pomodoro-rounds" class="text-start justify-self-start text-nowrap">Number of Rounds</label>
                        <input id="pomodoro-rounds" class="justify-self-end p-2 mr-2 rounded w-8" type="number" min="1" value={props.settings().numberOfRounds} onChange={(e) => {
                            setNumberOfRounds(Number(e.target.value));
                        }} />
                    </div>

                    <div class="w-full flex gap-4 items-center justify-between">
                        <label for="pomodoro-long-break" class="text-start justify-self-start">Audio</label>
                        <SelectInput
                            id="pomodoro-audio"
                            class="justify-self-end p-2 rounded bg-background-light-3"
                            options={[
                                { value: "enabled", label: "Enabled" },
                                { value: "disabled", label: "Disabled" }
                            ]}
                            selected={props.settings().audioEnabled ? "enabled" : "disabled"}
                            onChange={(val) => {
                                setAudioEnabled(val === "enabled");
                            }}
                        />
                    </div>

                    <div class="grid grid-cols-2 w-full justify-stretch items-start gap-8 mt-8">
                        <Button variant="basic" class="w-full text-center" onClick={() => {
                            props.setPage('main');
                        }}>Cancel</Button>
                        <Button variant="primary" class="w-full text-center" onClick={() => {
                            saveSettings();
                            props.setPage('main');
                        }}>Save</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
