import { createSignal, Show, createMemo } from "solid-js";
import Separator from "@/components/01 - Home/Cards/MainSeperator";
import DocumentCard from "@/components/01 - Home/Cards/DocumentCard";
import VideoCard from "@/components/01 - Home/Cards/VideoCard";
import ToolCard from "@/components/01 - Home/Cards/ToolCard";
import ComposableFilter, { FilterState } from "@/components/01 - Home/Filters/ComposableFilter";
import { Tag, BookOpen, FileText } from "lucide-solid";

import rl from '/data/videos/rl.jpg';
import dl from '/data/videos/dl.jpg';
import cv from '/data/videos/cv.jpg';
import nlp from '/data/videos/nlp.jpg';
import genai from '/data/videos/genai.jpg';
import tools from '/data/videos/tools.jpg';

import doc1 from '/data/documents/doc1.png';
import doc2 from '/data/documents/doc2.png';
import doc3 from '/data/documents/doc3.png';
import doc4 from '/data/documents/doc4.png';

export default function Resources() {
  const [showDocuments, setShowDocuments] = createSignal(true);
  const [showVideos, setShowVideos] = createSignal(true);
  const [showTools, setShowTools] = createSignal(true);
  const [filters, setFilters] = createSignal<FilterState>({
    searchQuery: "",
    selectedTags: [],
    selectedFields: [],
    selectedTypes: []
  });

  // Define all available options for filtering
  const availableTags = [
    "fundamentals", "course", "exercise", "supplement", "reference",
    "advanced", "beginner", "matlab", "python", "lab", "theory",
    "practical", "audio", "biomedical", "communication", "image",
    "radar", "sensors", "speech", "wireless", "fourier", "filtering",
    "sampling", "transform", "spectral", "adaptive", "tutorial",
    "software", "tools", "programming", "simulation"
  ];

  const availableFields = [
    "Signal Processing", "Digital Communications", "Biomedical Engineering",
    "Audio Processing", "Image Processing", "Radar Systems", "Machine Learning",
    "Software Development", "Mathematics", "Programming"
  ];

  const availableTypes = [
    "Exercises", "Book", "Sheet", "Paper", "Notes", "Video", "Playlist", "Software", "Tool"
  ];

  // Document data with tags and fields
  const documentsData = [
    { 
      title: "Classification (Part 1)", 
      description: "Introduction to classification techniques", 
      type: "Notes", 
      icon: "FileText", 
      img: doc1, 
      tags: ["classification", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Classification (part 1).pptx.pdf" 
    },
    { 
      title: "Classification (Part 2)", 
      description: "Advanced classification methods", 
      type: "Notes", 
      icon: "FileText", 
      img: doc2, 
      tags: ["classification", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Classification (part 2).pdf" 
    },
    { 
      title: "Clustering (Part 1)", 
      description: "Basics of clustering algorithms", 
      type: "Notes", 
      icon: "FileText", 
      img: doc3, 
      tags: ["clustering", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Clustering (part 1).pdf" 
    },
    { 
      title: "Clustering (Part 2)", 
      description: "Intermediate clustering techniques", 
      type: "Notes", 
      icon: "FileText", 
      img: doc4, 
      tags: ["clustering", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Clustering (part 2).pptx.pdf" 
    },
    { 
      title: "Clustering (Part 3)", 
      description: "Advanced clustering methods", 
      type: "Notes", 
      icon: "FileText", 
      img: doc1, 
      tags: ["clustering", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Clustering (part 3).pdf" 
    },
    { 
      title: "Clustering (Part 4)", 
      description: "Applications of clustering algorithms", 
      type: "Notes", 
      icon: "FileText", 
      img: doc2, 
      tags: ["clustering", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Clustering (part 4).pdf" 
    },
    { 
      title: "Data (Part 1)", 
      description: "Understanding data preprocessing", 
      type: "Notes", 
      icon: "FileText", 
      img: doc3, 
      tags: ["data", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Data - Part 1.pdf" 
    },
    { 
      title: "Data (Part 2)", 
      description: "Advanced data preprocessing techniques", 
      type: "Notes", 
      icon: "FileText", 
      img: doc4, 
      tags: ["data", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Data - Part 2.pdf" 
    },
    { 
      title: "Dimensionality Reduction (Part 1)", 
      description: "Introduction to dimensionality reduction", 
      type: "Notes", 
      icon: "FileText", 
      img: doc1, 
      tags: ["dimensionality reduction", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Dimensionality Reduction (part 1).pdf" 
    },
    { 
      title: "Dimensionality Reduction (Part 2)", 
      description: "Advanced dimensionality reduction techniques", 
      type: "Notes", 
      icon: "FileText", 
      img: doc2, 
      tags: ["dimensionality reduction", "machine learning", "AI"], 
      field: "Machine Learning", 
      href: "D:\\Programming\\Projects\\Tauri\\haru\\school\\AI\\machine learning\\Dimensionality Reduction (part 2).pdf" 
    }
  ];

  // Video data with tags and fields
  const videosData = [
    { title: "Introduction to Fourier Transform", description: "Comprehensive explanation of Fourier analysis", icon: "Play", img: rl, duration: "45:30", type: "video" as const, tags: ["fourier", "fundamentals", "theory"], field: "Signal Processing" },
    { title: "Digital Filter Design", description: "Step-by-step guide to filter design", icon: "Play", img: dl, type: "playlist" as const, count: 8, tags: ["filtering", "practical", "tutorial"], field: "Signal Processing" },
    { title: "Sampling Theory Explained", description: "Understanding Nyquist theorem", icon: "Play", img: cv, duration: "32:45", type: "video" as const, tags: ["sampling", "theory", "fundamentals"], field: "Signal Processing" },
    { title: "Z-Transform Applications", description: "Practical system analysis", icon: "Play", img: nlp, duration: "41:20", type: "video" as const, tags: ["transform", "theory", "advanced"], field: "Signal Processing" },
    { title: "Adaptive Filtering", description: "LMS and RLS algorithms", icon: "Play", img: genai, type: "playlist" as const, count: 5, tags: ["adaptive", "filtering", "advanced"], field: "Signal Processing" },
    { title: "Spectral Analysis Methods", description: "Frequency domain analysis", icon: "Play", img: tools, duration: "36:55", type: "video" as const, tags: ["spectral", "theory", "advanced"], field: "Signal Processing" }
  ];

  // Tools data with tags and fields
  const toolsData = [
    { title: "MATLAB", description: "Industry-standard software for numerical computing and signal processing", icon: "Code2", img: doc1, link: "https://www.mathworks.com/products/matlab.html", tags: ["matlab", "software", "simulation"], field: "Software Development" },
    { title: "Python with NumPy", description: "Open-source numerical computing library forming the base of scientific Python stack", icon: "Code2", img: doc2, link: "https://numpy.org/", tags: ["python", "programming", "tools"], field: "Software Development" },
    { title: "GNU Octave", description: "Free alternative to MATLAB with similar syntax for numerical computation", icon: "Code2", img: doc3, link: "https://www.gnu.org/software/octave/", tags: ["software", "tools", "simulation"], field: "Software Development" },
    { title: "SciPy", description: "Powerful Python library for scientific and technical computing", icon: "Code2", img: doc4, link: "https://scipy.org/", tags: ["python", "programming", "tools"], field: "Software Development" },
    { title: "MATLAB Simulink", description: "Graphical modeling and simulation tool for multi-domain dynamic systems", icon: "Code2", img: doc1, link: "https://www.mathworks.com/products/simulink.html", tags: ["matlab", "simulation", "tools"], field: "Software Development" },
    { title: "LabVIEW", description: "Graphical development platform by NI for test, measurement, and control systems", icon: "Code2", img: doc2, link: "https://www.ni.com/en-us/shop/labview.html", tags: ["software", "tools", "simulation"], field: "Software Development" },
    { title: "GNU Radio", description: "Free, open-source toolkit for building software-defined radios and signal processing systems", icon: "Code2", img: doc3, link: "https://www.gnuradio.org/", tags: ["software", "tools", "communication"], field: "Digital Communications" }
  ];

  // Filter functions
  const matchesFilter = (item: any, filters: FilterState) => {
    const query = filters.searchQuery.toLowerCase();
    const matchesSearch = !query ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(query)));

    const matchesTags = filters.selectedTags.length === 0 ||
      (item.tags && filters.selectedTags.some(tag => item.tags.includes(tag)));

    const matchesFields = filters.selectedFields.length === 0 ||
      (item.field && filters.selectedFields.includes(item.field));

    const matchesTypes = filters.selectedTypes.length === 0 ||
      (item.type && filters.selectedTypes.includes(item.type));

    return matchesSearch && matchesTags && matchesFields && matchesTypes;
  };

  const filteredDocuments = createMemo(() => documentsData.filter(doc => matchesFilter(doc, filters())));
  const filteredVideos = createMemo(() => videosData.filter(video => matchesFilter(video, filters())));
  const filteredTools = createMemo(() => toolsData.filter(tool => matchesFilter(tool, filters())));

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll">

      {/* Composable Filter Component */}
      <div class="relative w-[80%] mt-20">
        <ComposableFilter
          title="Resource Filters"
          icon={Tag}
          onFilterChange={setFilters}
          pageType="resources"
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
            options: availableTypes,
            title: "Content Type",
            icon: FileText
          }}
        />
      </div>

      {/* ─── DOCUMENTS ───────────────────────────────────── */}
      <Separator
        title={`📄 Course Documents (${filteredDocuments().length})`}
        description="Essential material including notes, books, and references"
        onToggle={(isExpanded) => setShowDocuments(isExpanded)}
      />
      <Show when={showDocuments()}>
        <div class="grid grid-cols-4 gap-8 w-full max-w-[80%] p-4 transition-all duration-300">
          {filteredDocuments().map((doc) => (
            <DocumentCard
              title={doc.title}
              description={doc.description}
              type={doc.type}
              icon={doc.icon}
              href={doc.href}
              tags={doc.tags}
            />
          ))}
        </div>
      </Show>

      {/* ─── VIDEOS ───────────────────────────────────── */}
      <Separator
        title={`🎥 Video Lectures (${filteredVideos().length})`}
        description="Interactive lessons and walkthroughs"
        onToggle={(isExpanded) => setShowVideos(isExpanded)}
      />
      <Show when={showVideos()}>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4 transition-all duration-300">
          {filteredVideos().map((video) => (
            <VideoCard
              title={video.title}
              description={video.description}
              icon={video.icon}
              img={video.img}
              duration={video.duration}
              type={video.type}
              count={video.count}
              tags={video.tags}
            />
          ))}
        </div>
      </Show>

      {/* ─── TOOLS ───────────────────────────────────── */}
      <Separator
        title={`🛠️ Tools & Software (${filteredTools().length})`}
        description="Interactive software and environments for experimentation"
        onToggle={(isExpanded) => setShowTools(isExpanded)}
      />
      <Show when={showTools()}>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4 transition-all duration-300">
          {filteredTools().map((tool) => (
            <ToolCard
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              img={tool.img}
              link={tool.link}
              tags={tool.tags}
              field={tool.field}
            />
          ))}
        </div>
      </Show>

    </div>
  );
}