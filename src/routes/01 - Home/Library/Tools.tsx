import courseImage from '/data/math/time-series.jpg';

import ToolCard from "@/components/01 - Home/Cards/ToolCard";
import MainSeperator from '@/components/01 - Home/Cards/MainSeperator';

export default function Tools() {
  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll mt-20">

      <MainSeperator title='Artificial Intelligence' description='Explore our courses' />

      <div class="grid grid-cols-3 gap-8 w-full max-w-[80%] p-4">
        <ToolCard title="Trigonometry Cheatsheet" description="A comprehensive guide to trigonometric functions, identities, and formulas." img={courseImage} link="https://www.example.com/trigonometry-cheatsheet" />
        <ToolCard title="Calculus Basics" description="An introduction to the fundamental concepts of calculus, including limits, derivatives, and integrals." img={courseImage} link="https://www.example.com/calculus-basics" />
        <ToolCard title="Linear Algebra Essentials" description="Key concepts and techniques in linear algebra, including matrices, vectors, and transformations." img={courseImage} link="https://www.example.com/linear-algebra-essentials" />
        <ToolCard title="Statistics Fundamentals" description="Basic principles of statistics, including descriptive statistics, probability, and inferential statistics." img={courseImage} link="https://www.example.com/statistics-fundamentals" />
        <ToolCard title="Differential Equations" description="An overview of ordinary and partial differential equations, with applications in various fields." img={courseImage} link="https://www.example.com/differential-equations" />
        <ToolCard title="Mathematical Logic" description="Introduction to mathematical logic, including propositional and predicate logic." img={courseImage} link="https://www.example.com/mathematical-logic" />
        <ToolCard title="Complex Analysis" description="Study of complex numbers and functions, including analytic functions, contour integration, and residue theory." img={courseImage} link="https://www.example.com/complex-analysis" />
      </div>
    </div>
  );
};
