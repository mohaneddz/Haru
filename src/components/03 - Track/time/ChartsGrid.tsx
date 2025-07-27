import PlotlyChart from '@/components/03 - Track/PlotlyChart';
import LayoutCard from '@/components/02 - Practice/training/LayoutCard';

import {
    getDailyTimeData,
    getProductivityData,
    getCategoryData,
    getWeeklyTrendData,
    dailyLayout,
    productivityLayout,
    categoryLayout,
    weeklyLayout,
} from @/data/timedata;

export default function ChartsGrid() {
    return (
        <div class="grid grid-cols-2 grid-rows-2 gap-6 h-full ">

            {/* Daily Time Distribution */}
            <LayoutCard hoverable={false} border class="bg-sidebar h-full">
                <div class="h-full aspect-square w-full p-6">
                    <PlotlyChart
                        data={getDailyTimeData()}
                        layout={dailyLayout}
                        class="h-full"
                    />
                </div>
            </LayoutCard>

            {/* Hourly Productivity */}
            <LayoutCard hoverable={false} border class="bg-sidebar h-full">
                <div class="h-full aspect-square w-full p-6">
                    <PlotlyChart
                        data={getProductivityData()}
                        layout={productivityLayout}
                        class="h-full"
                    />
                </div>
            </LayoutCard>

            {/* Category Breakdown */}
            <LayoutCard hoverable={false} border class="bg-sidebar h-full">
                <div class="h-full aspect-square w-full p-6">
                    <PlotlyChart
                        data={getCategoryData()}
                        layout={categoryLayout}
                        class="h-full"
                    />
                </div>
            </LayoutCard>

            {/* Weekly Trend */}
            <LayoutCard hoverable={false} border class="bg-sidebar h-full">
                <div class="h-full aspect-square w-full p-6">
                    <PlotlyChart
                        data={getWeeklyTrendData()}
                        layout={weeklyLayout}
                        class="h-full"
                    />
                </div>
            </LayoutCard>
        </div>
    );
};
