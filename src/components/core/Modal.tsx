import { JSX, onCleanup, onMount } from "solid-js";
// import { createSignal } from "solid-js";
import { X } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import SelectInput from "@/components/core/Input/SelectInput";
import type { Document, Video, Tool, UrlString } from "@/types/home/resource";

interface Props {
  children?: JSX.Element | JSX.Element[];
  onClose?: () => void;
  show?: boolean;
}

export default function Modal(props: Props) {
  let modalRef: HTMLDivElement | undefined;

  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef && !modalRef.contains(e.target as Node)) {
      props.onClose?.();
    }
  };

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));
  });

  return (
    <div class={`fixed inset-0 flex items-center justify-center bg-black/90 bg-opacity-50 z-100 ${props.show ? 'block' : 'hidden'}`}>
      <div ref={modalRef} class="relative bg-sidebar rounded-lg p-4 shadow-lg border border-gray-600 z-101">
        <button
          onClick={props.onClose}
          class="absolute top-2 right-2 text-gray-400 hover:text-text transition-colors"
        >
          <X size={18} />
        </button>
        {props.children}
      </div>
    </div>
  );
}

export function AddResourceModal(props: {
  show: boolean;
  onClose?: () => void;
  onSubmit: (item: { kind: 'document' | 'video' | 'tool'; data: Document | Video | Tool }) => void;
}) {
  const [kind, setKind] = createSignal<'document' | 'video' | 'tool'>('document');
  const [error, setError] = createSignal<string | null>(null);

  // Shared fields
  const [title, setTitle] = createSignal('');
  const [tags, setTags] = createSignal('');

  // Document-specific
  const [docType, setDocType] = createSignal('Lecture');
  const [docLink, setDocLink] = createSignal('');

  // Video-specific
  const [videoImg, setVideoImg] = createSignal('');
  const [videoDuration, setVideoDuration] = createSignal('');
  const [videoCount, setVideoCount] = createSignal<number>(1);
  const [videoLink, setVideoLink] = createSignal('');

  // Tool-specific
  const [toolDescription, setToolDescription] = createSignal('');
  const [toolLink, setToolLink] = createSignal('');

  const isHttpUrl = (u: string) => {
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const toUrlString = (u: string) => (u as UrlString);

  const handleSubmit = () => {
    setError(null);

    const parsedTags = tags()
      .split(/[;,]/)
      .map(t => t.trim())
      .filter(Boolean);

    if (kind() === 'document') {
      const data: Document = {
        title: title().trim(),
        type: docType().trim() || 'Lecture',
        link: docLink().trim(),
        tags: parsedTags,
        local: !isHttpUrl(docLink().trim()),
      };
      if (!data.title) return setError('Title is required.');
      if (!data.link) return setError('Link or local path is required.');
      props.onSubmit({ kind: 'document', data });
      props.onClose?.();
      return;
    }

    if (kind() === 'video') {
      if (!isHttpUrl(videoLink().trim())) return setError('Video link must be a valid http(s) URL.');
      const data: Video = {
        title: title().trim(),
        img: videoImg().trim(),
        duration: videoDuration().trim() || undefined,
        count: Number.isFinite(videoCount()) ? videoCount() : 1,
        tags: parsedTags,
        link: toUrlString(videoLink().trim()),
      };
      if (!data.title) return setError('Title is required.');
      if (!data.img) return setError('Thumbnail image URL is required.');
      props.onSubmit({ kind: 'video', data });
      props.onClose?.();
      return;
    }

    if (kind() === 'tool') {
      if (!isHttpUrl(toolLink().trim())) return setError('Tool link must be a valid http(s) URL.');
      const data: Tool = {
        title: title().trim(),
        description: toolDescription().trim(),
        link: toUrlString(toolLink().trim()),
        tags: parsedTags,
      };
      if (!data.title) return setError('Title is required.');
      if (!data.description) return setError('Description is required.');
      props.onSubmit({ kind: 'tool', data });
      props.onClose?.();
      return;
    }
  };

  return (
    <Modal show={props.show} onClose={props.onClose}>
      <div class="w-[560px] max-w-[90vw]">
        <h3 class="text-lg font-semibold text-accent mb-3">Add Resource</h3>

        <div class="grid grid-cols-3 gap-3">
          <label class="col-span-3 text-sm text-text/80">Type</label>
          <div class="col-span-3">
            <SelectInput
              id="resource-kind"
              options={[
                { value: 'document', label: 'Document' },
                { value: 'video', label: 'Video' },
                { value: 'tool', label: 'Tool' },
              ]}
              selected={kind()}
              onChange={(v) => setKind((v as string) as 'document' | 'video' | 'tool')}
            />
          </div>

          <label class="col-span-3 text-sm text-text/80 mt-2">Title</label>
          <input
            class="col-span-3 p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            placeholder="Enter title"
          />

          <Show when={kind() === 'document'}>
            <label class="col-span-3 text-sm text-text/80 mt-2">Type</label>
            <input
              class="col-span-3 p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
              value={docType()}
              onInput={(e) => setDocType(e.currentTarget.value)}
              placeholder="Lecture / Book / Exercise / Supplement"
            />

            <label class="col-span-3 text-sm text-text/80 mt-2">Link or local path</label>
            <input
              class="col-span-3 p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
              value={docLink()}
              onInput={(e) => setDocLink(e.currentTarget.value)}
              placeholder="https://example.com/document.pdf or D:\path\file.pdf"
            />
          </Show>

          <Show when={kind() === 'video'}>
            <label class="col-span-3 text-sm text-text/80 mt-2">Thumbnail URL</label>
            <input
              class="col-span-3 p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
              value={videoImg()}
              onInput={(e) => setVideoImg(e.currentTarget.value)}
              placeholder="https://example.com/thumb.jpg"
            />

            <div class="col-span-3 grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="text-sm text-text/80">Duration</label>
                <input
                  class="w-full p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
                  value={videoDuration()}
                  onInput={(e) => setVideoDuration(e.currentTarget.value)}
                  placeholder="e.g. 12:34"
                />
              </div>
              <div class="col-span-1">
                <label class="text-sm text-text/80">Count</label>
                <input
                  type="number"
                  min="1"
                  class="w-full p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
                  value={String(videoCount())}
                  onInput={(e) => setVideoCount(parseInt(e.currentTarget.value || '1', 10))}
                  placeholder="1"
                />
              </div>
            </div>

            <label class="col-span-3 text-sm text-text/80 mt-2">Video Link</label>
            <input
              class="col-span-3 p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
              value={videoLink()}
              onInput={(e) => setVideoLink(e.currentTarget.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </Show>

          <Show when={kind() === 'tool'}>
            <label class="col-span-3 text-sm text-text/80 mt-2">Description</label>
            <textarea
              class="col-span-3 p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
              value={toolDescription()}
              onInput={(e) => setToolDescription(e.currentTarget.value)}
              placeholder="What is this tool about?"
            />

            <label class="col-span-3 text-sm text-text/80 mt-2">Tool Link</label>
            <input
              class="col-span-3 p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
              value={toolLink()}
              onInput={(e) => setToolLink(e.currentTarget.value)}
              placeholder="https://example.com"
            />
          </Show>

          <label class="col-span-3 text-sm text-text/80 mt-2">Tags (comma or semicolon separated)</label>
          <input
            class="col-span-3 p-2 rounded border border-border-light-2 bg-sidebar-light-2 text-text"
            value={tags()}
            onInput={(e) => setTags(e.currentTarget.value)}
            placeholder="tag1, tag2; tag3"
          />
        </div>

        <Show when={error()}>
          <p class="text-error text-sm mt-3">{error()}</p>
        </Show>

        <div class="mt-4 flex justify-end gap-2">
          <button class="px-3 py-1 rounded bg-background-light-2 border border-border-light-2" onClick={props.onClose}>Cancel</button>
          <button class="px-3 py-1 rounded bg-accent text-text" onClick={handleSubmit}>Add</button>
        </div>
      </div>
    </Modal>
  );
}
