import Separator from "@/components/01 - Home/Cards/MainSeperator";
import DocumentCard from "@/components/01 - Home/Cards/DocumentCard";
import VideoCard from "@/components/01 - Home/Cards/VideoCard";

import rl from '@/data/videos/rl.jpg';
import dl from '@/data/videos/dl.jpg';
import cv from '@/data/videos/cv.jpg';
import nlp from '@/data/videos/nlp.jpg';
import genai from '@/data/videos/genai.jpg';
import tools from '@/data/videos/tools.jpg';
import agents from '@/data/videos/agents.jpg';
import transformers from '@/data/videos/transformers.jpg';
import data from '@/data/videos/data.jpg';
import ethics from '@/data/videos/ethics.jpg';
import math from '@/data/videos/math.jpg';
import projects from '@/data/videos/projects.jpg';

import doc1 from '@/data/documents/doc1.png';
import doc2 from '@/data/documents/doc2.png';
import doc3 from '@/data/documents/doc3.png';
import doc4 from '@/data/documents/doc4.png';

export default function Resources() {
  const handleDocumentClick = (title: string) => {
    console.log(`Opening document: ${title}`);
    // TODO: Add document opening logic
  };

  const handleVideoClick = (title: string) => {
    console.log(`Playing video: ${title}`);
    // TODO: Add video playing logic
  };

  const handleToolClick = (title: string) => {
    console.log(`Opening tool: ${title}`);
    // TODO: Add tool opening logic
  };

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll mt-20">

      {/* Course Documents Section */}
      <Separator title="Course Documents" description="Essential materials for signal processing" />
      <div class="grid grid-cols-4 gap-8 w-full max-w-[80%] p-4">
        <DocumentCard
          title="Signal Processing Fundamentals"
          description="Complete guide to signal processing basics"
          type="PDF"
          icon="FileText"
          img={doc1}
        />
        <DocumentCard
          title="MATLAB Code Examples"
          description="Collection of MATLAB scripts"
          type="PDF"
          icon="Code"
          img={doc2}
        />
        <DocumentCard
          title="Laboratory Manual"
          description="Step-by-step lab exercises"
          type="Book"
          icon="BookOpen"
          img={doc3}
        />
        <DocumentCard
          title="Reference Formulas"
          description="Quick reference sheet for formulas"
          type="Sheet"
          icon="Calculator"
          img={doc4}
        />
        <DocumentCard
          title="Python Signal Processing"
          description="Python implementation examples"
          type="PDF"
          icon="Code"
          img={doc1}
        />
        <DocumentCard
          title="Exam Preparation Guide"
          description="Study guide with practice problems"
          type="Notes"
          icon="GraduationCap"
          img={doc2}
        />
        <DocumentCard
          title="Advanced Topics"
          description="Deep dive into complex concepts"
          type="PDF"
          icon="FileText"
          img={doc3}
        />
        <DocumentCard
          title="Problem Sets"
          description="Comprehensive exercise collection"
          type="Sheet"
          icon="Calculator"
          img={doc4}
        />
      </div>

      {/* Video Lectures Section */}
      <Separator title="Video Lectures" description="Interactive learning through visual content" />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4">
        <VideoCard 
          title="Introduction to Fourier Transform" 
          description="Comprehensive explanation of Fourier analysis" 
          icon="Play" 
          img={rl} 
          duration="45:30" 
          type="video" 
        />
        <VideoCard 
          title="Digital Filter Design" 
          description="Step-by-step guide to filter design" 
          icon="Play" 
          img={dl} 
          type="playlist" 
          count={8} 
        />
        <VideoCard 
          title="Sampling Theory Explained" 
          description="Understanding Nyquist theorem" 
          icon="Play" 
          img={cv} 
          duration="32:45" 
          type="video" 
        />
        <VideoCard 
          title="Z-Transform Applications" 
          description="Practical system analysis" 
          icon="Play" 
          img={nlp} 
          duration="41:20" 
          type="video" 
        />
        <VideoCard 
          title="Adaptive Filtering" 
          description="LMS and RLS algorithms" 
          icon="Play" 
          img={genai} 
          type="playlist" 
          count={5} 
        />
        <VideoCard 
          title="Spectral Analysis Methods" 
          description="Frequency domain analysis" 
          icon="Play" 
          img={tools} 
          duration="36:55" 
          type="video" 
        />
      </div>

      {/* Software Tools Section */}
      <Separator title="Software Tools" description="Essential tools for signal processing" />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4">
        <div
          class="bg-card p-4 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all duration-200"
          onClick={() => handleToolClick("MATLAB Signal Processing Toolbox")}
        >
          <h3 class="text-lg font-semibold text-white mb-2">MATLAB Signal Processing Toolbox</h3>
          <p class="text-white/70 text-sm">Professional signal processing environment</p>
        </div>
        <div
          class="bg-card p-4 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all duration-200"
          onClick={() => handleToolClick("Python SciPy")}
        >
          <h3 class="text-lg font-semibold text-white mb-2">Python SciPy</h3>
          <p class="text-white/70 text-sm">Open-source Python library for scientific computing</p>
        </div>
        <div
          class="bg-card p-4 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all duration-200"
          onClick={() => handleToolClick("GNU Octave")}
        >
          <h3 class="text-lg font-semibold text-white mb-2">GNU Octave</h3>
          <p class="text-white/70 text-sm">Free alternative to MATLAB</p>
        </div>
        <div
          class="bg-card p-4 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all duration-200"
          onClick={() => handleToolClick("Audacity")}
        >
          <h3 class="text-lg font-semibold text-white mb-2">Audacity</h3>
          <p class="text-white/70 text-sm">Free audio editing software</p>
        </div>
        <div
          class="bg-card p-4 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all duration-200"
          onClick={() => handleToolClick("LabVIEW")}
        >
          <h3 class="text-lg font-semibold text-white mb-2">LabVIEW</h3>
          <p class="text-white/70 text-sm">Graphical programming environment</p>
        </div>
        <div
          class="bg-card p-4 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all duration-200"
          onClick={() => handleToolClick("R Signal Processing")}
        >
          <h3 class="text-lg font-semibold text-white mb-2">R Signal Processing</h3>
          <p class="text-white/70 text-sm">Statistical computing environment</p>
        </div>
      </div>

      {/* Practice Datasets Section */}
      <Separator title="Practice Datasets" description="Real data for hands-on learning" />
      <div class="grid grid-cols-4 gap-8 w-full max-w-[80%] p-4">
        <DocumentCard
          title="Audio Signal Dataset"
          description="Collection of audio files for processing"
          type="PDF"
          icon="Music"
          img={doc1}
        />
        <DocumentCard
          title="Biomedical Signals"
          description="ECG, EEG, and EMG signals"
          type="PDF"
          icon="Activity"
          img={doc2}
        />
        <DocumentCard
          title="Communication Signals"
          description="Modulated signals and noise samples"
          type="PDF"
          icon="Radio"
          img={doc3}
        />
        <DocumentCard
          title="Image Processing Dataset"
          description="Sample images for 2D processing"
          type="PDF"
          icon="Image"
          img={doc4}
        />
        <DocumentCard
          title="Radar Signal Data"
          description="Synthetic aperture radar examples"
          type="PDF"
          icon="Radar"
          img={doc1}
        />
        <DocumentCard
          title="Sensor Network Data"
          description="Multi-sensor array data"
          type="Sheet"
          icon="Sensors"
          img={doc2}
        />
        <DocumentCard
          title="Speech Processing Data"
          description="Voice recognition datasets"
          type="PDF"
          icon="Mic"
          img={doc3}
        />
        <DocumentCard
          title="Wireless Communications"
          description="Channel modeling datasets"
          type="Sheet"
          icon="Wifi"
          img={doc4}
        />
      </div>

    </div>
  );
};