import type { Syllabus } from "@/types/home/library";

import { For } from "solid-js";

import useSyllabus from "@/hooks/home/useSyllabus";

import SyllabusCard from "@/components/01 - Home/Cards/SyllabusCard";

import Earth from "lucide-solid/icons/earth";
import File from "lucide-solid/icons/file";
import Check from "lucide-solid/icons/check";


// Chapter type represents the structure of a single chapter's subtopics
type Subtopics = Array<Record<string, string>>;

export default function Syllabus() {
  const {
    courseData,
    handleCourseClick,
    formatDesc,
    fetchSyllabus,
    loadSyllabus,
    saveSyllabus
  } = useSyllabus();

  // Helper function to get the chapters from the data structure
  const getChapters = () => {
    const syllabusArray = courseData().syllabus;
    // Ensure the data is in the expected format: an array with one object
    if (Array.isArray(syllabusArray) && syllabusArray.length > 0 && typeof syllabusArray[0] === 'object') {
      return Object.entries(syllabusArray[0]);
    }
    return [];
  };

  return (
    <div class="flex flex-col rounded-md items-center justify-start h-full w-full overflow-y-scroll mt-20 overflow-x-hidden">
      <div class="bg-sidebar gap-4 w-[80vw] h-full p-4 border border-white/40 overflow-y-auto space-y-4 pb-40">
        {/* FIX: Iterate over the entries of the chapter object */}
        <For each={getChapters()} fallback={<p class="text-gray-400">Loading syllabus or no topics available...</p>}>
          {([chapterTitle, subtopicsArray]: [string, Subtopics], chapterIndex) => {
            // The subtopics are inside the first element of the subtopicsArray
            const subtopicsObject = subtopicsArray?.[0] || {};

            return (
              <SyllabusCard
                type="outer"
                title={chapterTitle}
                defaultOpen={chapterIndex() === 0}
              >
                <div class="space-y-2">
                  <For each={Object.entries(subtopicsObject)} fallback={<div class="p-3 bg-sidebar-light-1 rounded-lg"><p class="font-medium text-accent">No subtopics found for this chapter.</p></div>}>
                    {([subTopicName, subTopicDesc]) => (
                      <div
                        class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
                        onClick={() => handleCourseClick(subTopicName)}
                      >
                        <p class="font-medium text-accent">{subTopicName}</p>
                        <p class="text-sm text-gray-400">{formatDesc(subTopicDesc)}</p>
                      </div>
                    )}
                  </For>
                </div>
              </SyllabusCard>
            );
          }}
        </For>
      </div>

      {/* Buttons for manual refresh */}
      <div
        class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-36 right-8 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
        onClick={() => {
          saveSyllabus();
          console.log('Syllabus saved.');
        }}
        title="Save Syllabus"
      >
        <Check class="w-6 h-6 text-text" />
      </div>
      <div
        class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-8 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
        onClick={() => {
          loadSyllabus();
          console.log('Syllabus loaded.');
        }}
        title="Load Syllabus"
      >
        <File class="w-6 h-6 text-text" />
      </div>
      <div
        class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-8 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
        onClick={() => {
          fetchSyllabus();
          console.log('Syllabus fetched.');
        }}
        title="Fetch Syllabus"
      >
        <Earth class="w-6 h-6 text-text" />
      </div>
    </div>
  );
}