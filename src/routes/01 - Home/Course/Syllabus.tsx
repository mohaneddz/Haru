import SyllabusCard from "@/components/01 - Home/Cards/SyllabusCard";
import { createSignal, For, onMount } from 'solid-js';
import { CourseInfo, loadCourseData } from "@/utils/home/courses/courseUtils";
import { useLocation } from '@solidjs/router';

export default function Syllabus() {

  const location = useLocation();

  const [courseData, setCourseData] = createSignal<CourseInfo>({} as CourseInfo);
  const [displayName, setDisplayName] = createSignal('');


  onMount(async () => {
    const segments = location.pathname.split('/').filter(Boolean);
    const courseIndex = segments.findIndex(segment => segment === 'course' || segment === 'library');

    if (courseIndex !== -1 && courseIndex + 1 < segments.length) {
      const courseSegment = segments[courseIndex + 1];
      setDisplayName(
        courseSegment
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      );
      const data = await loadCourseData('AI', displayName());
      setCourseData(data);
      console.log('Course Data:', courseData());
    }
  });


  const handleCourseClick = (courseTitle: string) => {
    console.log(`Navigating to: ${courseTitle}`);
  };

  return (
    <div class="flex flex-col rounded-md items-center justify-start h-full w-full overflow-y-scroll mt-20 overflow-x-hidden">
      <div class="bg-sidebar gap-4 w-[80vw] h-full p-4 border border-white/40 overflow-y-auto space-y-4 pb-40">

        <For each={courseData().topics} fallback={<p class="text-gray-400">No topics available</p>}>
          {(topic, index) => (
            <SyllabusCard type="outer" title={`Chapter ${index() + 1} - ${Object.keys(topic)[0]}`} defaultOpen={index() === 0}>
              <div class="space-y-2">
                {topic[Object.keys(topic)[0]].length > 0 ? (
                  topic[Object.keys(topic)[0]].map((subTopic: string) => (
                    <div
                      class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
                      onClick={() => handleCourseClick(subTopic)}
                    >
                      <p class="font-medium text-accent">{subTopic}</p>
                      <p class="text-sm text-gray-500">Last visited: Never</p>
                    </div>
                  ))
                ) : (
                  <div class="p-3 bg-sidebar-light-1 rounded-lg">
                    <p class="font-medium text-accent">Last Visited: Never</p>
                  </div>
                )}
              </div>
            </SyllabusCard>
          )}
        </For>

      </div>
    </div>
  );
};