

import TimeTopCards from '@/components/03 - Track/Time/TimeTopCards';
import ChartsGrid from '@/components/03 - Track/Time/ChartsGrid';
import Timeline from '@/components/03 - Track/Time/Timeline';
import TimeRangeSelectors from '@/components/03 - Track/Time/TimeRangeSelectors';

export default function Time() {

  return (
    <main class='flex flex-col h-full w-full p-8 px-16  gap-8 overflow-y-auto'>

      <TimeTopCards />
      <TimeRangeSelectors />
      <ChartsGrid />
      <Timeline/>

    </main>
  );
}