import LeftMenu from '@/components/03 - Track/goals/LeftMenu';
import RightMenu from '@/components/03 - Track/goals/RightMenu';
import GoalsFlair from '@/components/03 - Track/goals/GoalsFlair';

export default function Goals() {

  return (
    <main class='flex flex-col h-full w-full p-8 gap-8'>

      <GoalsFlair progress={80} name={"SolidJS Crash course"}  />

      <div class="h-full w-full grid grid-cols-5 gap-6 mb-12">

        <LeftMenu />
        <RightMenu />

      </div>
    </main>

  );
}
