import { Target, Trophy, Calendar } from 'lucide-solid'
import { BookOpen, Briefcase } from 'lucide-solid';
import LayoutCard from "@/components/02 - Practice/training/LayoutCard";

export default function RightMenu() {
    return (
        <div class="w-full h-full rounded-md col-span-2 flex flex-col gap-4 overflow-hidden">

            {/* Upper part */}
            <div class="w-full gap-4 p-8 rounded-md bg-sidebar" >

                <div class="grid grid-cols-3 w-full gap-4 h-max">
                    <div class="aspect-square">
                        <LayoutCard border class="w-full gap-4 flex-1/3 h-full hover:bg-accent/10 transition-colors" >
                            <Target class="text-accent w-10 h-10" />
                            <p class='text-text/70 text-[0.5rem] lg:text-sm font-medium text-nowrap'>New Goal</p>
                        </LayoutCard>
                    </div>

                    <div class="aspect-square">
                        <LayoutCard border class="w-full gap-4 flex-1/3 h-full hover:bg-accent/10 transition-colors" >
                            <BookOpen class="text-accent w-10 h-10" />
                            <p class='text-text/70 text-[0.5rem] lg:text-sm font-medium text-nowrap'>Study Plan</p>
                        </LayoutCard>
                    </div>

                    <div class="aspect-square">
                        <LayoutCard border class="w-full gap-4 flex-1/3 h-full hover:bg-good/10 transition-colors" >
                            <Briefcase class="text-accent w-10 h-10" />
                            <p class='text-text/70 text-[0.5rem] lg:text-sm font-medium text-nowrap'>Project</p>
                        </LayoutCard>
                    </div>

                </div>

            </div>

            {/* Lower part */}
            
            <div class="w-full gap-4 p-8 rounded-md bg-sidebar h-full flex flex-col overflow-y-auto" >

                <div class="flex items-center justify-between mb-4">
                    <h2 class='text-lg font-semibold text-text/70'>Achievement Streak</h2>
                    <Calendar class="text-accent w-5 h-5" />
                </div>

                <div class="flex flex-col gap-3 flex-1">
                    <div class="bg-sidebar-light-2/20 rounded-lg p-4 border border-border-light-2">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-text/60">Current Streak</span>
                            <Trophy class="text-accent w-4 h-4" />
                        </div>
                        <p class="text-2xl font-bold text-accent">12 days</p>
                    </div>

                    <div class="bg-sidebar-light-2/20 rounded-lg p-4 border border-border-light-2">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-text/60">This Week</span>
                            <Target class="text-accent w-4 h-4" />
                        </div>
                        <p class="text-xl font-semibold text-text/70">3 goals completed</p>
                    </div>

                    <div class="bg-sidebar-light-2/20 rounded-lg p-4 border border-border-light-2">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-text/60">Best Streak</span>
                            <Trophy class="text-accent w-4 h-4" />
                        </div>
                        <p class="text-lg font-medium text-text/70">28 days</p>
                    </div>
                </div>

            </div>

        </div>
    );
};
