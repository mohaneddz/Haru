import UniversalFilter from "@/components/01 - Home/Filters/ComposableFilter";
import FlashDeck from "@/components/02 - Practice/training/Flashcards/FlashDeck";
import { Flame } from 'lucide-solid';

import { createSignal, For } from "solid-js";

export default function FlashCardsDashboard() {

  const [_, setFilters] = createSignal({});
  const decks = [
    {
      title: "React Native",
      description: "This is the first deck of flashcards.",
      id: 1
    }, {
      title: "Calculus",
      description: "This is the second deck of flashcards.",
      id: 2
    }, {
      title: "Flutter",
      description: "This is the third deck of flashcards.",
      id: 3
    },
    {
      title: "React Native",
      description: "This is the first deck of flashcards.",
      id: 1
    }, {
      title: "Calculus",
      description: "This is the second deck of flashcards.",
      id: 2
    }, {
      title: "Flutter",
      description: "This is the third deck of flashcards.",
      id: 3
    },
    {
      title: "React Native",
      description: "This is the first deck of flashcards.",
      id: 1
    }, {
      title: "Calculus",
      description: "This is the second deck of flashcards.",
      id: 2
    }, {
      title: "Flutter",
      description: "This is the third deck of flashcards.",
      id: 3
    },
  ]

  return (
    <div class="w-full flex flex-col items-center justify-start overflow-y-auto">

      <div class="max-w-[80%] h-full">

        <UniversalFilter icon={Flame} title="Search Decks" onFilterChange={setFilters} />

        <div class="bg-sidebar w-full h-max mb-16 rounded-md grid grid-cols-4 gap-4 p-4 border-1 border-gray-500 shadow-inner">

          <For each={decks}>
            {(deck) => (
              <FlashDeck
                title={deck.title}
                description={deck.description}
                id={deck.id}
                class="w-full h-full"
              />
            )}
          </For>

        </div>

      </div>

    </div>
  );
};
