

import TimeTopCards from '@/components/03 - Track/time/TimeTopCards';
import ChartsGrid from '@/components/03 - Track/time/ChartsGrid';
import Timeline from '@/components/03 - Track/time/Timeline';
import TimeRangeSelectors from '@/components/03 - Track/time/TimeRangeSelectors';

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