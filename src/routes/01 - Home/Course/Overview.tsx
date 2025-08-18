import type { CourseInfo } from '@/types/home/library';

import { useLocation } from '@solidjs/router';
import { createSignal, onMount, Show } from 'solid-js';
import { loadCourseData } from '@/utils/home/courses/courseUtils';

import overlay from '@/assets/overlay.png';
import CourseInfoTopCard from '@/components/01 - Home/Cards/CourseInfoTopCard';

import { invoke } from '@tauri-apps/api/core';
import { For } from 'solid-js';

// import CourseCard from "@/components/01 - Home/Cards/CourseCard";

export default function Overview() {
  const location = useLocation();

  // const [courseName, setCourseName] = createSignal('Unknown');
  const [displayName, setDisplayName] = createSignal('');
  const [courseData, setCourseData] = createSignal<CourseInfo>({} as CourseInfo);
  const [loading, setLoading] = createSignal(true);
  const [image, setImage] = createSignal<string>('/default-course.jpg');

  onMount(async () => {
    const segments = location.pathname.split('/').filter(Boolean);
    const pivot = segments.findIndex(s => s === 'course' || s === 'library');

    const toTitle = (slug: string) =>
      slug.replace(/-/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    if (pivot !== -1) {
      const fieldSlug = segments[pivot + 1];
      const nameSlug = segments[pivot + 2];

      try {
        if (fieldSlug && nameSlug) {
          // Expected route: /course/:field/:name
          const fieldName = toTitle(fieldSlug);
          const display = toTitle(nameSlug);
          setDisplayName(display);

          const data = await loadCourseData(fieldName, display);
          setCourseData(data);
          setLoading(false);
          return;
        }

        // Fallback: only name after pivot (legacy route)
        if (segments[pivot + 1]) {
          const display = toTitle(segments[pivot + 1]);
          setDisplayName(display);

          const data = await loadCourseData('AI', display);
          setCourseData(data);
          setLoading(false);
          if (data.img && await invoke('verify_file', { path: data.img })) {
            setImage(await invoke<string>('read_image', { path: data.img }));
          }else{
            setImage('/default-course.jpg');
          }
          return;
        }
      } catch (e) {
        console.error('Failed to load course data:', e);
      }
    }
  });

  // Normalize topics to a flat string[] for rendering
  const normalizedTopics = () => {
    const t: any = courseData()?.topics;
    if (!Array.isArray(t) || t.length === 0) return [];
    const first = t[0];
    if (Array.isArray(first)) {
      return first.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
    }
    if (typeof first === 'object' && first !== null) {
      const key = Object.keys(first)[0];
      const arr = (first as any)[key];
      return Array.isArray(arr) ? arr.filter((s: any) => typeof s === 'string' && s.trim().length > 0) : [];
    }
    if (typeof first === 'string') {
      return (t as any[]).filter((s) => typeof s === 'string' && s.trim().length > 0) as string[];
    }
    return [];
  };

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
              <img src={image()} alt={displayName()} class="w-full h-[30vh] object-cover blur-sm" />
              <img src={overlay} alt="" class="absolute inset-0 w-full h-full object-cover opacity-70 z-10 pointer-events-none" />
            </div>
            <div class="absolute inset-0 bg-black/40 z-20" />
            <h1 class="absolute bottom-4 left-4 text-7xl font-black text-text drop-shadow-lg z-30">{displayName()}</h1>
          </div>
          <div class="flex flex-col w-full p-6 flex-1 max-w-6xl">
            <div class="grid grid-cols-3 gap-4 mb-6">
              <CourseInfoTopCard value={courseData().difficulty} attribute="Difficulty" />
              <CourseInfoTopCard value={courseData().duration} attribute="Duration" />
              <CourseInfoTopCard value={normalizedTopics()[0] || '—'} attribute="First Topic" />
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
                <For each={normalizedTopics()} fallback={<div>No topics found</div>}>
                  {(topic, index) => {
                    return (
                      <div class="flex items-start space-x-3 p-3 bg-accent-dark-3/70 rounded-lg transition-all duration-300 hover:bg-accent-dark-2 hover:scale-102 hover:shadow-lg cursor-pointer group transform">
                        <span class="flex-shrink-0 w-6 h-6 bg-accent-light-1 text-accent-dark-3 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 group-hover:bg-white group-hover:scale-110">
                          {index() + 1}
                        </span>
                        <span class="text-text/80 group-hover:text-text transition-colors duration-300 truncate text-nowrap w-[90%]">
                          {topic}
                        </span>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          </div>
        </>
      </Show>
    </div>
  );
};
