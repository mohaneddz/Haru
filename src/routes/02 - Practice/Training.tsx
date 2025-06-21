import LayoutCard from '@/components/02 - Practice/training/LayoutCard';

import ProgressBar from '@/components/core/ProgressBar';
import CheckEntry from '@/components/02 - Practice/CheckEntry';

function Flair() {
  return (
    <div class="flex flex-col items-center justify-center w-full p-4 bg-gradient-to-b from-gray-800/15 to-gray-900/15 text-white/40 rounded">
      <p>Keep your skills sharp!</p>
    </div>
  );
}

export default function Training() {

  return (

    <div class="w-full h-full flex flex-col items-center overflow-y-auto z-50">
      <Flair />

      <div class="grid grid-rows-3 grid-cols-3 gap-4 flex-1 my-16 w-[80%] p-4">

        <LayoutCard variation="tall">
          <div class="flex flex-col items-center justify-center text-center gap-2">
            <h2>Worksheets</h2>
            <p class="text-sm text-gray-400 mb-8">Downloadable or interactive PDF practice sets for logic, math, and science.</p>

            <h5 class='mb-4 text-text/90'>Latest Progress</h5>

            <ul class='w-full px-6'>
              {/* example complettion bar for past worksheets (fill bar) */}
              <li class='w-full'><ProgressBar text="Complex Numbers" progress={50} /></li>
              <li class='w-full'><ProgressBar text="Hypothesis Testing" progress={70} /></li>
              <li class='w-full'><ProgressBar text="DB Normalization" progress={30} /></li>
              <li class='w-full text-text/30'>...</li>
            </ul>

          </div>
        </LayoutCard>

        <LayoutCard>
          <div class="flex flex-col items-center justify-center text-center gap-2">
            <h2>Coding Challenges</h2>
            <p class="text-sm text-gray-400 mb-4">Timed code drills with auto-grading—debug, write, or optimize fast.</p>
            <div class="flex">
              <p class='text-text/40'>Total Solved :&nbsp;</p>
              <p class='text-text'> 40</p>
            </div>
          </div>
        </LayoutCard>

        <LayoutCard>
          <div class="flex flex-col items-center justify-center text-center gap-2">
            <h2>Quizzes</h2>
            <p class="text-sm text-gray-400 mb-4">AI-adaptive questions across theory, logic, and memory to sharpen recall.</p>

            <div class="flex">
              <p class='text-text/40'>Last Visisted :&nbsp;</p>
              <p class='text-text'>3 Days Ago</p>
            </div>

          </div>
        </LayoutCard>

        <LayoutCard>
          <div class="flex flex-col items-center justify-center text-center gap-2">
            <h2>Socratic Coach</h2>
            <p class="text-sm text-gray-400 mb-4">An AI tutor that questions your logic until it finds a gap—and trains it.</p>
            <div class="flex">
              <p class='text-text/40'>Suggested Topic :&nbsp;</p>
              <p class='text-text'>Time Series</p>
            </div>
          </div>
        </LayoutCard>

        <LayoutCard variation="tall">
          <div class="flex flex-col items-center justify-center text-center gap-2">
            <h2>Flashcards</h2>
            <p class="text-sm text-gray-400 mb-8">Auto-generated decks from your notes. Built-in spaced repetition.</p>

            <h5 class='mb-4 text-text/90'>Latest Progress</h5>

            <ul class='w-full px-6'>
              {/* example complettion bar for past worksheets (fill bar) */}
              <li class='w-full'><ProgressBar text="Complex Numbers" progress={50} /></li>
              <li class='w-full'><ProgressBar text="Hypothesis Testing" progress={70} /></li>
              <li class='w-full'><ProgressBar text="DB Normalization" progress={30} /></li>
              <li class='w-full text-text/30'>...</li>
            </ul>

          </div>
        </LayoutCard>

        <LayoutCard variation="wide" hoverable={false}>

          <div class="flex flex-col items-center justify-center text-center gap-2">
            <h2>Daily Drills</h2>
            <p class="text-sm text-gray-400">Stay consistent with essential brain & skill reps.</p>
          </div>

          <div class="grid grid-cols-2 gap-4 w-full mt-4 px-16">
            <div>
              <CheckEntry title="Math" done={true} />
              <CheckEntry title="Logic" done={false} />
              <CheckEntry title="Science" done={false} />
            </div>
            <div>
              <CheckEntry title="Flashcards" done={false} />
              <CheckEntry title="Coding" done={true} />
              <CheckEntry title="Quiz" done={false} />
            </div>
          </div>
        </LayoutCard>

      </div>

    </div>
  );
};
