import { For, Show } from "solid-js";

import Modal from '@/components/core/Modal'

import Button from "@/components/core/Input/Button";
import Input from "@/components/core/Input/Input";
import Textarea from "@/components/core/Input/Textarea";
import NumberInput from "@/components/core/Input/NumberInput";
import MultiValueInput from "@/components/core/Input/MultiValueInput";
import SelectInput from "@/components/core/Input/SelectInput";

import CourseCard from "@/components/01 - Home/Cards/CourseCard";
import MainSeperator from '@/components/01 - Home/Cards/MainSeperator';
import UniversalFilter from "@/components/core/UniversalFilter";

import GraduationCap from "lucide-solid/icons/graduation-cap";
import Stars from "lucide-solid/icons/stars";
import Pen from "lucide-solid/icons/pen";
import LoaderCircle from "lucide-solid/icons/loader-circle";

import useLibrary from "@/hooks/home/useLibrary";

export default function Library() {

  const {
    sections,
    isContentLoading,
    isSaving,
    addModal,
    setAddModal,
    title,
    overview,
    description,
    tags,
    fieldVals,
    difficulty,
    duration,
    prerequisites,
    topics,
    setTitle,
    setOverview,
    setDescription,
    setTags,
    setFieldVals,
    setDifficulty,
    setDuration,
    setPrerequisites,
    setTopics,
    resetForm,
    saveCourse,
    setFilters,
    availableTags,
    availableFields,
    availableDifficulties,
    setClosedSections,
    closedSections,
    GetCourseContent
  } = useLibrary();

  return (
    <div class="flex flex-col items-center justify-start h-screen w-full overflow-y-scroll ">

      <Modal show={addModal()} onClose={() => setAddModal(false)}>
        <div class="w-[45vw] h-[90vh] flex flex-col">

          <h2 class="w-full text-center text-xl font-semibold flex-shrink-0">Add New Course</h2>

          <div class="grid grid-cols-2 grid-rows-none gap-x-6 gap-y-4 p-8 flex-grow overflow-y-auto">

            <Input Value={title()} setValue={setTitle} placeholder="Course title" class="col-span-2" />

            <Textarea Value={overview()} setValue={setOverview} placeholder="Course overview" rows={2} class="col-span-2" />

            <Textarea Value={description()} setValue={setDescription} placeholder="Course description" rows={2} class="col-span-2" />

            <MultiValueInput Value={topics()} setValue={setTopics} placeholder="Add topics..." class="col-span-2" />

            <MultiValueInput Value={prerequisites()} setValue={setPrerequisites} placeholder="Add prerequisites..." />
            <MultiValueInput Value={tags()} setValue={setTags} placeholder="Add tags..." />
            <Input Value={fieldVals()} setValue={setFieldVals} placeholder="Add the field..." />

            <SelectInput selected={difficulty()} onChange={setDifficulty} options={availableDifficulties} class="w-full" />

            <label for="Duration" class="text-text whitespace-nowrap flex items-center pl-2">Duration (Weeks)</label>
            <NumberInput Value={duration()} setValue={setDuration} min={0} step={1} placeholder="Weeks" />

            <Button class="center w-full h-max col-span-2" variant="ghost" onClick={GetCourseContent} disabled={isContentLoading() || isSaving()}>
              <Show when={!isContentLoading()} fallback={<><LoaderCircle class="w-4 h-4 text-text mr-2 animate-spin" /><span>Loading...</span></>}>
                <Stars class="w-4 h-4 text-text mr-2" />
                <span>Search With AI</span>
              </Show>
            </Button>

            <Button class="text-center h-max" variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button class="text-center h-max" variant="primary" onClick={saveCourse} disabled={isSaving()}>
              <Show when={!isSaving()} fallback={<><LoaderCircle class="w-4 h-4 text-text-dark mr-2 animate-spin" /><span>Saving...</span></>}>
                Save Course
              </Show>
            </Button>
          </div>

        </div>
      </Modal>

      <UniversalFilter
        title="Search Your Courses"
        icon={<GraduationCap class="text-accent" />}
        onFilterChange={setFilters}
        placeholder="Search courses by title, description, or tags..."
        availableTags={availableTags}
        tagsLabel="Tags"
        availableFields={availableFields}
        fieldsLabel="Subject Fields"
        availableTypes={availableDifficulties.map(d => d.label)}
        typesLabel="Difficulty Level"
        class="my-12 w-[80%]"
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
                  isClosed ? newSet.add(section.name) : newSet.delete(section.name);
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
                      img={course.img}
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

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-8 bg-accent-dark-2 rounded-full p-2
                  hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
        onClick={() => { resetForm(); setAddModal(true); }}>
        <Pen class="w-6 h-6 text-text" />
      </div>
      
    </div >
  );
};