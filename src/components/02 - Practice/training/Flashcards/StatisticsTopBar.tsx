import { Flame, TrendingUp, Activity, WalletCards } from "lucide-solid";
import ScoreCard from "@/components/core/Input/ScoreCard";

interface Props{
    data?: any;
}

export default function StatisticsTopBar(props: Props) {
    return (
        <div class="grid grid-cols-4 gap-6 z-50">
            <ScoreCard
                icon={Flame}
                title="Current Streak"
                value={`5 Days`}
            />

            <ScoreCard
                icon={TrendingUp}
                title="Average Accuracy"
                value={`85%`}
            />

            <ScoreCard
                icon={Activity}
                title="Active Days"
                value={`15 Days`}
            />

            <ScoreCard
                icon={WalletCards}
                title="Cards Reviewed"
                value={`120 Cards`}
            />
        </div>
    );
};
