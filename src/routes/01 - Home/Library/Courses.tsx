import timeSeriesImage from '/data/math/time-series.jpg';
import calculusImage from '/data/math/calculus.jpg';
import chaosTheoryImage from '/data/math/chaos-theory.jpg';
import gameTheoryImage from '/data/math/game-theory.jpg';
import linearAlgebraImage from '/data/math/linear-algebra.jpg';
import probabilityImage from '/data/math/probability.jpg';

import CourseCard from "@/components/01 - Home/Cards/CourseCard";
import MainSeperator from '@/components/01 - Home/Cards/MainSeperator';

export default function Courses () {
  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll mt-20">

      <MainSeperator title='Artificial Intelligence' description='Explore our courses'/>

      <div class="grid grid-cols-3 gap-8 w-full max-w-[80%] p-4">

        <CourseCard title='Calculus' icon='TrendingUp' img={calculusImage} description="Master derivatives, integrals, and limits" />
        <CourseCard title='Chaos Theory' icon='Zap' img={chaosTheoryImage} description="Explore complex systems and nonlinear dynamics" />
        <CourseCard title='Game Theory' icon='Users' img={gameTheoryImage} description="Strategic decision making and mathematical modeling" />

        <CourseCard title='Linear Algebra' icon='Grid3X3' img={linearAlgebraImage} description="Vectors, matrices, and linear transformations" />
        <CourseCard title='Probability' icon='Dice6' img={probabilityImage} description="Statistical analysis and random processes" />
        <CourseCard title='Time Series' icon='Clock' img={timeSeriesImage} description="How we turn Time data into insights" />

      </div>
    </div>
  );
};
