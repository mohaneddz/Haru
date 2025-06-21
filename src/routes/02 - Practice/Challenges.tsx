import { For } from 'solid-js'

import MainSeperator from '@/components/01 - Home/MainSeperator';
import SelectedExercise, { exampleSelectedExercises } from '@/components/02 - Practice/training/SelectedExercise';
import ChallengeCard from '@/components/02 - Practice/ChallengeCard';

export default function Challenges() {
  return (
    <div class='w-full h-full flex flex-col items-center overflow-y-auto z-50'>

      <h1 class='underline'>Today's Challenges</h1>
      <div class="grid grid-cols-3 gap-4 justify-center w-[80%] py-4 my-16">
        <For each={exampleSelectedExercises}>
          {(exercise) => (
            <SelectedExercise
              icon={exercise.icon}
              id={exercise.id}
              name={exercise.name}
              description={exercise.description}
              difficulty={exercise.difficulty}
            />
          )}
        </For>
      </div>

      <MainSeperator title='Challenges' description='Explore our challenges' />

      <div class="grid grid-cols-3 gap-8 justify-center w-[80%] py-4 my-16">
        <ChallengeCard title="Math Challenge" description="Solve complex equations and puzzles to sharpen your math skills." icon="Pi" difficulty="Easy" />
        <ChallengeCard title="Chess Challenge" description="Test your strategic thinking with our chess puzzles." icon="Gamepad2" difficulty="Medium" />
        <ChallengeCard title="Logic Challenge" description="Enhance your reasoning abilities with challenging logic puzzles." icon="Puzzle" difficulty="Hard" />
        <ChallengeCard title="Physics Challenge" description="Tackle real-world physics problems to apply your knowledge." icon="Atom" difficulty="Medium" />
        <ChallengeCard title="Programming Challenge" description="Write efficient code to solve algorithmic problems." icon="Code" difficulty="Hard" />
        <ChallengeCard title="AI Challenge" description="Build and train AI models to solve complex tasks." icon="Bot" difficulty="Medium" />

      </div>

    </div>
  );
};
