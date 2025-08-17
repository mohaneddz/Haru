import { createMemo, Accessor } from 'solid-js';

// UI Component and Icon Imports
import Clock from 'lucide-solid/icons/clock';
import ScoreCard from '@/components/core/Input/ScoreCard';
import TrendingUp from 'lucide-solid/icons/trending-up';
import Activity from 'lucide-solid/icons/activity';
import Timer from 'lucide-solid/icons/timer';

// 1. IMPORT the synchronous utility functions
import {
  getTotalTimeForPeriod,
  getAverageSessionForPeriod,
  getActiveDaysForPeriod,
  getLongestSessionForPeriod
} from '@/utils/track/chartsUtils';

// Define the component's props interface
interface Props {
  events: Accessor<any[]>;
  period: Accessor<'week' | 'month' | 'quarter'>;
}

export default function TimeTopCards(props: Props) {

  // 2. USE createMemo to reactively calculate stats from the events prop.
  // These memos will automatically update whenever props.events() changes.
  const totalTime = createMemo(() => getTotalTimeForPeriod(props.events(), props.period()));
  const averageSession = createMemo(() => getAverageSessionForPeriod(props.events(), props.period()));
  const activeDays = createMemo(() => getActiveDaysForPeriod(props.events(), props.period()));
  const longestSession = createMemo(() => getLongestSessionForPeriod(props.events(), props.period()));

  return (
    <div class="grid grid-cols-4 gap-6 z-50">
      {/* 3. UPDATE the value prop to call the memoized signals directly. */}
      {/* No .loading check is needed here because the calculations are synchronous. */}
      <ScoreCard
        icon={Clock}
        title={`Total ${props.period().charAt(0).toUpperCase() + props.period().slice(1)} Time`}
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