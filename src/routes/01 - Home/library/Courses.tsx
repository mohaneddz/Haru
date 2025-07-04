import MachineLearningImage from '@/data/ai/machine-learning.jpg';
import DeepLearningImage from '@/data/ai/deep-learning.jpg';
import ComputerVisionImage from '@/data/ai/computer-vision.jpg';
import NaturalLanguageProcessingImage from '@/data/ai/natural-language-processing.jpg';
import ReinforcementLearningImage from '@/data/ai/reinforcement-learning.jpg';
import SignalProcessingImage from '@/data/ai/signal-processing.jpg';

import CourseCard from "@/components/01 - Home/Cards/CourseCard";
import MainSeperator from '@/components/01 - Home/Cards/MainSeperator';

export default function Courses () {
  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll mt-20">

      <MainSeperator title='Artificial Intelligence' description='Explore our courses'/>

      <div class="grid grid-cols-3 gap-8 w-full max-w-[80%] p-4">

        <CourseCard title='Machine Learning' icon='Brain' img={MachineLearningImage} description="Algorithms that learn from data and make predictions" />
        <CourseCard title='Deep Learning' icon='Network' img={DeepLearningImage} description="Neural networks and artificial intelligence fundamentals" />
        <CourseCard title='Computer Vision' icon='Eye' img={ComputerVisionImage} description="Teaching machines to see and interpret visual data" />

        <CourseCard title='Natural Language Processing' icon='MessageSquare' img={NaturalLanguageProcessingImage} description="Understanding and processing human language" />
        <CourseCard title='Reinforcement Learning' icon='Target' img={ReinforcementLearningImage} description="AI agents learning through trial and reward" />
        <CourseCard title='Signal Processing' icon='Cpu' img={SignalProcessingImage} description="Building blocks of artificial intelligence systems" />

      </div>
    </div>
  );
};
