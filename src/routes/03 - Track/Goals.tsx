import LeftMenu from '@/components/03 - Track/Goals/LeftMenu';
import RightMenu from '@/components/03 - Track/Goals/RightMenu';
import GoalsFlair from '@/components/03 - Track/Goals/GoalsFlair';

export default function Goals() {

  return (
    <main class='flex flex-col h-screen w-full p-8  gap-8 overflow-hidden'>

      <GoalsFlair progress={80} name={"SolidJS Crash course"}  />

      <div class="h-full w-full grid grid-cols-5 gap-6 overflow-hidden">

        <LeftMenu />
        <RightMenu />

      </div>
    </main>
  );
}
