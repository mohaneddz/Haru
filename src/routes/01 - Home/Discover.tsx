// Math pics (example data)
import timeSeriesImage from '@/data/math/time-series.jpg';
import calculusImage from '@/data/math/calculus.jpg';
import chaosTheoryImage from '@/data/math/chaos-theory.jpg';
import gameTheoryImage from '@/data/math/game-theory.jpg';
import linearAlgebraImage from '@/data/math/linear-algebra.jpg';
import probabilityImage from '@/data/math/probability.jpg';

// AI pics (example data)
import MachineLearningImage from '@/data/ai/machine-learning.jpg';
import DeepLearningImage from '@/data/ai/deep-learning.jpg';
import ComputerVisionImage from '@/data/ai/computer-vision.jpg';
import NaturalLanguageProcessingImage from '@/data/ai/natural-language-processing.jpg';
import ReinforcementLearningImage from '@/data/ai/reinforcement-learning.jpg';
import SignalProcessingImage from '@/data/ai/signal-processing.jpg';

import CourseCard from "@/components/01 - Home/CourseCard";
import MainSeperator from '@/components/01 - Home/MainSeperator';

export default function Discover() {
  return (
    <div class="flex flex-col items-center justify-start h-screen w-full overflow-y-scroll pt-[15vh]">

      <MainSeperator title='Artificial Intelligence' description='Explore our courses' />      
      <div class="grid grid-cols-3 gap-8 w-full max-w-[80%] p-4  my-8">

        <CourseCard title='Machine Learning' icon='Brain' img={MachineLearningImage} description="Algorithms that learn from data and make predictions" />
        <CourseCard title='Deep Learning' icon='Network' img={DeepLearningImage} description="Neural networks and artificial intelligence fundamentals" />
        <CourseCard title='Computer Vision' icon='Eye' img={ComputerVisionImage} description="Teaching machines to see and interpret visual data" />

        <CourseCard title='Natural Language Processing' icon='MessageSquare' img={NaturalLanguageProcessingImage} description="Understanding and processing human language" />
        <CourseCard title='Reinforcement Learning' icon='Target' img={ReinforcementLearningImage} description="AI agents learning through trial and reward" />
        <CourseCard title='Signal Processing' icon='Cpu' img={SignalProcessingImage} description="Building blocks of artificial intelligence systems" />

      </div>

      <MainSeperator title='Mathematics' description='Explore our courses' />

      <div class="grid grid-cols-3 gap-8 w-full max-w-[80%] p-4 my-8">
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
