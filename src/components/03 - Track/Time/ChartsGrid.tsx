import { createMemo, Show, Accessor } from 'solid-js';

// Import your UI components
import PlotlyChart from '@/components/03 - Track/PlotlyChart';
import LayoutCard from '@/components/02 - Practice/training/LayoutCard';

// IMPORT the data processing functions
import {
    getTimeDataForPeriod,
    getProductivityDataForPeriod,
    getCategoryDataForPeriod,
    getTrendDataForPeriod,
} from '@/utils/track/chartsUtils';

import { dailyLayout, productivityLayout, categoryLayout, weeklyLayout } from '@/utils/track/layoutsUtils';

// Update props interface
interface Props {
    events: Accessor<any[]>;
    timelineDay: Accessor<Date>;
    period: 'week' | 'month' | 'quarter';
}

export default function ChartsGrid(props: Props) {
    // Use the correct period for all chart data
    const dailyData = createMemo(() => getTimeDataForPeriod(props.events(), props.period));
    const categoryData = createMemo(() => getCategoryDataForPeriod(props.events(), props.period));
    const weeklyTrendData = createMemo(() => getTrendDataForPeriod(props.events(), props.period));

    // Productivity chart: filter events for the selected day, but use period for overall context if needed
    const eventsForProductivityChart = createMemo(() => {
        const selected = props.timelineDay();
        const dayStart = new Date(selected);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(selected);
        dayEnd.setHours(23, 59, 59, 999);
        return props.events().filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= dayStart && eventDate <= dayEnd;
        });
    });

    // Pass the correct period to productivity chart
    const productivityData = createMemo(() => getProductivityDataForPeriod(eventsForProductivityChart(), props.period));

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
