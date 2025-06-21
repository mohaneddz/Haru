import BrainCanvas from '@/components/03 - Track/BrainCanvas';
import UsageMetricsChart from '@/components/03 - Track/UsageMetricsChart';
import ProgressPieChart from '@/components/03 - Track/ProgressPieChart';

import LayoutCard from '@/components/02 - Practice/training/LayoutCard';

export default function Insights() {

  return (
    <main class="overflow-y-scroll w-full h-full">

      <div class="flex flex-col w-full h-max gap-4 p-4 max-w-[90%] mx-auto overflow-y-scroll">

        <LayoutCard border hoverable={false} class="w-full bg-sidebar-light-1 flex items-center justify-between px-6 rounded-lg text-xl font-semibold text-white ">
          <span>Brain Training Progress</span>
          <span class="text-sm font-normal text-gray-400">Visualize how your brain is learning</span>
        </LayoutCard>


        <BrainCanvas class="h-full " />

        <LayoutCard border hoverable={false} class="w-full bg-sidebar-light-1 flex items-center justify-between px-6 rounded-lg text-xl font-semibold text-white">
          <span>Advanced Analytics</span>
          <span class="text-sm font-normal text-gray-400">Deep insights into your learning patterns</span>
        </LayoutCard>

        <LayoutCard border hoverable={false} class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UsageMetricsChart />
          <ProgressPieChart />
        </LayoutCard>
        
      </div>

    </main>
  );
}
