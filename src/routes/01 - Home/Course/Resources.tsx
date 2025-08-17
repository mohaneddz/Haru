import { Show, For, createSignal } from "solid-js";

import Separator from "@/components/01 - Home/Cards/MainSeperator";

import DocumentCard from "@/components/01 - Home/Cards/DocumentCard";
import VideoCard from "@/components/01 - Home/Cards/VideoCard";
import ToolCard from "@/components/01 - Home/Cards/ToolCard";

import UniversalFilter from "@/components/core/UniversalFilter";
import Tag from "lucide-solid/icons/tag";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Check from "lucide-solid/icons/check";

import FileText from "lucide-solid/icons/file-text";
import Youtube from "lucide-solid/icons/youtube";
import Wrench from "lucide-solid/icons/wrench";

import useResources from "@/hooks/home/useResources";

export default function Resources() {
  const {
    showDocuments,
    setShowDocuments,
    showVideos,
    setShowVideos,
    showTools,
    setShowTools,
    setFilters,
    availableTags,
    availableFields,
    availableTypes,
    filteredDocuments,
    filteredVideos,
    filteredTools,
    loadResources,
    appendDocuments,
    appendedDocuments,
    saveDocuments,
    appendVideos,
    appendedVideos,
    saveVideos,
    appendTools,
    appendedTools,
    saveTools,
    // searchResources
  } = useResources();

  // Global loading state for this page
  const [isLoading, setIsLoading] = createSignal(false);
  const runWithLoading = async (fn: () => any) => {
    if (isLoading()) return;
    setIsLoading(true);
    try {
      const r = fn?.();
      if (r && typeof r.then === "function") await r;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll" aria-busy={isLoading()}>
      <div class="relative w-[80%] mt-20 mb-8">
        <UniversalFilter
          title="Resource Filters"
          icon={<Tag class="text-accent" />}
          placeholder="Search resources..."
          onFilterChange={setFilters}
          availableTags={availableTags}
          tagsLabel="Tags"
          availableFields={availableFields}
          fieldsLabel="Subject Fields"
          availableTypes={availableTypes}
          typesLabel="Content Type"
          class="custom-filter-class"
        />
      </div>

      <Separator
        title={`Course Documents (${filteredDocuments()?.length ?? 0})`}
        description="Essential material including notes, books, and references"
        onToggle={(isExpanded) => setShowDocuments(isExpanded)}
      />
      <Show when={showDocuments()}>
        <div class="grid grid-cols-4 gap-8 w-full max-w-[80%] p-4 transition-all duration-300">
          <For each={filteredDocuments() ?? []}>
            {(doc) => (
              <DocumentCard
                title={doc.title}
                type={doc.type}
                link={doc.link}
                tags={doc.tags}
                offline={!!doc.local}
              />
            )}
          </For>
        </div>
      </Show>

      <Separator
        title={`Video Lectures (${filteredVideos()?.length ?? 0})`}
        description="Interactive lessons and walkthroughs"
        onToggle={(isExpanded) => setShowVideos(isExpanded)}
      />
      <Show when={showVideos()}>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4 transition-all duration-300">
          <For each={filteredVideos() ?? []}>
            {(video) => (
              <VideoCard
                img={video.img}
                title={video.title}
                duration={video.duration}
                count={video.count}
                tags={video.tags}
                link={video.link} // added so VideoCard can open the video
              />
            )}
          </For>
        </div>
      </Show>

      <Separator
        title={`Tools & Software (${filteredTools()?.length ?? 0})`}
        description="Interactive software and environments for experimentation"
        onToggle={(isExpanded) => setShowTools(isExpanded)}
      />
      <Show when={showTools()}>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-[80%] p-4 transition-all duration-300">
          <For each={filteredTools() ?? []}>
            {(tool) => (
              <ToolCard
                title={tool.title}
                description={tool.description}
                link={tool.link}
                tags={tool.tags}
              />
            )}
          </For>
        </div>
      </Show>

      <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-12 right-8 bg-accent-dark-2 rounded-full p-2
                  hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
           classList={{ "opacity-60 cursor-not-allowed": isLoading() }}
           onclick={() => runWithLoading(loadResources)} >
        <RotateCw class="w-6 h-6 text-text " />
      </div>
      <Show 
        when={appendedDocuments()} 
        fallback={
          <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-8 bg-accent-dark-2 rounded-full p-2 hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
               classList={{ "opacity-60 cursor-not-allowed": isLoading() }}
               onclick={() => runWithLoading(appendDocuments)}>
            <FileText class="w-6 h-6 text-text " />
          </div>
        }
      >
        <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-24 right-8 bg-success rounded-full p-2 hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
             classList={{ "opacity-60 cursor-not-allowed": isLoading() }}
             onclick={() => runWithLoading(saveDocuments)}>
          <Check class="w-6 h-6 text-text " />
        </div>
      </Show>

      <Show 
        when={appendedVideos()} 
        fallback={
          <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-36 right-8 bg-accent-dark-2 rounded-full p-2 hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
               classList={{ "opacity-60 cursor-not-allowed": isLoading() }}
               onclick={() => runWithLoading(appendVideos)}>
            <Youtube class="w-6 h-6 text-text " />
          </div>
        }
      >
        <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-36 right-8 bg-success rounded-full p-2 hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
             classList={{ "opacity-60 cursor-not-allowed": isLoading() }}
             onclick={() => runWithLoading(saveVideos)}>
          <Check class="w-6 h-6 text-text " />
        </div>
      </Show>

      <Show 
        when={appendedTools()} 
        fallback={
          <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-48 right-8 bg-accent-dark-2 rounded-full p-2 hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
               classList={{ "opacity-60 cursor-not-allowed": isLoading() }}
               onclick={() => runWithLoading(appendTools)}>
            <Wrench class="w-6 h-6 text-text " />
          </div>
        }
      >
        <div class="fixed z-50 aspect-square flex items-center justify-center mt-4 bottom-48 right-8 bg-success rounded-full p-2 hover:scale-105 hover:brightness-105 active:scale-95 active:brightness-95 cursor-pointer transition duration-200"
             classList={{ "opacity-60 cursor-not-allowed": isLoading() }}
             onclick={() => runWithLoading(saveTools)}>
          <Check class="w-6 h-6 text-text " />
        </div>
      </Show>

      {/* Full-screen overlay spinner that blocks clicks */}
      <Show when={isLoading()}>
        <div class="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div class="h-12 w-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        </div>
      </Show>
    </div >
  );
}
