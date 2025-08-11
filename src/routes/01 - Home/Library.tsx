import { Trash, Pen, Folder } from "lucide-solid";
import { loadTools } from "@/utils/home/courses/resourcessUtils";
import { CourseInfo, loadCourses, loadCoursesSections } from "@/utils/home/courses/courseUtils";

import { createSignal, For, onMount } from "solid-js";
import CourseCard from "@/components/01 - Home/Cards/CourseCard";
import MainSeperator from '@/components/01 - Home/Cards/MainSeperator';
import ComposableFilter, { FilterState } from "@/components/01 - Home/Filters/ComposableFilter";
import { Tag, BookOpen, GraduationCap } from "lucide-solid";

interface ExtendedCourseInfo extends CourseInfo {
  icon?: string;
  tags: string[];
  field: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

interface Section {
  name: string;
  courses: ExtendedCourseInfo[];
}

export default function Library() {

  const [_, setFilters] = createSignal<FilterState>({
    searchQuery: "",
    selectedTags: [],
    selectedFields: [],
    selectedTypes: []
  });
  const [sections, setSections] = createSignal<Section[]>([]);
  const [closedSections, setClosedSections] = createSignal<Set<string>>(new Set());

  // Define all courses data with tags and fields
  onMount(async () => {
    try {
      const loadedSections = await loadCoursesSections();

      const allSections = [];
      for (const section of loadedSections) {
        const courses = await loadCourses(section);
        allSections.push({
          name: section,
          courses: courses.map(course => ({
            ...course,
            field: section, 
            tags: course.tags || [], 
            difficulty: (course.difficulty as "Beginner" | "Intermediate" | "Advanced") || "Beginner" 
          }))
        });
      }
      setSections(allSections);

      // console.log('Sections Data:', sections());
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  });

  // Define available filter options
  const availableTags = ["machine-learning", "deep-learning", "computer-vision", "nlp", "reinforcement-learning"];

  const availableFields = ["Artificial Intelligence", "Mathematics", "Signal Processing", "Data Science"];

  const availableDifficulties = ["Beginner", "Intermediate", "Advanced"];

  // Filter function
  // const matchesFilter = (course: any, filters: FilterState) => {
  //   const query = filters.searchQuery.toLowerCase();
  //   const matchesSearch = !query ||
  //     course.title.toLowerCase().includes(query) ||
  //     course.description.toLowerCase().includes(query) ||
  //     (course.tags && course.tags.some((tag: string) => tag.toLowerCase().includes(query)));

  //   const matchesTags = filters.selectedTags.length === 0 ||
  //     (course.tags && filters.selectedTags.some(tag => course.tags.includes(tag)));

  //   const matchesFields = filters.selectedFields.length === 0 ||
  //     (course.field && filters.selectedFields.includes(course.field));

  //   const matchesTypes = filters.selectedTypes.length === 0 ||
  //     (course.difficulty && filters.selectedTypes.includes(course.difficulty));

  //   return matchesSearch && matchesTags && matchesFields && matchesTypes;
  // };

  // const filteredCourses = createMemo(() => coursesData.filter(course => matchesFilter(course, filters())));

  return (
    <div class="flex flex-col items-center justify-start h-screen w-full overflow-y-scroll ">

      {/* Composable Filter Component */}
      <ComposableFilter
        title="Discover Courses"
        icon={Tag}
        onFilterChange={setFilters}
        pageType="library"
        placeholder="Search courses by title, description, or tags..."
        class="max-w-[80%] mt-20"
        tagsConfig={{
          enabled: true,
          options: availableTags,
          title: "Tags",
          icon: Tag
        }}
        fieldsConfig={{
          enabled: true,
          options: availableFields,
          title: "Subject Fields",
          icon: BookOpen
        }}
        typesConfig={{
          enabled: true,
          options: availableDifficulties,
          title: "Difficulty Level",
          icon: GraduationCap
        }}
      />

      <For each={sections()}>
        {(section) => (
          <>
            <MainSeperator
              title={section.name + ' (' + section.courses.length + ')'}
              description={`Explore our ${section.name} courses`}
              onToggle={(isClosed) => {
                setClosedSections(prev => {
                  const newSet = new Set(prev);
                  if (isClosed) {
                    newSet.add(section.name);
                  } else {
                    newSet.delete(section.name);
                  }
                  return newSet;
                });
              }}
            />
            {!closedSections().has(section.name) && (
              <div class="grid grid-cols-3 gap-8 w-full max-w-[80%] my-8">
                <For each={section.courses}>
                  {(course) => (
                    <CourseCard
                      title={course.title}
                      icon={course.icon || "BookOpen"}
                      img={course.img || "/default-course-image.jpg"}
                      description={course.description}
                      tags={course.tags}
                      field={course.field}
                      difficulty={course.difficulty}
                    />
                  )}
                </For>
              </div>
            )}
          </>
        )}
      </For>

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-24 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={() => { loadCourses('AI') }}>
        <Folder class="w-6 h-6 text-text " />
      </div>

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-12 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={() => { loadCoursesSections() }}>
        <Trash class="w-6 h-6 text-text " />
      </div>

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-12 bg-accent-dark-2 rounded-full p-2
                        hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200 " onClick={() => { loadTools('AI', 'computer vision') }}>
        <Pen class="w-6 h-6 text-text " />
      </div>

    </div>
  );
};
