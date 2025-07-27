import LayoutCard from '@/components/02 - Practice/training/LayoutCard';
import {createMemo, createSignal} from 'solid-js';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-solid';
import { For } from 'solid-js';

import {
    timelineData,
    TimeBlock,
    getCategoryColor,
    getTimeWidth,
    getTimePosition,
    parseTime,
    formatTime,
    formatDate,
} from '@/data/timedata';

export default function Timeline() {
    
    const [selectedDate, setSelectedDate] = createSignal(new Date('2025-06-21'));
    const [hoveredBlock, setHoveredBlock] = createSignal<TimeBlock | null>(null);
    const [tooltipPosition, setTooltipPosition] = createSignal({ x: 0, y: 0 });  
    const currentTimeline = createMemo(() => {
        const dateKey = selectedDate().toISOString().split('T')[0];
        const data = timelineData[dateKey];
        return Array.isArray(data) ? data : [];
    });

    // Calculate total hours
    const totalHours = createMemo(() => {
        const timeline = currentTimeline();
        if (!Array.isArray(timeline) || timeline.length === 0) return 0;
        
        return timeline.reduce((acc, block) => {
            const start = parseTime(block.startTime);
            let end = parseTime(block.endTime);
            if (end < start) end += 24 * 60;
            return acc + (end - start);
        }, 0) / 60;
    });// Navigation functions
    const goToPreviousDay = () => {
        const newDate = new Date(selectedDate());
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const goToNextDay = () => {
        const newDate = new Date(selectedDate());
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };    // Tooltip handlers
    const handleMouseEnter = (block: TimeBlock, event: MouseEvent) => {
        setHoveredBlock(block);
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        });
    };

    const handleMouseLeave = () => {
        setHoveredBlock(null);
    };

    return (
        <div class="w-full">
            <LayoutCard hoverable={false} border class="bg-sidebar">
                <div class="h-full w-full p-6">

                    {/* Timeline Header */}
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-4">
                            <Calendar class="w-6 h-6 text-accent" />
                            <h2 class="text-xl font-bold text-text/90">Daily Timeline</h2>
                        </div>

                        {/* Date Navigation */}
                        <div class="flex items-center gap-4">
                            <button
                                onClick={goToPreviousDay}
                                class="p-2 bg-sidebar-light-2 hover:bg-sidebar-light-3 rounded-lg transition-colors"
                            >
                                <ChevronLeft class="w-5 h-5 text-text/70" />
                            </button>                            <div class="text-center min-w-64">
                                <p class="text-lg font-semibold text-text/90">{formatDate(selectedDate())}</p>
                                <p class="text-sm text-text/60">
                                    {currentTimeline().length} activities • {totalHours().toFixed(1)}h total
                                </p>
                            </div>

                            <button
                                onClick={goToNextDay}
                                class="p-2 bg-sidebar-light-2 hover:bg-sidebar-light-3 rounded-lg transition-colors"
                            >
                                <ChevronRight class="w-5 h-5 text-text/70" />
                            </button>
                        </div>
                    </div>

                    {/* Hour Scale */}
                    <div class="relative mb-4">
                        <div class="flex justify-between text-xs text-text/50 mb-2">
                            <For each={Array.from({ length: 25 }, (_, i) => i)}>
                                {(hour) => (
                                    <div class="flex-1 text-center">
                                        {hour < 24 ? `${hour.toString().padStart(2, '0')}` : ''}
                                    </div>
                                )}
                            </For>
                        </div>
                        <div class="h-px bg-border-light-2"></div>
                    </div>                    {/* Timeline Blocks */}
                    <div class="relative h-32 bg-sidebar-light-1 rounded-lg overflow-hidden">

                        {/* Hour grid lines */}
                        <For each={Array.from({ length: 24 }, (_, i) => i + 1)}>
                            {(hour) => (
                                <div
                                    class="absolute top-0 bottom-0 w-px bg-border-light-2/30"
                                    style={`left: ${(hour / 24) * 100}%`}
                                ></div>
                            )}
                        </For>

                        {/* Activity blocks */}
                        <For each={currentTimeline()}>
                            {(block) => (
                                <div
                                    class={`absolute border-e-black/70 top-2 h-28 ${getCategoryColor(block.category)} rounded-md shadow-sm border border-white/10 cursor-pointer hover:brightness-110 transition-all duration-200 group`}
                                    style={`left: ${getTimePosition(block.startTime)}%; width: ${getTimeWidth(block.startTime, block.endTime)}%;`}
                                    onMouseEnter={(e) => handleMouseEnter(block, e)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                </div>
                            )}
                        </For>
                    </div>

                    {/* Tooltip */}
                    {hoveredBlock() && (
                        <div
                            class="fixed z-50 bg-sidebar-light-3 border border-border-light-2 rounded-lg shadow-lg p-3 min-w-64 pointer-events-none"
                            style={`left: ${tooltipPosition().x}px; top: ${tooltipPosition().y}px; transform: translateX(-50%) translateY(-100%);`}
                        >
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <div class={`w-3 h-3 ${getCategoryColor(hoveredBlock()!.category)} rounded`}></div>
                                    <h3 class="font-semibold text-text/90">{hoveredBlock()!.activity}</h3>
                                </div>
                                
                                {hoveredBlock()!.description && (
                                    <p class="text-sm text-text/70">{hoveredBlock()!.description}</p>
                                )}
                                
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-text/60">
                                        {formatTime(hoveredBlock()!.startTime)} - {formatTime(hoveredBlock()!.endTime)}
                                    </span>
                                    {hoveredBlock()!.productivity && (
                                        <span class="text-accent font-medium">
                                            {hoveredBlock()!.productivity}% productive
                                        </span>
                                    )}
                                </div>
                                
                                <div class="text-xs text-text/50 capitalize">
                                    Category: {hoveredBlock()!.category}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div class="flex items-center justify-center gap-6 mt-6">
                        <div class="flex items-center gap-2">
                            <div class={`w-3 h-3 ${getCategoryColor('learning')} rounded`}></div>
                            <span class="text-sm text-text/70">Learning</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class={`w-3 h-3 ${getCategoryColor('project')} rounded`}></div>
                            <span class="text-sm text-text/70">Projects</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class={`w-3 h-3 ${getCategoryColor('work')} rounded`}></div>
                            <span class="text-sm text-text/70">Work</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class={`w-3 h-3 ${getCategoryColor('break')} rounded`}></div>
                            <span class="text-sm text-text/70">Breaks</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class={`w-3 h-3 ${getCategoryColor('personal')} rounded`}></div>
                            <span class="text-sm text-text/70">Personal</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class={`w-3 h-3 ${getCategoryColor('sleep')} rounded`}></div>
                            <span class="text-sm text-text/70">Sleep</span>
                        </div>
                    </div>

                </div>
            </LayoutCard>
        </div>
    );
};
