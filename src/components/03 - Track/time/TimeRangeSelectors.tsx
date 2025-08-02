import { BarChart3 } from 'lucide-solid';
import type { Accessor, Setter } from 'solid-js';

// The props interface remains the same
interface Props {
    period: Accessor<'week' | 'month' | 'quarter'>,
    setPeriod: Setter<'week' | 'month' | 'quarter'>;
}

export default function TimeRangeSelectors(props: Props) {

    return (
        <div class="flex justify-between items-center ">
            <h1 class="text-2xl font-bold text-text/90 flex items-center gap-3">
                <BarChart3 class="w-8 h-8 text-accent" />
                Time Analytics
            </h1>
            <div class="flex gap-2">

                <button
                    class={`px-4 py-2 rounded-lg transition hover:scale-105 cursor-pointer active:scale-95 ${props.period() === 'week' ? 'bg-accent-dark-2 text-white' : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'}`}
                    onClick={() => props.setPeriod('week')}>
                    Week
                </button>
                <button
                    class={`px-4 py-2 rounded-lg transition hover:scale-105 cursor-pointer active:scale-95 ${props.period() === 'month' ? 'bg-accent-dark-2 text-white' : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'}`}
                    onClick={() => props.setPeriod('month')}>
                    Month
                </button>
                <button
                    class={`px-4 py-2 rounded-lg transition hover:scale-105 cursor-pointer active:scale-95 ${props.period() === 'quarter' ? 'bg-accent-dark-2 text-white' : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'}`}
                    onClick={() => props.setPeriod('quarter')}>
                    Quarter
                </button>
            </div>
            
        </div>
    );
}