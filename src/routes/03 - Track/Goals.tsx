import LeftMenu from '@/components/03 - Track/Goals/LeftMenu';
import RightMenu from '@/components/03 - Track/Goals/RightMenu';
import GoalsFlair from '@/components/03 - Track/Goals/GoalsFlair';

import SelectInput from '@/components/core/Input/SelectInput';
import Modal from '@/components/core/Modal';
import useGoals from '@/hooks/tracking/useGoals';

export default function Goals() {

  const {
    goalAddModalOpen,
    setGoalAddModalOpen,
    habitAddModalOpen,
    setHabitAddModalOpen,
    projectAddModalOpen,
    setProjectAddModalOpen,

    // createTask,
    createGoal,
    createHabit
  } = useGoals();

  return (
    <main class='flex flex-col h-screen w-full p-8  gap-8 overflow-hidden'>

      <GoalsFlair progress={80} name={"SolidJS Crash course"} />

      {/* Modals */}
      <Modal show={goalAddModalOpen()} onClose={() => setGoalAddModalOpen(false)}>
        <div class=" mb-2 w-[20vw] p-4 center flex-col gap-4">
          <p class="text-xl text-accent font-semibold">Add Goal</p>
          <div class="grid grid-cols-2 justify-stretch gap-4 items-center ">
            <input id="goal-input" type="text" class="p-2 col-span-2 rounded bg-background-light-2 border border-gray-400" placeholder="Enter your goal..." />
            <input
              id="goal-date"
              type="date"
              class="p-2 col-span-2 rounded bg-background-light-2 border border-gray-400 text-white"
              value={new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]}
              placeholder="Enter your goal..."
            />
            <p>Priority</p>
            <SelectInput
              id="goal-priority"
              options={[
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Normal', label: 'Normal' },
                { value: 'Low', label: 'Low' }
              ]}
            />
            <button class="clickable px-4 py-2 rounded bg-gray-700 text-white" onClick={() => setGoalAddModalOpen(false)}>Cancel</button>
            <button class="clickable px-4 py-2 rounded bg-accent text-white" onClick={() => createGoal()}>Add</button>
          </div>
        </div>
      </Modal>

      <Modal show={habitAddModalOpen()} onClose={() => setHabitAddModalOpen(false)}>
        <div class="mb-2 w-[20vw] p-4 center flex-col gap-4">
          <p class="text-xl text-accent font-semibold">Add Habit</p>
          <div class="grid grid-cols-2 justify-stretch gap-4">
            <input id="habit-input" type="text" class="p-2 col-span-2 rounded bg-background-light-2 border border-gray-400" placeholder="Enter your habit..." />
            <input id="habit-repetition" type="text" class="p-2 col-span-2 rounded bg-background-light-2 border border-gray-400" placeholder="Repetition style..." />
            <p>Priority</p>
            <SelectInput
              id="habit-priority"
              options={[
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Normal', label: 'Normal' },
                { value: 'Low', label: 'Low' }
              ]}
            />
            <button class="clickable px-4 py-2 rounded bg-gray-700 text-white" onClick={() => setHabitAddModalOpen(false)}>Cancel</button>
            <button class="clickable px-4 py-2 rounded bg-accent text-white" onClick={() => createHabit()}>Add</button>
          </div>
        </div>
      </Modal>

      <Modal show={projectAddModalOpen()} onClose={() => setProjectAddModalOpen(false)}>
        <div class=" mb-2 w-[20vw] p-4 center flex-col gap-4">
          <p class="text-xl text-accent font-semibold">Add Project</p>
          <div class="grid grid-cols-2 justify-stretch gap-4">
            <input type="text" class="p-2 col-span-2 rounded bg-background-light-2 border border-gray-400" placeholder="Enter your project..." />
            <button class="clickable px-4 py-2 rounded bg-gray-700 text-white" onClick={() => setProjectAddModalOpen(false)}>Cancel</button>
            <button class="clickable px-4 py-2 rounded bg-accent text-white">Add</button>
          </div>
        </div>
      </Modal>

      <div class="h-full w-full grid grid-cols-5 gap-6 overflow-hidden">
        <LeftMenu />
        <RightMenu setGoalAddModalOpen={setGoalAddModalOpen} setHabitAddModalOpen={setHabitAddModalOpen} setProjectAddModalOpen={setProjectAddModalOpen} />
      </div>
    </main>
  );
}
