import { createSignal } from "solid-js";
import PomodoroMain from "@/components/04 - Tools/Pomodoro/PomodoroMain";
import PomodoroSettings from "@/components/04 - Tools/Pomodoro/PomodoroSettings";

export default function Pomodoro() {

  const [page, setPage] = createSignal<'main' | 'settings'>('main');

  return (
    <>
      {page() === 'main' ? (
        <PomodoroMain setPage={setPage} />
      ) : (
        <PomodoroSettings setPage={setPage} />
      )}
    </>
  );
};
