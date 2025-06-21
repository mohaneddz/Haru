import MainSeperator from "@/components/01 - Home/MainSeperator";
import GameCard from "@/components/02 - Practice/GameCard";

// ✅ Your chosen images
import chess from '@/data/games/chess.jpg';
import sudoku from '@/data/games/sudoku.png';
import cards from '@/data/games/cards.jpg';
import words from '@/data/games/words.jpg';
import sevenDiff from '@/data/games/7diff.jpg';
import build from '@/data/games/build.jpg';
import connect from '@/data/games/connect.png';
import connect4 from '@/data/games/connect4.jpg';
import pattern from '@/data/games/pattern.jpg';
import puzzle from '@/data/games/puzzle.jpg';
import rts from '@/data/games/rts.png';
import sort from '@/data/games/sort.jpg';
import ttt from '@/data/games/tic-tac-toe.jpg';

export const gameSections = [
  {
    title: "🧠 Brain Training",
    description: "Sharpen logic, memory, and pattern recognition.",
    games: [
      { title: "Sudoku", description: "Challenge your brain with logic-based grids.", icon: "Grid3x3", img: sudoku },
      { title: "Pattern Recall", description: "Mimic repeating patterns under pressure.", icon: "Repeat", img: pattern },
      { title: "Number Sort", description: "Arrange numbers correctly with minimal moves.", icon: "ListOrdered", img: sort },
      { title: "Connect", description: "Connect the Dotss in the shortest time possible!.", icon: "Grid", img: connect },
      { title: "Word Builder", description: "Create words from shuffled letters.", icon: "Type", img: words },
    ]
  },
  {
    title: "♟️ Strategy & Planning",
    description: "Think ahead, optimize moves, defeat the AI.",
    games: [
      { title: "Chess", description: "Play strategic chess games against agents.", icon: "Crown", img: chess },
      { title: "Connect 4", description: "Outsmart your opponent in a 4-in-a-row battle.", icon: "CircleDot", img: connect4 },
      { title: "RTS Mini", description: "Resource war: micromanage and win.", icon: "Activity", img: rts },
      { title: "Build & Conquer", description: "Construct efficiently, plan your path.", icon: "Hammer", img: build },
    ]
  },
  {
    title: "🔍 Creative Thinking",
    description: "Test your observation and abstract thinking skills.",
    games: [
      { title: "Card Games", description: "Play logic-based card duels vs AI.", icon: "Spade", img: cards },
      { title: "Tic Tac Toe+", description: "Advanced twist on the classic 3x3.", icon: "AppWindow", img: ttt },
      { title: "7 Differences", description: "Spot visual differences under time pressure.", icon: "ScanEye", img: sevenDiff },
      { title: "Puzzle Match", description: "Solve shape and logic puzzles.", icon: "Puzzle", img: puzzle },
    ]
  }
];

export default function Games() {
  return (
    <div class="flex flex-col items-center justify-start w-full overflow-y-scroll pt-[15vh]">

      {gameSections.map(section => (
        <div class="w-full flex flex-col items-center mb-16">
          <MainSeperator title={section.title} description={section.description} />

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4 mt-8">
            {section.games.map(game => (
              <GameCard
                title={game.title}
                description={game.description}
                icon={game.icon}
                img={game.img}
              />
            ))}
          </div>
        </div>
      ))}

    </div>
  );
}
