import VideoCard from "@/components/01 - Home/Cards/VideoCard";
import MainSeperator from "@/components/01 - Home/Cards/MainSeperator";

import rl from '/data/videos/rl.jpg';
import dl from '/data/videos/dl.jpg';
import cv from '/data/videos/cv.jpg';
import nlp from '/data/videos/nlp.jpg';
import genai from '/data/videos/genai.jpg';
import tools from '/data/videos/tools.jpg';
import agents from '/data/videos/agents.jpg';
import transformers from '/data/videos/transformers.jpg';
import data from '/data/videos/data.jpg';
import ethics from '/data/videos/ethics.jpg';
import math from '/data/videos/math.jpg';
import projects from '/data/videos/projects.jpg';

export default function Videos() {
  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll mt-20">

      <MainSeperator title='Artificial Intelligence' description='Explore core AI topics' />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4">
        <VideoCard title="Reinforcement Learning Intro" description="Understand agents, environments and rewards." icon="Play" img={rl} duration="12:34" type="video" />
        <VideoCard title="Neural Networks Full Course" description="Master the foundations of deep learning." icon="Brain" img={dl} type="playlist" count={12} />
        <VideoCard title="Transformers Explained" description="Dive into the architecture behind ChatGPT." icon="Zap" img={transformers} duration="18:45" type="video" />
      </div>

      {/* 🧠 Machine Learning Section */}
      <MainSeperator title='Machine Learning' description='Build predictive models and train smart systems.' />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4">
        <VideoCard title="Intro to Computer Vision" description="Make models see and interpret the world." icon="Camera" img={cv} type="playlist" count={8} />
        <VideoCard title="NLP Crash Course" description="Teach machines to understand language." icon="MessageCircle" img={nlp} duration="9:22" type="video" />
        <VideoCard title="Data Preprocessing" description="Clean and prepare your datasets." icon="Filter" img={data} duration="7:11" type="video" />
      </div>

      {/* 🔧 Tools & Frameworks */}
      <MainSeperator title='Tools & Frameworks' description='Learn the libraries that power modern AI.' />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4">
        <VideoCard title="PyTorch Quickstart" description="A fast intro to PyTorch fundamentals." icon="Code2" img={tools} duration="6:45" type="video" />
        <VideoCard title="Using Hugging Face" description="Pre-trained models in seconds." icon="Package" img={genai} duration="11:30" type="video" />
        <VideoCard title="Building RL Agents" description="Hands-on guide to agent training." icon="Bot" img={agents} type="playlist" count={5} />
      </div>

      {/* 🎓 Extras */}
      <MainSeperator title='Extras & Deep Dives' description='Complementary knowledge for serious learners.' />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4">
        <VideoCard title="Math for AI" description="Linear algebra, calculus and probability essentials." icon="FunctionSquare" img={math} type="playlist" count={10} />
        <VideoCard title="Ethics in AI" description="Bias, fairness, and AI responsibility." icon="ShieldQuestion" img={ethics} duration="14:20" type="video" />
        <VideoCard title="AI Projects Showcase" description="Real-world builds and portfolio boosters." icon="TerminalSquare" img={projects} type="playlist" count={6} />
      </div>

    </div>
  );
}
