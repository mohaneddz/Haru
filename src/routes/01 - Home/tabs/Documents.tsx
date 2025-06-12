import courseImage from '@/data/course_image.jpg';

import CourseCard from "@/components/01 - Home/CourseCard";
import CourseSeperator from '@/components/01 - Home/CourseSeperator';

export default function Documents () {
  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll mt-20">

      <CourseSeperator title='Artificial Intelligence' description='Explore our courses'/>

      <div class="grid grid-cols-3 gap-8 w-full max-w-[80%] p-4">
        <CourseCard title='Time Series' icon='Clock' img={courseImage} description="How we turn Time data into insights" />
        <CourseCard title='Time Series' icon='Clock' img={courseImage} description="How we turn Time data into insights" />
        <CourseCard title='Time Series' icon='Clock' img={courseImage} description="How we turn Time data into insights" />

        <CourseCard title='Time Series' icon='Clock' img={courseImage} description="How we turn Time data into insights" />
        <CourseCard title='Time Series' icon='Clock' img={courseImage} description="How we turn Time data into insights" />
        <CourseCard title='Time Series' icon='Clock' img={courseImage} description="How we turn Time data into insights" />

      </div>
    </div>
  );
};
