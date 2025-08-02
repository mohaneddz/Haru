import { createMemo, Show, Accessor } from 'solid-js';

// Import your UI components
import PlotlyChart from '@/components/03 - Track/PlotlyChart';
import LayoutCard from '@/components/02 - Practice/training/LayoutCard';

// IMPORT the data processing functions
import {
    getDailyTimeData,
    getProductivityData,
    getCategoryData,
    getWeeklyTrendData,
} from '@/utils/track/chartsUtils';

import { dailyLayout, productivityLayout, categoryLayout, weeklyLayout } from '@/utils/track/layoutsUtils';

// Update props interface
interface Props {
    events: Accessor<any[]>;
    timelineDay: Accessor<Date>;
}

export default function ChartsGrid(props: Props) {
    // These memos are correct as they don't mutate anything
    const dailyData = createMemo(() => getDailyTimeData(props.events()));
    const categoryData = createMemo(() => getCategoryData(props.events()));
    const weeklyTrendData = createMemo(() => getWeeklyTrendData(props.events()));

    // This is the memo that needs to be fixed
    const eventsForProductivityChart = createMemo(() => {
        const selected = props.timelineDay();

        // --- THE FIX ---
        // Create NEW Date objects to avoid mutating the original signal
        const dayStart = new Date(selected);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(selected);
        dayEnd.setHours(23, 59, 59, 999);
        // --- END OF FIX ---

        // Now the filter will work without causing side effects
        return props.events().filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= dayStart && eventDate <= dayEnd;
        });
    });

    // This memo now safely uses the purely calculated events
    const productivityData = createMemo(() => getProductivityData(eventsForProductivityChart()));

    return (
        <div class="grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2 gap-6 h-full ">

            {/* Daily Time Distribution */}
            <LayoutCard hoverable={false} border class="bg-sidebar h-full">
                <div class="h-full aspect-square w-full p-6">
                    <Show when={dailyData()} fallback={<div class="text-white">Loading Chart...</div>}>
                        <PlotlyChart data={dailyData()} layout={dailyLayout} class="h-full" />
                    </Show>
                </div>
            </LayoutCard>

            {/* Hourly Productivity */}
            <LayoutCard hoverable={false} border class="bg-sidebar h-full">
                <div class="h-full aspect-square w-full p-6">
                    {/* This Show/PlotlyChart will now update correctly */}
                    <Show when={productivityData()} fallback={<div class="text-white">Loading Chart...</div>}>
                        <PlotlyChart data={productivityData()} layout={productivityLayout} class="h-full" />
                    </Show>
                </div>
            </LayoutCard>

            {/* Category Breakdown */}
            <LayoutCard hoverable={false} border class="bg-sidebar h-full">
                <div class="h-full aspect-square w-full p-6">
                    <Show when={categoryData() && categoryData().length > 0 && categoryData()[0] && (categoryData()[0] as any).values?.length > 0} fallback={<div class="text-white">Loading Chart...</div>}>
                        <PlotlyChart
                            data={categoryData()}
                            layout={categoryLayout}
                            class="h-full"
                        />
                    </Show>
                </div>
            </LayoutCard>

            {/* Weekly Trend */}
            <LayoutCard hoverable={false} border class="bg-sidebar h-full">
                <div class="h-full aspect-square w-full p-6">
                    <Show when={weeklyTrendData()} fallback={<div class="text-white">Loading Chart...</div>}>
                        <PlotlyChart data={weeklyTrendData()} layout={weeklyLayout} class="h-full" />
                    </Show>
                </div>
            </LayoutCard>
        </div>
    );
};
