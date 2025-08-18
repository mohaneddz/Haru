import { createSignal, createEffect, onCleanup, createResource } from "solid-js";

// Fetches the word list from the public directory
const fetchWords = async () => {
  const response = await fetch('/words_alpha.txt');
  const text = await response.text();
  return text.split('\n').map(word => word.trim()).filter(word => word.length > 2 && word.length < 8); // Filter for more typical typing test words
};

function Typing() {
  const [words] = createResource(fetchWords);
  const [text, setText] = createSignal("Loading words...");
  const [userInput, setUserInput] = createSignal("");
  const [timer, setTimer] = createSignal(60);
  const [isTiming, setIsTiming] = createSignal(false);
  const [wpm, setWpm] = createSignal(0);
  const [accuracy, setAccuracy] = createSignal(100);
  const [typedChars, setTypedChars] = createSignal(0);
  const [correctChars, setCorrectChars] = createSignal(0);

  let interval: ReturnType<typeof setInterval>;

  const generateText = () => {
    if (words.loading) {
      setText("Still loading words...");
      return;
    }
    const wordList = words();
    if (!wordList) return;

    let newText = "";
    for (let i = 0; i < 50; i++) {
      newText += wordList[Math.floor(Math.random() * wordList.length)] + " ";
    }
    setText(newText.trim());
  };

  // Generate text when the words have finished loading
  createEffect(() => {
    if (!words.loading) {
      generateText();
    }
  });

  createEffect(() => {
    if (isTiming() && timer() > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer() === 0) {
      clearInterval(interval);
      setIsTiming(false);
    }
    onCleanup(() => clearInterval(interval));
  });

  const handleInput = (e: InputEvent) => {
    if (timer() === 0 || words.loading) return;

    if (!isTiming()) {
      setIsTiming(true);
    }

    const value = (e.currentTarget as HTMLInputElement).value;
    setUserInput(value);
    setTypedChars(value.length);

    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === text()[i]) {
        correct++;
      }
    }
    setCorrectChars(correct);

    // WPM calculation based on 5 characters per word
    const timeElapsedInMinutes = (60 - timer()) / 60;
    if (timeElapsedInMinutes > 0) {
      const grossWpm = (typedChars() / 5) / timeElapsedInMinutes;
      const netWpm = grossWpm - ((typedChars() - correctChars()) / 5) / timeElapsedInMinutes;
      setWpm(Math.round(Math.max(0, netWpm)));
    }

    if (value.length > 0) {
      setAccuracy(Math.round((correct / value.length) * 100));
    } else {
      setAccuracy(100);
    }
  };

  const resetTest = () => {
    setIsTiming(false);
    clearInterval(interval);
    setTimer(60);
    setUserInput("");
    setWpm(0);
    setAccuracy(100);
    setTypedChars(0);
    setCorrectChars(0);
    generateText();
  };

  // New: keydown handler to reset on Tab
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      resetTest();
    }
  };

  return (
    <div class="w-full text-gray-200 min-h-screen flex flex-col items-center justify-center p-4">
      <p class="text-4xl text-accent font-bold mb-8">Type Test</p>
      <div class="bg-sidebar-light-1 p-6 rounded-lg shadow-lg w-full max-w-6xl border-border border-1">
        <div class="mb-4 h-32 overflow-hidden">
          <p class="text-2xl font-mono tracking-wider">
            {text().split("").map((char, index) => {
              let color = "text-gray-400";
              if (index < userInput().length) {
                color = char === userInput()[index] ? "text-green-400" : "text-red-500";
              }
              return <span class={color}>{char}</span>;
            })}
          </p>
        </div>
        <input
          type="text"
          class="w-full bg-gray-800 text-gray-200 p-4 rounded-md text-xl font-mono focus:outline-none"
          value={userInput()}
          oninput={handleInput}
          onkeydown={handleKeyDown}
          autofocus
          disabled={words.loading}
        />
        <div class="flex justify-between items-center mt-6">
          <div class="text-2xl">
            Time: <span class="font-bold">{timer()}s</span>
          </div>
          <div class="text-2xl">
            WPM: <span class="font-bold">{wpm()}</span>
          </div>
          <div class="text-2xl">
            Accuracy: <span class="font-bold">{accuracy()}%</span>
          </div>
          <button
            onClick={resetTest}
            class="bg-accent-dark-1 hover:bg-accent-dark-3 text-white font-bold py-2 px-4 rounded clickable"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default Typing;