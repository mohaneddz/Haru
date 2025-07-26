import { createSignal } from 'solid-js';
import { BarChart3 } from 'lucide-solid';

export default function TimeRangeSelectors() {

    const [timeRange, setTimeRange] = createSignal<'week' | 'month' | 'quarter'>('week');

    return <div class="flex justify-between items-center ">
        <h1 class="text-2xl font-bold text-text/90 flex items-center gap-3">
            <BarChart3 class="w-8 h-8 text-accent" />
            Time Analytics
        </h1>
        <div class="flex gap-2">
            <button
                class={`px-4 py-2 rounded-lg transition hover:scale-105 cursor-pointer active:scale-95 ${timeRange() === 'week' ? 'bg-accent-dark-2 text-white' : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'}`}
                onClick={() => setTimeRange('week')}>
                Week
            </button>
            <button
                class={`px-4 py-2 rounded-lg transition hover:scale-105 cursor-pointer active:scale-95 ${timeRange() === 'month' ? 'bg-accent-dark-2 text-white' : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'}`}
                onClick={() => setTimeRange('month')}>
                Month
            </button>
            <button
                class={`px-4 py-2 rounded-lg transition hover:scale-105 cursor-pointer active:scale-95 ${timeRange() === 'quarter' ? 'bg-accent-dark-2 text-white' : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'}`}
                onClick={() => setTimeRange('quarter')}>
                Quarter
            </button>
        </div>
    </div>;
}
