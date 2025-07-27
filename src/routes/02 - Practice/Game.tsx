import { useLocation } from '@solidjs/router';
import { createMemo, createResource } from 'solid-js';
import overlay from '@/assets/overlay.png';
import { loadCourseData as loadGameData, CourseInfo as GameInfo } from '@/utils/courses/loadCourse';

import { PlayCircle } from 'lucide-solid';
import CourseInfoTopCard from '@/components/01 - Home/Cards/CourseInfoTopCard';

import GameCard from '@/components/02 - Practice/GameCard';

import rts from '/data/games/rts.png';
import sort from '/data/games/sort.jpg';
import ttt from '/data/games/tic-tac-toe.jpg';

export default function Game() {
  const location = useLocation();

  const [gameData] = createResource(loadGameData);

  const gameName = createMemo(() => {
    const segments = location.pathname
      .split('/')
      .filter(Boolean);

    console.log('URL segments:', segments);

    const gameIndex = segments.findIndex(segment => segment === 'game' || segment === 'games');
    if (gameIndex !== -1 && gameIndex + 1 < segments.length) {
      const gameSegment = segments[gameIndex + 1];
      return gameSegment.replace(/-/g, ' ').toLowerCase();
    }

    return 'Unknown';
  });

  const displayName = createMemo(() => {
    return gameName()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  // Move getDefaultGame BEFORE currentGame
  const getDefaultGame = (): GameInfo => ({
    name: gameName(),
    description: `This game covers the fundamentals of ${displayName()}.`,
    topics: [
      `Introduction to ${displayName()}`,
      'Core Concepts and Techniques',
      'Practical Applications',
      'Advanced Topics'
    ],
    image: '/data/games/sudoku.png',
    difficulty: 'Intermediate',
    duration: '8 weeks',
    prerequisites: ['Basic Programming']
  });

  // Get current game data or fallback
  const currentGame = createMemo((): GameInfo => {
    const data = gameData();
    if (!data) return getDefaultGame();

    const game = data[gameName()];
    if (game) return game;

    return getDefaultGame();
  });

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-auto">
      {gameData.loading && (
        <div class="flex items-center justify-center h-full">
          <div class="text-xl">Loading game data...</div>
        </div>
      )}

      {!gameData.loading && (
        <>
          <div class="relative border-b-2 border-white/20 w-full">
            <div class="overflow-y-hidden  h-[30vh]">
              <img src={currentGame().image} alt={displayName()} class="w-full h-[30vh] object-cover blur-sm" />
              <img src={overlay} alt="" class="absolute inset-0 w-full h-full object-cover opacity-70 z-10 pointer-events-none" />
            </div>
            <div class="absolute inset-0 bg-black/40 z-20" />
            <h1 class='absolute bottom-4 left-4 text-7xl font-black text-white drop-shadow-lg z-30'>{displayName()}</h1>
            <a class='absolute px-6 py-2 bottom-4 rounded-md right-4 bg-accent z-30 clickable' href={`/practice/games/play/${gameName()}`}>
              <PlayCircle class="inline-block mr-2 text-white" />
              Play
            </a>
          </div>

          <div class="flex flex-col w-full p-6 flex-1 max-w-6xl">

            {/* Game Info Cards */}
            <div class="grid grid-cols-3 gap-4 mb-6">
              <CourseInfoTopCard value={currentGame().difficulty} attribute="Difficulty" />
              <CourseInfoTopCard value={currentGame().duration} attribute="Duration" />
              <CourseInfoTopCard value={currentGame().prerequisites.join(', ')} attribute="Prerequisites" />
            </div>

            <p class="text-3xl font-bold text-sidebar-light-3 mb-4 brightness-120">Game Overview</p>

            <p class="text-text/70 mb-6 text-lg leading-relaxed">
              {currentGame().description}
            </p>

            {/* Game Topics */}
            <div class="mb-8">
              <h3 class="text-xl font-semibold text-sidebar-light-3 pb-4">What this game teaches you</h3>
              <div class="grid grid-cols-2 gap-3">
                {currentGame().topics.map((topic: string, index: number) => (
                  <div class="flex items-start space-x-3 p-3 bg-accent-dark-3/50 rounded-lg transition-all duration-300 hover:bg-accent-dark-2/70 hover:scale-105 hover:shadow-lg cursor-pointer group transform">
                    <span class="flex-shrink-0 w-6 h-6 bg-accent-light-1 text-accent-dark-3 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 group-hover:bg-white group-hover:scale-110">
                      {index + 1}
                    </span>
                    <span class="text-text/80 group-hover:text-white transition-colors duration-300">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div class='h-[2px] my-6 w-full bg-sidebar' />

            <p class="text-3xl font-bold text-sidebar-light-3 mb-6 brightness-120">Similar Games</p>

            <div class="grid grid-cols-3 w-full gap-6 mb-20">
              <GameCard
                title="RTS Mini"
                description="Resource war: micromanage and win."
                icon="Activity"
                img={rts}
              />
              <GameCard
                title="Number Sort"
                description="Arrange numbers correctly with minimal moves."
                icon="ListOrdered"
                img={sort}
              />
              <GameCard
                title="Tic Tac Toe+"
                description="Advanced twist on the classic 3x3."
                icon="AppWindow"
                img={ttt}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};