// import { createSignal, For } from 'solid-js';

import Plugin from '@/components/04 - Tools/Plugin';

export default function Plugins() {

  return (
    <main class="flex flex-col items-center justify-center w-[90%] h-full">

      <div class="my-4 mx-auto mt-16 z-50 flex flex-col items-center gap-2">
        <h1 class="text-2xl font-bold text-white">Plugins</h1>
        <p class="text-gray-400 text-center">Manage and configure your plugins here.</p>
      </div>

      <div class="bg-sidebar gap-4 w-full h-full p-4 border border-white/10 overflow-y-auto rounded-md ">        <div class="grid grid-cols-2 auto-rows-max gap-4">
          <Plugin 
            title="Pomodoro Timer" 
            description="AI-powered focus timer that adapts to your productivity patterns and suggests optimal break intervals based on your study habits and energy levels throughout the day." 
            icon="Timer" 
            enabled={true} 
          />
          <Plugin 
            title="Document Highlighter" 
            description="Intelligent text highlighting tool that uses AI to identify key concepts, important definitions, and critical information in your study materials automatically." 
            icon="Highlighter" 
            enabled={false} 
          />
          <Plugin 
            title="Quiz Maker" 
            description="Generate comprehensive quizzes and practice tests from your notes and documents using AI. Automatically creates multiple choice, fill-in-the-blank, and essay questions." 
            icon="HelpCircle" 
            enabled={true} 
          />
          <Plugin 
            title="Flashcard Generator" 
            description="Transform your study materials into interactive flashcards with spaced repetition algorithms that optimize review timing based on your memory retention patterns." 
            icon="BookOpen" 
            enabled={false} 
          />
          <Plugin 
            title="Study Scheduler" 
            description="AI-driven study planner that creates personalized schedules based on your goals, deadlines, and learning preferences while balancing workload across subjects." 
            icon="Calendar" 
            enabled={true} 
          />
          <Plugin 
            title="Note Summarizer" 
            description="Automatically condense lengthy documents and lecture notes into concise summaries while preserving key concepts and important details for efficient review." 
            icon="FileText" 
            enabled={false} 
          />
          <Plugin 
            title="Concept Mapper" 
            description="Visual learning tool that creates interactive mind maps and concept diagrams from your notes, showing relationships between ideas and topics." 
            icon="Network" 
            enabled={true} 
          />
          <Plugin 
            title="Progress Tracker" 
            description="Comprehensive learning analytics dashboard that monitors your study habits, tracks goal completion, and provides insights into your learning patterns and productivity." 
            icon="TrendingUp" 
            enabled={false} 
          />
          <Plugin 
            title="Voice Recorder" 
            description="Smart audio recording tool with AI transcription that converts lectures and voice notes into searchable text with automatic speaker identification and timestamps." 
            icon="Mic" 
            enabled={true} 
          />
          <Plugin 
            title="Citation Manager" 
            description="Academic reference assistant that automatically formats citations, manages bibliography, and checks for proper attribution across multiple citation styles." 
            icon="Quote" 
            enabled={false} 
          />
          <Plugin 
            title="Focus Assistant" 
            description="AI-powered distraction blocker that learns your focus patterns and automatically blocks distracting websites and applications during your designated study time." 
            icon="Shield" 
            enabled={true} 
          />
          <Plugin 
            title="Math Solver" 
            description="Advanced mathematical problem solver with step-by-step explanations, graph plotting, and equation solving capabilities for algebra, calculus, and statistics." 
            icon="Calculator" 
            enabled={false} 
          />
          <Plugin 
            title="Language Tutor" 
            description="Personalized language learning assistant with pronunciation feedback, grammar correction, and adaptive vocabulary building based on your proficiency level." 
            icon="Languages" 
            enabled={true} 
          />
          <Plugin 
            title="Research Assistant" 
            description="AI-powered research tool that helps find relevant academic sources, summarizes research papers, and identifies key findings related to your study topics." 
            icon="Search" 
            enabled={false} 
          />
          <Plugin 
            title="Memory Palace" 
            description="Virtual memory enhancement tool that helps create and navigate memory palaces using spatial learning techniques and visual associations for better information retention." 
            icon="Brain" 
            enabled={true} 
          />
          <Plugin 
            title="Habit Tracker" 
            description="Behavioral analytics tool that monitors study habits, tracks consistency, and provides personalized recommendations to build effective learning routines and maintain motivation." 
            icon="CheckCircle" 
            enabled={false} 
          />
        </div>

      </div>
    </main>

  );
};
