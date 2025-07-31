import FlashCardsHeatmap from "@/components/02 - Practice/training/Flashcards/Heatmap";
import PlotlyChart from '@/components/03 - Track/PlotlyChart';
import LayoutCard from '@/components/02 - Practice/training/LayoutCard';

import {
  getWeeklyTrendData,
  weeklyLayout,
} from '@/data/timedata';

import { Activity, BookOpenCheck } from "lucide-solid";

export default function StatisticsMainContent() {
    return (

        <div class="grid grid-cols-3 grid-rows-2 gap-6 h-max">

            <FlashCardsHeatmap />

            <LayoutCard hoverable={false} border class="bg-sidebar">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-cyan-400 mb-4 flex items-center">
                        <BookOpenCheck class="w-5 h-5 mr-2" /> Deck Performance
                    </h3>
                    <p class="text-sm text-gray-500 mb-2">Accuracy by deck</p>
                    <ul class="space-y-3 pt-2 ml-0 pl-0">
                        <li class="flex items-center justify-between">
                            <span class="text-sm text-gray-300">React Hooks</span>
                            <span class="text-sm font-bold text-green-400">92%</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-sm text-gray-300">JavaScript Algorithms</span>
                            <span class="text-sm font-bold text-yellow-400">78%</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-sm text-gray-300">CSS Properties</span>
                            <span class="text-sm font-bold text-green-400">95%</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-sm text-gray-300">System Design</span>
                            <span class="text-sm font-bold text-red-400">65%</span>
                        </li>
                    </ul>
                </div>
            </LayoutCard>

            <div class="row-span-2">
                <LayoutCard hoverable={false} border class="bg-sidebar h-full overflow-y-auto">
                    <div class="h-full w-full p-6">
                        <h3 class="text-lg font-semibold text-cyan-400 mb-4 flex items-center">
                            <Activity class="w-5 h-5 mr-2" /> Recent Activity
                        </h3>
                        <p class="text-sm text-gray-500 mb-2">Last 10 sessions</p>

                        <ul class="space-y-2">
                            <li class="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                                <span class="text-sm text-gray-300">Reviewed 20 cards</span>
                                <span class="text-xs text-gray-500">2 hours ago</span>
                            </li>
                            <li class="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                                <span class="text-sm text-gray-300">Reviewed 15 cards</span>
                                <span class="text-xs text-gray-500">1 day ago</span>
                            </li>
                            <li class="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                                <span class="text-sm text-gray-300">Reviewed 30 cards</span>
                                <span class="text-xs text-gray-500">3 days ago</span>
                            </li>
                            <li class="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                                <span class="text-sm text-gray-300">Reviewed 25 cards</span>
                                <span class="text-xs text-gray-500">5 days ago</span>
                            </li>
                            {/* Duplicated for example length */}
                            <li class="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                                <span class="text-sm text-gray-300">Reviewed 12 cards</span>
                                <span class="text-xs text-gray-500">5 days ago</span>
                            </li>
                            <li class="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                                <span class="text-sm text-gray-300">Reviewed 40 cards</span>
                                <span class="text-xs text-gray-500">6 days ago</span>
                            </li>
                        </ul>
                    </div>
                </LayoutCard>
            </div>

            <div class="col-span-2">
                <LayoutCard hoverable={false} border class="bg-sidebar h-full">
                    <div class="h-full w-full p-6">
                        <PlotlyChart
                            data={getWeeklyTrendData()}
                            layout={weeklyLayout}
                            class="h-full"
                        />
                    </div>
                </LayoutCard>
            </div>

        </div>
    );
};
