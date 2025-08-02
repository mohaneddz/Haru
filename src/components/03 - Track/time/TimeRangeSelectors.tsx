import { createMemo } from 'solid-js';
import { BarChart3 } from 'lucide-solid';
import type { Accessor, Setter } from 'solid-js';

// The props interface remains the same
interface Props {
    start: Accessor<Date>,
    setStart: Setter<Date>,
    end: Accessor<Date>,
    setEnd: Setter<Date>,
    timelineDay: Accessor<Date>,
    setTimelineDay: Setter<Date>,
}

export default function TimeRangeSelectors(props: Props) {

    // 1. CREATE a function to handle date range changes.
    // This function will calculate new start/end dates and call the setters from props.
    const handleRangeChange = (range: 'week' | 'month' | 'quarter') => {
        const newEnd = new Date(); // End date is now
        const newStart = new Date(); // Start from now and go back

        if (range === 'week') {
            newStart.setDate(newEnd.getDate() - 6);
        } else if (range === 'month') {
            newStart.setMonth(newEnd.getMonth() - 1);
        } else if (range === 'quarter') {
            newStart.setMonth(newEnd.getMonth() - 3);
        }

        // --- THE FIX ---
        // Normalize the start date to the beginning of that day.
        newStart.setHours(0, 0, 0, 0);
        // --- END OF FIX ---

        props.setStart(newStart);
        props.setEnd(newEnd);
    };



    // 2. USE a memo to determine the currently active range from props.
    // This makes the component's UI react to the global state.
    const activeRange = createMemo(() => {
        const diffTime = Math.abs(props.end().getTime() - props.start().getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) return 'week';
        if (diffDays <= 31) return 'month';
        if (diffDays <= 92) return 'quarter';
        return 'custom'; // A custom range was selected
    });


    return (
        <div class="flex justify-between items-center ">
            <h1 class="text-2xl font-bold text-text/90 flex items-center gap-3">
                <BarChart3 class="w-8 h-8 text-accent" />
                Time Analytics
            </h1>
            <div class="flex gap-2">
                {/* 3. UPDATE button logic:
                    - `onClick` calls the new handler function.
                    - `class` uses the `activeRange` memo to determine its style.
                */}
                <button
                    class={`px-4 py-2 rounded-lg transition hover:scale-105 cursor-pointer active:scale-95 ${activeRange() === 'week' ? 'bg-accent-dark-2 text-white' : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'}`}
                    onClick={() => handleRangeChange('week')}>
                    Week
                </button>
                <button
                    class={`px-4 py-2 rounded-lg transition hover:scale-105 cursor-pointer active:scale-95 ${activeRange() === 'month' ? 'bg-accent-dark-2 text-white' : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'}`}
                    onClick={() => handleRangeChange('month')}>
                    Month
                </button>
                <button
                    class={`px-4 py-2 rounded-lg transition hover:scale-105 cursor-pointer active:scale-95 ${activeRange() === 'quarter' ? 'bg-accent-dark-2 text-white' : 'bg-sidebar-light-2 text-text/70 hover:bg-sidebar-light-3'}`}
                    onClick={() => handleRangeChange('quarter')}>
                    Quarter
                </button>
            </div>
        </div>
    );
}