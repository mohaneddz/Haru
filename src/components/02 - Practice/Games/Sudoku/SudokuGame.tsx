import { For, onMount, onCleanup } from 'solid-js';
import { Pause, Play, RotateCcw, Lightbulb, X, RotateCw } from 'lucide-solid';
import useSudoku from '@/hooks/training/games/useSudoku';
import Modal from '@/components/core/Modal';
import Button from '@/components/core/Input/Button';

interface Props {
  setSudokuPage: (page: 'menu' | 'play' | 'settings') => void;
}

export default function SudokuGame(props: Props) {

  const {
    board,
    solidCells,
    hintCells,
    errorCells,
    selectedCell,
    formatTime,
    handleCellClick,
    handleNumberInput,
    hintsUsed,
    handleKeyboard,
    handleHint,
    handleReset,
    isPaused,
    setIsPaused,
    timeElapsed,
    generatePerfectBoard,
    isWon,
    setIsWon,
    finalTime,
  } = useSudoku();

  // Add keyboard event listener and initialize board
  onMount(() => {
    // Generate initial puzzle with 60% of cells hidden (adjust difficulty as needed)
    generatePerfectBoard(60);

    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyboard(event);
    };

    document.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <div class="flex items-center justify-center min-h-screen w-full p-8 gap-8">

      {/* Left Column - Sudoku Board */}
      <div class="flex flex-col items-center">

        {/* Header */}
        <div class="flex justify-between items-center w-full max-w-md mb-6">
          <button
            onclick={() => props.setSudokuPage('menu')}
            class="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <X size={20} class="text-text" />
          </button>

          <div class="flex items-center gap-4">
            <div class="text-text text-lg text-md">{formatTime(timeElapsed())}</div>
            <div class="text-text text-sm">Hints: {hintsUsed()}</div>
          </div>

          <button
            // generate a whole new game
            onclick={() => generatePerfectBoard(60)}
            class="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCw size={20} class="text-text" />
          </button>
        </div>

        {/* Sudoku Board */}
        <div class="bg-background-light-1 rounded-lg p-4 shadow-2xl">
          <div class="grid grid-cols-9 gap-1 w-full h-full">
            <For each={Array(9).fill(0).map((_, i) => i)}>
              {(row) => (
                <For each={Array(9).fill(0).map((_, i) => i)}>
                  {(col) => (
                    <button
                      onclick={() => handleCellClick(row, col)}
                      class={`
                        w-10 h-10 border flex items-center justify-center text-base font-bold
                        ${selectedCell()?.row === row && selectedCell()?.col === col
                          ? 'bg-accent-dark-1 border-accent text-text'
                          : errorCells()[row][col]
                            ? solidCells()[row][col]
                              ? 'bg-red-800 text-text'
                              : 'bg-error text-text'
                            : 'bg-background-light-1 hover:brightness-95'
                        }
                        ${solidCells()[row][col]
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-accent cursor-pointer'
                        }
                        ${hintCells()[row][col] ? 'border-green-500 border-2' : ''}
                        transition-colors
                      `}
                    >
                      {board()[row][col] !== 0 ? board()[row][col] : ''}
                    </button>
                  )}
                </For>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Right Column - Controls */}
      <div class="flex flex-col items-center gap-6">

        {/* Number Input Pad */}
        <div class="grid grid-cols-3 gap-2 w-48">
          <For each={Array(9).fill(0).map((_, i) => i + 1)}>
            {(num) => (
              <button
                onclick={() => handleNumberInput(num)}
                class="w-14 h-14 bg-accent clickable text-text font-bold rounded-lg transition-colors text-lg"
              >
                {num}
              </button>
            )}
          </For>
          <div />

          <Button
            onClick={() => handleNumberInput(0)}
            class="w-14 h-14 bg-gray-600 hover:bg-gray-700 text-text font-bold rounded-lg transition-colors text-lg text-center"
          >
            ✕
          </Button>
        </div>

        {/* Control Buttons */}
        <div class="flex flex-col gap-3 w-48">

          <Button
            onClick={handleHint}
            variant='primary'
            class='flex items-center justify-center gap-2'
          >
            <Lightbulb size={18} />
            Hint
          </Button>

          <Button
            onClick={() => setIsPaused(!isPaused())}
            variant='secondary'
            class='flex items-center justify-center gap-2'
          >
            {isPaused() ? <Play size={18} /> : <Pause size={18} />}
            {isPaused() ? 'Resume' : 'Pause'}
          </Button>

          <Button
            onClick={handleReset}
            variant='ghost'
            class='flex items-center justify-center gap-2'
          >
            <RotateCcw size={18} />
            Reset
          </Button>
        </div>
      </div>

      {/* Pause Modal */}
      <Modal show={isPaused() && !isWon()} onClose={() => setIsPaused(false)}>
        <div class="text-center p-6">
          <h2 class="text-2xl font-bold text-text mb-4">Game Paused</h2>
          <p class="text-gray-300 mb-6">Take a break! Click resume <br /> when you're ready to continue.</p>
          <Button
            onClick={() => setIsPaused(false)}
            variant='primary'
          >
            Resume Game
          </Button>
        </div>
      </Modal>

      {/* Win Modal */}
      <Modal show={isWon()} onClose={() => setIsWon(false)}>
        <div class="text-center p-8">
          <h2 class="text-4xl font-bold text-green-400 mb-16">🎉 You Win! 🎉</h2>

          <div class="bg-background-dark-1 rounded-lg p-6 my-6">
            <div class="grid grid-cols-2 gap-4 text-center">
              <div class="text-gray-300">
                <span class="font-medium">Time:</span>
                <div class="text-md text-accent">{formatTime(finalTime())}</div>
              </div>
              <div class="text-gray-300">
                <span class="font-medium text-center">Hints:</span>
                <div class="text-md text-gray-400/40 text-center">{hintsUsed()}</div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setIsWon(false);
                setIsPaused(false);
                generatePerfectBoard(60);
              }}
              variant='primary'
            >
              Play Again
            </Button>
            <Button
              onClick={() => props.setSudokuPage('menu')}
              variant='secondary'
            >
              Main Menu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
