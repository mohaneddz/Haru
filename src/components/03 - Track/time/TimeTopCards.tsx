import { Clock, TrendingUp, Activity, Timer } from 'lucide-solid';

export default function TimeTopCards () {
  return (
      <div class="grid grid-cols-4 gap-6 z-50">
        <div class="bg-gradient-to-br from-sidebar-light-3 to-accent-dark-3 aspect-[2] rounded-md hover:scale-95 transition-transform duration-200 flex items-center justify-center">
          <div class="flex items-center gap-4">
            <Clock class="w-12 h-12 text-white" />
            <div>
              <p class="text-white/80 text-sm">Today's Total</p>
              <p class="text-white text-2xl font-bold">8.5h</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-sidebar-light-3 to-accent-dark-3 aspect-[2] rounded-md hover:scale-95 transition-transform duration-200 flex items-center justify-center">
          <div class="flex items-center gap-4">
            <TrendingUp class="w-12 h-12 text-white" />
            <div>
              <p class="text-white/80 text-sm">Weekly Avg</p>
              <p class="text-white text-2xl font-bold">7.8h</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-sidebar-light-3 to-accent-dark-3 aspect-[2] rounded-md hover:scale-95 transition-transform duration-200 flex items-center justify-center">
          <div class="flex items-center gap-4">
            <Activity class="w-12 h-12 text-white" />
            <div>
              <p class="text-white/80 text-sm">Productivity</p>
              <p class="text-white text-2xl font-bold">87%</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-sidebar-light-3 to-accent-dark-3 aspect-[2] rounded-md hover:scale-95 transition-transform duration-200 flex items-center justify-center">
          <div class="flex items-center gap-4">
            <Timer class="w-12 h-12 text-white" />
            <div>
              <p class="text-white/80 text-sm">Focus Score</p>
              <p class="text-white text-2xl font-bold">92%</p>
            </div>
          </div>
        </div>
      </div>
  );
};
