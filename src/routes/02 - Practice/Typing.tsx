import { createSignal, createEffect, createResource, For, Show } from "solid-js";

// Fetches the word list from the public directory
const fetchWords = async () => {
  const response = await fetch('/words_alpha.txt');
  const text = await response.text();
  const uniqueWords = [...new Set(text.split('\n').map(word => word.trim()))];
  return uniqueWords.filter(word => word.length > 2 && word.length < 8);
};

function Typing() {
  // === State ===
  const [wordList] = createResource(fetchWords);
  const [wordsToType, setWordsToType] = createSignal<string[]>([]);
  const [testState, setTestState] = createSignal<'waiting' | 'running' | 'finished'>('waiting');

  const [userInput, setUserInput] = createSignal("");
  const [currentWordIndex, setCurrentWordIndex] = createSignal(0);
  
  const [correctWords, setCorrectWords] = createSignal<boolean[]>([]);
  const [correctChars, setCorrectChars] = createSignal(0);

  const [timer, setTimer] = createSignal(60);
  const [wpm, setWpm] = createSignal(0);
  
  let interval: ReturnType<typeof setInterval>;
  let inputRef: HTMLInputElement | undefined;
  let wordContainerRef: HTMLDivElement | undefined;
  
  // === Text Generation ===
  const generateText = () => {
    if (wordList.loading) return;
    const words = wordList();
    if (!words) return;

    let newWords: string[] = [];
    // Generate a generous amount for a 60s test
    for (let i = 0; i < 150; i++) {
      newWords.push(words[Math.floor(Math.random() * words.length)]);
    }
    setWordsToType(newWords);
  };
  
  // Generate text once words are loaded
  createEffect(() => {
      if(!wordList.loading) {
          generateText();
      }
  });

  // === Test Lifecycle ===
  const startTest = () => {
    if (testState() === 'running') return;
    setTestState('running');
    interval = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);
  };

  const endTest = () => {
    setTestState('finished');
    clearInterval(interval);
  };

  const resetTest = () => {
    setTestState('waiting');
    clearInterval(interval);
    setTimer(60);
    setUserInput("");
    setCurrentWordIndex(0);
    setWpm(0);
    setCorrectChars(0);
    setCorrectWords([]);
    generateText();
    inputRef?.focus();
  };
  
  // Timer countdown and test end condition
  createEffect(() => {
    if (timer() <= 0) {
      endTest();
    }
  });

  // WPM calculation effect
  createEffect(() => {
    if (testState() !== 'running') return;
    const timeElapsedInMinutes = (60 - timer()) / 60;
    if (timeElapsedInMinutes > 0) {
      const grossWpm = (correctChars() / 5) / timeElapsedInMinutes;
      setWpm(Math.round(Math.max(0, grossWpm)));
    }
  });
  
  // Auto-scroll the view to the current word
  createEffect(() => {
    const currentWordEl = wordContainerRef?.children[currentWordIndex()] as HTMLElement;
    if (currentWordEl && wordContainerRef) {
      const containerRect = wordContainerRef.getBoundingClientRect();
      const wordRect = currentWordEl.getBoundingClientRect();
      
      // If the word is below the visible area, scroll down
      if (wordRect.bottom > containerRect.bottom) {
        wordContainerRef.scrollTop += wordRect.bottom - containerRect.bottom;
      }
      // If the word is above the visible area, scroll up
      else if (wordRect.top < containerRect.top) {
        wordContainerRef.scrollTop -= containerRect.top - wordRect.top;
      }
    }
  });


  // === Input Handling ===
  const handleInput = (e: InputEvent) => {
    if (testState() === 'finished') return;
    // Auto-start the test on the first keypress
    if (testState() === 'waiting') {
      startTest();
    }
    const value = (e.currentTarget as HTMLInputElement).value;
    // Disallow space in the middle of input
    if (value.includes(" ")) {
        return;
    }
    setUserInput(value);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      resetTest();
    }
    if (e.key === " ") {
      e.preventDefault();
      if (!userInput()) return;

      const currentWord = wordsToType()[currentWordIndex()];
      const isCorrect = currentWord === userInput();
      
      setCorrectWords(prev => [...prev, isCorrect]);

      if (isCorrect) {
        // Add length of the word + 1 for the space
        setCorrectChars(c => c + currentWord.length + 1);
      }

      // Move to the next word
      setCurrentWordIndex(i => i + 1);
      setUserInput("");
    }
  };
  
  const getAccuracy = () => {
      const totalWords = currentWordIndex();
      if (totalWords === 0) return 100;
      const correctWordCount = correctWords().filter(Boolean).length;
      return Math.round((correctWordCount / totalWords) * 100);
  }

  // === UI Components ===
  
  const Word = (props: { word: string, index: number }) => {
    const isCurrent = () => props.index === currentWordIndex();
    const isTyped = () => props.index < currentWordIndex();

    const getWordClass = () => {
      if (isCurrent()) return "text-accent"; // Highlight current word
      if (isTyped()) return correctWords()[props.index] ? "text-green-400" : "text-red-500";
      return "text-gray-400"; // Untyped words
    };

    return (
      <span class={`mr-3 ${getWordClass()}`}>
        <For each={props.word.split('')}>
          {(char, charIndex) => {
            let charColor = "";
            if (isCurrent() && charIndex() < userInput().length) {
              charColor = userInput()[charIndex()] === char ? "text-green-400" : "text-red-500 line-through";
            }
            return <span class={charColor}>{char}</span>;
          }}
        </For>
      </span>
    );
  };

  const Results = () => (
    <div class="text-center">
      <h2 class="text-3xl font-bold mb-4">Results</h2>
      <div class="flex justify-around items-center text-4xl">
        <div>
          <p class="text-lg text-gray-400">WPM</p>
          <p class="font-bold text-accent">{wpm()}</p>
        </div>
        <div>
          <p class="text-lg text-gray-400">Accuracy</p>
          <p class="font-bold text-accent">{getAccuracy()}%</p>
        </div>
      </div>
    </div>
  );

  return (
    <div class="w-full text-gray-200 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <h1 class="text-4xl text-accent font-bold mb-8">Typing Test</h1>

      <div class="bg-background-light-3 p-6 rounded-lg shadow-lg w-full max-w-6xl border-border border-1">
        <Show when={testState() !== 'finished'} fallback={<Results />}>
          <div 
            ref={wordContainerRef}
            class="mb-4 h-36 text-2xl font-mono tracking-wider leading-relaxed overflow-hidden"
            onClick={() => inputRef?.focus()}
          >
            <Show when={!wordList.loading} fallback={<p>Loading...</p>}>
              <div class="flex flex-wrap">
                <For each={wordsToType()}>
                  {(word, index) => <Word word={word} index={index()} />}
                </For>
              </div>
            </Show>
          </div>
          
          <div class="flex justify-between items-center mt-6">
            <input
              ref={inputRef}
              type="text"
              class="w-2/3 bg-sidebar text-gray-200 p-4 rounded-md text-xl font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              value={userInput()}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              autofocus
              disabled={testState() === 'finished'}
            />
            <div class="text-2xl font-bold">{timer()}s</div>
            <div class="text-2xl">{wpm()} WPM</div>
            <div class="text-2xl">{getAccuracy()}% Acc</div>
            <button
              onClick={resetTest}
              class="bg-accent-dark-1 hover:bg-accent-dark-3 text-white font-bold py-2 px-4 rounded"
            >
              Reset
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}

export default Typing;