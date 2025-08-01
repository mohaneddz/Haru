import { Show, For } from "solid-js";
import { SolidMarkdown } from "solid-markdown";

// --- PLUGINS for Markdown & HTML Rendering ---
import remarkMath from "remark-math";       // For math syntax
import remarkGfm from "remark-gfm";          // For GitHub Flavored Markdown (tables, etc.)
import rehypeKatex from "rehype-katex";      // To render math with KaTeX
import rehypeRaw from 'rehype-raw';          // **CRITICAL**: This allows rendering HTML (like your <span> tags)
import "katex/dist/katex.min.css";         // Styles for KaTeX math rendering

// --- ICONS & TYPES ---
import { LoaderCircle } from "lucide-solid";

interface MessageProps {
  text: string;
  user: boolean;
  id: number;
  sources?: SourceData[];
  showSources?: boolean;
}

export default function Message(props: MessageProps) {
  // NOTE: The createSignal and createEffect have been removed.
  // Using props directly is the correct and idiomatic way in SolidJS
  // and it solves the infinite loop that was causing the crash.

  return (
    <div
      class={`flex w-full my-2 mx-6 ${props.user ? 'justify-end' : 'justify-start'}`}
    >
      <div class="flex flex-col">
        {/* Chat bubble */}
        <div
          class={`p-4 max-w-full prose whitespace-pre-wrap hyphens-auto rounded-lg text-lg break-words ${
            props.user
              ? 'bg-gray-800 text-white'
              : 'border-1 border-gray-600 bg-gray-900 text-text/90'
          }`}
        >
          {/* Use a Show component to display a loader while the text is empty */}
          <Show
            when={props.text}
            fallback={<LoaderCircle class="animate-spin" size={24} />}
          >
            <SolidMarkdown
              // Pass the streaming text prop directly here. Solid's reactivity handles updates automatically.
              children={props.text}
              // Plugins for extra markdown features like tables and checklists.
              remarkPlugins={[remarkMath, remarkGfm]}
              // Plugins to handle rendering. rehype-raw is essential for your HTML spans.
              rehypePlugins={[rehypeRaw, rehypeKatex]}
            />
          </Show>
        </div>

        {/* Sources display */}
        <Show when={props.showSources && props.sources && props.sources.length > 0}>
          <div class="flex flex-wrap gap-2 pl-2 mt-2">
            <For each={props.sources}>
              {(source, index) => (
                <div class="relative group z-50">
                  {/* Display citation number(s) */}
                  <span class="text-accent/40 text-[0.8rem] cursor-pointer">
                    {`[${source.prompt_indices?.join(", ") ?? index() + 1}]`}
                  </span>

                  {/* Tooltip that appears on hover */}
                  <div class="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 shadow-lg w-64">
                    <p class="font-bold truncate" title={source.title || source.path}>
                      {source.title || source.path}
                    </p>
                    <Show when={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-accent/40 hover:underline truncate block w-full"
                        title={source.url}
                      >
                        {source.url}
                      </a>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}