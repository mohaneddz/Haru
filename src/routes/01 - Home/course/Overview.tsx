import { useLocation } from '@solidjs/router';
import { createMemo, createResource } from 'solid-js';
import overlay from '@/assets/overlay.png';
import { loadCourseData, CourseInfo } from '@/utils/courses/loadCourse';
import CourseInfoTopCard from '@/components/01 - Home/Cards/CourseInfoTopCard';

import NaturalLanguageProcessingImage from '/data/ai/natural-language-processing.jpg';
import ReinforcementLearningImage from '/data/ai/reinforcement-learning.jpg';
import SignalProcessingImage from '/data/ai/signal-processing.jpg'

import CourseCard from "@/components/01 - Home/Cards/CourseCard";

export default function Overview() {
  const location = useLocation();

  // Load course data from CSV
  const [courseData] = createResource(loadCourseData);

  // Get course name from URL
  const courseName = createMemo(() => {
    const segments = location.pathname
      .split('/')
      .filter(Boolean); // Remove empty segments

    console.log('URL segments:', segments); // Debug log

    // Find the segment that comes after 'course'
    const courseIndex = segments.findIndex(segment => segment === 'course' || segment === 'discover');
    if (courseIndex !== -1 && courseIndex + 1 < segments.length) {
      const courseSegment = segments[courseIndex + 1];
      return courseSegment.replace(/-/g, ' ').toLowerCase();
    }

    return 'Unknown';
  });

  // Get display name (Title Case)
  const displayName = createMemo(() => {
    return courseName()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  // Move getDefaultCourse BEFORE currentCourse
  const getDefaultCourse = (): CourseInfo => ({
    name: courseName(),
    description: `This course covers the fundamentals of ${displayName()}.`,
    topics: [
      `Introduction to ${displayName()}`,
      'Core Concepts and Techniques',
      'Practical Applications',
      'Advanced Topics'
    ],
    image: '/data/math/time-series.jpg',
    difficulty: 'Intermediate',
    duration: '8 weeks',
    prerequisites: ['Basic Programming']
  });

  // Get current course data or fallback
  const currentCourse = createMemo((): CourseInfo => {
    const data = courseData();
    if (!data) return getDefaultCourse();

    const course = data[courseName()];
    if (course) return course;

    return getDefaultCourse();
  });

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-auto">
      {courseData.loading && (
        <div class="flex items-center justify-center h-full">
          <div class="text-xl">Loading course data...</div>
        </div>
      )}

      {!courseData.loading && (
        <>
          <div class="relative border-b-2 border-white/20 w-full">
            <div class="overflow-y-hidden  h-[30vh]">
              <img src={currentCourse().image} alt={displayName()} class="w-full h-[30vh] object-cover blur-sm" />
              <img src={overlay} alt="" class="absolute inset-0 w-full h-full object-cover opacity-70 z-10 pointer-events-none" />
            </div>
            <div class="absolute inset-0 bg-black/40 z-20" />
            <h1 class='absolute bottom-4 left-4 text-7xl font-black text-white drop-shadow-lg z-30'>{displayName()}</h1>
          </div>

          <div class="flex flex-col w-full p-6 flex-1 max-w-6xl">

            {/* Course Info Cards */}
            <div class="grid grid-cols-3 gap-4 mb-6">
              <CourseInfoTopCard value={currentCourse().difficulty} attribute="Difficulty" />
              <CourseInfoTopCard value={currentCourse().duration} attribute="Duration" />
              <CourseInfoTopCard value={currentCourse().prerequisites.join(', ')} attribute="Prerequisites" />
            </div>

            <p class="text-3xl font-bold text-sidebar-light-3 mb-4 brightness-120">Course Overview</p>

            <p class="text-text/70 mb-6 text-lg leading-relaxed">
              {currentCourse().description}
            </p>

            {/* Prerequisites */}
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-sidebar-light-3 pb-4">Prerequisites</h3>
              <div class="flex flex-wrap gap-3">
                {currentCourse().prerequisites.map((prereq: string) => (
                  <span class="px-4 py-2 bg-accent-dark-2 text-accent-light-1 rounded-full text-sm transition-all duration-300 hover:bg-accent-dark-1 hover:text-white hover:scale-110 hover:shadow-lg cursor-pointer transform">
                    {prereq}
                  </span>
                ))}
              </div>
            </div>

            {/* Course Topics */}
            <div class="mb-8">
              <h3 class="text-xl font-semibold text-sidebar-light-3 pb-4">What You'll Learn</h3>
              <div class="grid grid-cols-2 gap-3">
                {currentCourse().topics.map((topic: string, index: number) => (
                  <div class="flex items-start space-x-3 p-3 bg-accent-dark-3/50 rounded-lg transition-all duration-300 hover:bg-accent-dark-2/70 hover:scale-105 hover:shadow-lg cursor-pointer group transform">
                    <span class="flex-shrink-0 w-6 h-6 bg-accent-light-1 text-accent-dark-3 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 group-hover:bg-white group-hover:scale-110">
                      {index + 1}
                    </span>
                    <span class="text-text/80 group-hover:text-white transition-colors duration-300">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div class='h-[2px] my-6 w-full bg-sidebar' />

            <p class="text-3xl font-bold text-sidebar-light-3 mb-6 brightness-120">Related Courses</p>

            <div class="grid grid-cols-3 w-full gap-6 mb-20">
              <CourseCard
                title='Natural Language Processing'
                icon='MessageSquare'
                img={NaturalLanguageProcessingImage}
                description="Understanding and processing human language"
              />
              <CourseCard
                title='Reinforcement Learning'
                icon='Target'
                img={ReinforcementLearningImage}
                description="AI agents learning through trial and reward"
              />
              <CourseCard
                title='Signal Processing'
                icon='Cpu'
                img={SignalProcessingImage}
                description="Building blocks of artificial intelligence systems"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};