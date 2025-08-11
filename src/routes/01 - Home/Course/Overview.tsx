import { useLocation } from '@solidjs/router';
import { createSignal, onMount, Show } from 'solid-js';
import overlay from '@/assets/overlay.png';
import { CourseInfo, loadCourseData } from '@/utils/home/courses/courseUtils';
import CourseInfoTopCard from '@/components/01 - Home/Cards/CourseInfoTopCard';
import { invoke } from '@tauri-apps/api/core';

// import CourseCard from "@/components/01 - Home/Cards/CourseCard";

export default function Overview() {
  const location = useLocation();

  // const [courseName, setCourseName] = createSignal('Unknown');
  const [displayName, setDisplayName] = createSignal('');
  const [courseData, setCourseData] = createSignal<CourseInfo>({} as CourseInfo);
  const [loading, setLoading] = createSignal(true);
  const [image, setImage] = createSignal<string | null>(null);

  onMount(async () => {
    const segments = location.pathname.split('/').filter(Boolean);
    const courseIndex = segments.findIndex(segment => segment === 'course' || segment === 'library');

    if (courseIndex !== -1 && courseIndex + 1 < segments.length) {
      const courseSegment = segments[courseIndex + 1];
      // setCourseName(courseSegment.replace(/-/g, ' ').toLowerCase());
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
      setLoading(false);
      setImage(await invoke<string>('read_image', { path: data.img }));
    }
  });

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-auto">

      <Show when={!loading()}
        fallback={
          <div class="flex items-center justify-center h-full">
            <div class="text-xl">Loading course data...</div>
          </div>}>

        <>
          <div class="relative border-b-2 border-white/20 w-full">
            <div class="overflow-y-hidden h-[30vh]">
              <img src={image() || undefined} alt={displayName()} class="w-full h-[30vh] object-cover blur-sm" />
              <img src={overlay} alt="" class="absolute inset-0 w-full h-full object-cover opacity-70 z-10 pointer-events-none" />
            </div>
            <div class="absolute inset-0 bg-black/40 z-20" />
            <h1 class="absolute bottom-4 left-4 text-7xl font-black text-text drop-shadow-lg z-30">{displayName()}</h1>
          </div>
          <div class="flex flex-col w-full p-6 flex-1 max-w-6xl">
            <div class="grid grid-cols-3 gap-4 mb-6">
              <CourseInfoTopCard value={courseData().difficulty} attribute="Difficulty" />
              <CourseInfoTopCard value={courseData().duration} attribute="Duration" />
              <CourseInfoTopCard value={Object.keys(courseData().topics?.[0] || {})[0]} attribute="Main Topic" />
            </div>
            <p class="text-3xl font-bold text-sidebar-light-3 mb-4 brightness-120">Course Overview</p>
            <p class="text-text/70 mb-6 text-lg leading-relaxed">{courseData().overview}</p>
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-sidebar-light-3 pb-4">Prerequisites</h3>
              <div class="flex flex-wrap gap-3">
                {courseData().prerequisites.map((prereq: string) => (
                  <span class="px-4 py-2 bg-accent-dark-2 text-accent-light-1 rounded-full text-sm transition-all duration-300 hover:bg-accent-dark-1 hover:text-text hover:scale-110 hover:shadow-lg cursor-pointer transform">
                    {prereq}
                  </span>
                ))}
              </div>
            </div>
            <div class="mb-8">
              <h3 class="text-xl font-semibold text-sidebar-light-3 pb-4">What You'll Learn</h3>
              <div class="grid grid-cols-2 gap-3">
                {courseData().topics.map((topicObj: { [key: string]: string[] }, index: number) => {
                  const topicName = Object.keys(topicObj)[0];
                  return (
                    <div class="flex items-start space-x-3 p-3 bg-accent-dark-3/70 rounded-lg transition-all duration-300 hover:bg-accent-dark-2 hover:scale-102 hover:shadow-lg cursor-pointer group transform">
                      <span class="flex-shrink-0 w-6 h-6 bg-accent-light-1 text-accent-dark-3 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 group-hover:bg-white group-hover:scale-110">
                        {index + 1}
                      </span>
                      <span class="text-text/80 group-hover:text-text transition-colors duration-300 truncate text-nowrap w-[90%]">
                        {topicName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div class="h-[2px] my-6 w-full bg-sidebar" />
            <p class="text-3xl font-bold text-sidebar-light-3 mb-6 brightness-120">Related Courses</p>
            <div class="grid grid-cols-3 w-full gap-6 mb-20">
              {/* <CourseCard
                title="Natural Language Processing"
                icon="MessageSquare"
                img={NaturalLanguageProcessingImage}
                description="Understanding and processing human language"
              />
              <CourseCard
                title="Reinforcement Learning"
                icon="Target"
                img={ReinforcementLearningImage}
                description="AI agents learning through trial and reward"
              />
              <CourseCard
                title="Signal Processing"
                icon="Cpu"
                img={SignalProcessingImage}
                description="Building blocks of artificial intelligence systems"
              /> */}
            </div>
          </div>
        </>
      </Show>
    </div>
  );
};