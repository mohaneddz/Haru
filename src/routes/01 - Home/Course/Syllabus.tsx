import type { Syllabus } from "@/types/home/library";
import SyllabusCard from "@/components/01 - Home/Cards/SyllabusCard";
import { createSignal, For, onMount, createEffect } from "solid-js";
import { useLocation } from "@solidjs/router";
import Earth from "lucide-solid/icons/earth";

// Define a more specific type for a chapter to improve type safety.
type Chapter = Record<string, Array<Record<string, string>>>;

export default function Syllabus() {
  const location = useLocation();
  
  // Default to an object with an empty syllabus array to avoid undefined errors.
  const [courseData, setCourseData] = createSignal<Syllabus>({ syllabus: [] });
  const [moduleName, setModuleName] = createSignal("");

  // onMount is used to parse the module name from the URL path only once.
  onMount(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const courseIndex = segments.findIndex((segment) => segment === "course" || segment === "library");

    if (courseIndex !== -1 && courseIndex + 1 < segments.length) {
      const courseSegment = segments[courseIndex + 1];
      const formattedModuleName = courseSegment
        .replace(/-/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setModuleName(formattedModuleName);
    }
  });

  // This function robustly formats the description from various possible data types.
  function formatDesc(d: unknown): string {
    if (typeof d === "string") return d;
    if (d == null) return "";
    if (Array.isArray(d)) return d.map(item => (typeof item === "string" ? item : JSON.stringify(item))).join(" • ");
    if (typeof d === "object") {
      const obj = d as Record<string, any>;
      const candidates = ["description", "desc", "text", "content", "details", "body"];
      for (const k of candidates) {
        if (k in obj && typeof obj[k] === "string") return obj[k];
      }
      const firstString = Object.values(obj).find(v => typeof v === "string");
      if (firstString) return firstString;
      try { return JSON.stringify(obj); } catch { return String(obj); }
    }
    return String(d);
  }

  // The function to fetch syllabus data from the API.
  async function fetchSyllabus() {
    if (!moduleName()) return; // Do not fetch if moduleName is not set.
    try {
      const response = await fetch("http://localhost:4999/module-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_name: moduleName() }),
      });

      if (!response.ok) {
        console.error("Failed to fetch syllabus:", await response.text());
        return;
      }

      const data = await response.json();
      setCourseData(data);
      console.log("Fetched syllabus:", data);
    } catch (err) {
      console.error("Error fetching syllabus:", err);
    }
  }

  // createEffect will automatically run the fetchSyllabus function
  // whenever the moduleName signal changes.
  createEffect(() => {
    fetchSyllabus();
  });

  const handleCourseClick = (courseTitle: string) => {
    console.log(`Navigating to: ${courseTitle}`);
    // Implement navigation logic here, e.g., using useNavigate().
  };

  return (
    <div class="flex flex-col rounded-md items-center justify-start h-full w-full overflow-y-scroll mt-20 overflow-x-hidden">
      <div class="bg-sidebar gap-4 w-[80vw] h-full p-4 border border-white/40 overflow-y-auto space-y-4 pb-40">
        <For each={courseData().syllabus ?? []} fallback={<p class="text-gray-400">Loading syllabus or no topics available...</p>}>
          {(chapter: Chapter, chapterIndex) => {
            const chapterTitle = Object.keys(chapter)[0];
            const subtopicsObject = chapter[chapterTitle]?.[0] || {};

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

      {/* This button can now serve as a manual refresh */}
      <div
        class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-8 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
        onClick={fetchSyllabus}
        title="Refresh Syllabus"
      >
        <Earth class="w-6 h-6 text-text" />
      </div>
    </div>
  );
}