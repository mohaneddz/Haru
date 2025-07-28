import { Clock, TrendingUp, Activity, Timer } from 'lucide-solid';
import ScoreCard from '@/components/core/Input/ScoreCard';

export default function TimeTopCards () {
  return (
      <div class="grid grid-cols-4 gap-6 z-50">
        <ScoreCard
          icon={Clock}
          title="Total Time"
          value="12h 34m"
        />
        <ScoreCard
          icon={TrendingUp}
          title="Average Session"
          value="45m 20s"
        />
        <ScoreCard
          icon={Activity}
          title="Active Days"
          value="20 days"
        />
        <ScoreCard
          icon={Timer}
          title="Longest Session"
          value="2h 15m"
        />

      </div>
  );
};
