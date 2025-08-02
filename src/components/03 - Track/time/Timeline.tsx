import { createMemo, createSignal, For, Show, Accessor, Setter } from 'solid-js';
import { getTimeWidth, getTimePosition, parseTime, formatTime, formatDate } from '@/utils/track/timeUtils';

// UI and Icon Imports
import LayoutCard from '@/components/02 - Practice/training/LayoutCard';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-solid';

// Utility and Data Imports
import { getCategoryColor } from '@/utils/track/themeUtils';
import {getTimelineForDay } from '@/utils/track/chartsUtils';

// 1. UPDATE the Props interface
// It now accepts the events, the currently selected day, and a function to update it.
interface Props {
    eventsForDay: Accessor<any[]>;
    timelineDay: Accessor<Date>;
    setTimelineDay: Setter<Date>;
}

export default function Timeline(props: Props) {
    // --- LOCAL UI STATE (Tooltip) ---
    // This state is purely for the UI and can remain local to this component.
    const [hoveredBlock, setHoveredBlock] = createSignal<TimeBlock | null>(null);
    const [tooltipPosition, setTooltipPosition] = createSignal({ x: 0, y: 0 });

    // 2. REMOVE all data fetching and local date state.
    // DELETED: `fetchTimelineData`, `onMount`, `createEffect`, `selectedDate`, `isLoading`, `error` signals.

    // 3. USE createMemo to reactively process the incoming events.
    // This memo will re-run automatically whenever `props.eventsForDay` changes.
    const timelineData = createMemo(() => {
        // The utility function now processes the events passed down via props.
        const blocks = getTimelineForDay(props.eventsForDay());

        let calculatedTotalMinutes = 0;
        for (const block of blocks) {
            const start = parseTime(block.startTime);
            let end = parseTime(block.endTime);
            if (end < start) end += 24 * 60; // Handle overnight blocks
            calculatedTotalMinutes += (end - start);
        }

        return {
            blocks: blocks,
            totalHours: calculatedTotalMinutes / 60,
        };
    });

    // Create simple accessors for easier use in JSX
    const currentTimeline = () => timelineData().blocks;
    const totalHours = () => timelineData().totalHours;


    // 4. UPDATE navigation functions to use props.
    // These now call the setter function from the parent component.
    const goToPreviousDay = () => {
        const newDate = new Date(props.timelineDay());
        newDate.setDate(newDate.getDate() - 1);
        props.setTimelineDay(newDate);
    };

    const goToNextDay = () => {
        const newDate = new Date(props.timelineDay());
        newDate.setDate(newDate.getDate() + 1);
        props.setTimelineDay(newDate);
    };

    // --- TOOLTIP HANDLERS (Unchanged) ---
    const handleMouseEnter = (block: TimeBlock, event: MouseEvent) => {
        setHoveredBlock(block);
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        });
    };

    const handleMouseLeave = () => {
        setHoveredBlock(null);
    };


    return (
        <div class="w-full">
            <LayoutCard hoverable={false} border class="bg-sidebar">
                <div class="h-full w-full p-6">
                    {/* Header: Use `props.timelineDay` for displaying the date */}
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-4">
                            <Calendar class="w-6 h-6 text-accent" />
                            <h2 class="text-xl font-bold text-text/90">Daily Timeline</h2>
                        </div>
                        <div class="flex items-center gap-4">
                            <button onClick={goToPreviousDay} class="p-2 bg-sidebar-light-2 hover:bg-sidebar-light-3 rounded-lg transition-colors">
                                <ChevronLeft class="w-5 h-5 text-text/70" />
                            </button>
                            <div class="text-center min-w-64">
                                <p class="text-lg font-semibold text-text/90">{formatDate(props.timelineDay())}</p>
                                <p class="text-sm text-text/60">
                                    {currentTimeline().length} activities • {totalHours().toFixed(1)}h total
                                </p>
                            </div>
                            <button onClick={goToNextDay} class="p-2 bg-sidebar-light-2 hover:bg-sidebar-light-3 rounded-lg transition-colors">
                                <ChevronRight class="w-5 h-5 text-text/70" />
                            </button>
                        </div>
                    </div>

                    {/* Hour Scale (Unchanged) */}
                    <div class="relative mb-4">
                        <div class="flex justify-between text-xs text-text/50 mb-2">
                            <For each={Array.from({ length: 25 }, (_, i) => i)}>{(hour) => (
                                <div class="flex-1 text-center">{hour < 24 ? `${hour.toString().padStart(2, '0')}` : ''}</div>
                            )}</For>
                        </div>
                        <div class="h-px bg-border-light-2"></div>
                    </div>

                    {/* Timeline Blocks */}
                    <div class="relative h-32 bg-sidebar-light-1 rounded-lg overflow-hidden">
                        {/* Grid Lines */}
                        <For each={Array.from({ length: 24 }, (_, i) => i + 1)}>{(hour) => (
                            <div class="absolute top-0 bottom-0 w-px bg-border-light-2/30" style={`left: ${(hour / 24) * 100}%`}></div>
                        )}</For>

                        {/* 5. SIMPLIFY the <Show> wrapper. No need for isLoading or error. */}
                        <Show when={currentTimeline().length > 0} fallback={<div class="flex items-center justify-center h-full text-text/70">No activity recorded for this day.</div>}>
                            <For each={currentTimeline()}>{(block) => (
                                <div
                                    class={`absolute top-2 h-28 ${getCategoryColor(block.category)} rounded-md shadow-sm border border-white/10 cursor-pointer hover:brightness-110 transition-all duration-200 group`}
                                    style={`left: ${getTimePosition(block.startTime)}%; width: ${getTimeWidth(block.startTime, block.endTime)}%;`}
                                    onMouseEnter={(e) => handleMouseEnter(block, e)}
                                    onMouseLeave={handleMouseLeave}
                                ></div>
                            )}</For>
                        </Show>
                    </div>

                    {/* Tooltip (Unchanged) */}
                    <Show when={hoveredBlock()}>
                        <div
                            class="fixed z-50 bg-sidebar-light-3 border border-border-light-2 rounded-lg shadow-lg p-3 min-w-64 pointer-events-none"
                            style={`left: ${tooltipPosition().x}px; top: ${tooltipPosition().y}px; transform: translateX(-50%) translateY(-100%);`}
                        >
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <div class={`w-3 h-3 ${getCategoryColor(hoveredBlock()!.category)} rounded`}></div>
                                    <h3 class="font-semibold text-text/90">{hoveredBlock()!.activity}</h3>
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-text/60">{formatTime(hoveredBlock()!.startTime)} - {formatTime(hoveredBlock()!.endTime)}</span>
                                    {hoveredBlock()!.productivity && (
                                        <span class="text-accent font-medium">{hoveredBlock()!.productivity}% productive</span>
                                    )}
                                </div>
                                <div class="text-xs text-text/50 capitalize">Category: {hoveredBlock()!.category}</div>
                            </div>
                        </div>
                    </Show>

                    {/* Legend (Unchanged) */}
                    <div class="flex items-center justify-center gap-6 mt-6">
                        <For each={['learning', 'project', 'work', 'break', 'personal', 'sleep'] as unknown as ActivityCategory[]}>
                            {(category) => (
                                <div class="flex items-center gap-2">
                                    <div class={`w-3 h-3 ${getCategoryColor(category as ActivityCategory)} rounded`}></div>
                                    <span class="text-sm text-text/70 capitalize">{category}</span>
                                </div>
                            )}
                        </For>
                    </div>
                </div>
            </LayoutCard>
        </div>
    );
};
