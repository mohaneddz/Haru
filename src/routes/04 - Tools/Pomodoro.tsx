import { createSignal, createEffect } from "solid-js";
import PomodoroMain from "@/components/04 - Tools/Pomodoro/PomodoroMain";
import PomodoroSettings from "@/components/04 - Tools/Pomodoro/PomodoroSettings";
import usePomodoro from "@/hooks/plugins/usePomodoro";

export default function Pomodoro() {

  const { getSettings, pomodoroTime, shortBreakTime, longBreakTime, audioEnabled, numberOfRounds } = usePomodoro();

  const [page, setPage] = createSignal<'main' | 'settings'>('main');

  // Create a reactive settings object that updates with the hook state
  const settings = (): PomodoroSettings => ({
    pomodoroTimeSeconds: pomodoroTime(),
    shortBreakTimeSeconds: shortBreakTime(),
    longBreakTimeSeconds: longBreakTime(),
    audioEnabled: audioEnabled(),
    numberOfRounds: numberOfRounds(),
  });

  createEffect(() => {
    // Load settings when component mounts
    getSettings();
  });

  return (
    <>
      {page() === 'main' ? (
        <PomodoroMain setPage={setPage} settings={settings} />
      ) : (
        <PomodoroSettings setPage={setPage} settings={settings} />
      )}
    </>
  );
};
