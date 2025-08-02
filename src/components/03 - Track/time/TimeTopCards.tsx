import { createMemo, Accessor } from 'solid-js';

// UI Component and Icon Imports
import { Clock, TrendingUp, Activity, Timer } from 'lucide-solid';
import ScoreCard from '@/components/core/Input/ScoreCard';

// 1. IMPORT the synchronous utility functions
import {
  getTotalTime,
  getAverageSession,
  getActiveDays,
  getLongestSession
} from '@/utils/track/chartsUtils';

// Define the component's props interface
interface Props {
  events: Accessor<any[]>;
}

export default function TimeTopCards(props: Props) {

  // 2. USE createMemo to reactively calculate stats from the events prop.
  // These memos will automatically update whenever props.events() changes.
  const totalTime = createMemo(() => getTotalTime(props.events()));
  const averageSession = createMemo(() => getAverageSession(props.events()));
  const activeDays = createMemo(() => getActiveDays(props.events()));
  const longestSession = createMemo(() => getLongestSession(props.events()));

  return (
    <div class="grid grid-cols-4 gap-6 z-50">
      {/* 3. UPDATE the value prop to call the memoized signals directly. */}
      {/* No .loading check is needed here because the calculations are synchronous. */}
      <ScoreCard
        icon={Clock}
        title="Total Week Time"
        value={totalTime()}
      />
      <ScoreCard
        icon={TrendingUp}
        title="Average Session"
        value={averageSession()}
      />
      <ScoreCard
        icon={Activity}
        title="Active Days"
        value={activeDays()}
      />
      <ScoreCard
        icon={Timer}
        title="Longest Session"
        value={longestSession()}
      />
    </div>
  );
};