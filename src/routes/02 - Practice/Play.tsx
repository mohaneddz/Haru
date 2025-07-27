import { useLocation } from '@solidjs/router';
import { createMemo, Show } from 'solid-js';
import { lazy } from "solid-js";
import { Dynamic } from "solid-js/web";

function getGameComponent(gameName: string) {
    const fileMap: Record<string, string> = {
        sudoku: "Sudoku",
    };
    const file = fileMap[gameName] || null;
    if (!file) return null;
    return lazy(() => import(`@/routes/02 - Practice/Games/${file}.tsx`));
}

export default function Start() {

    const location = useLocation();

    const gameName = createMemo(() => {
        const segments = location.pathname
            .split('/')
            .filter(Boolean);

        const gameIndex = segments.findIndex(segment => segment === 'play' );
        if (gameIndex !== -1 && gameIndex + 1 < segments.length) {
            const gameSegment = segments[gameIndex + 1];
            return gameSegment.replace(/-/g, ' ').toLowerCase();
        }

        return 'Unknown';
    });

    const GameComponent = createMemo(() => getGameComponent(gameName()));

    return (
        <div class="flex flex-col items-center justify-start h-full w-full overflow-y-auto ">
            <Show when={GameComponent()} fallback={<div class='bg-red-700 w-full h-full center'>Game not found : {gameName()}</div>}>
                <Dynamic component={GameComponent() ?? undefined} />
            </Show>
        </div >
    );
};