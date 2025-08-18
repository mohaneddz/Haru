import { Accessor, createSignal, onMount, Setter, Show, createEffect } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useNavigate } from '@solidjs/router';

interface Props {
  title: string;
  type: string;
  link?: string;
  offline?: boolean;
  tags?: string[];
  selection: Accessor<boolean>;
  setSelection: Setter<boolean>;
  onSelect: (selected: boolean) => void;
  isSelected: Accessor<boolean>;
}

const DOCUMENT_PLACEHOLDER_IMG = "/default-document.jpg";

export default function DocumentCard(props: Props) {

  const navigate = useNavigate();

  const [thumbnail, setThumbnail] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [_, setThumbError] = createSignal(false);
  const [longPressTimeout, setLongPressTimeout] = createSignal<number | null>(null);
  
  // FIX: Use the prop to initialize the local state. This makes the component's
  // visual state consistent with the parent's state from the start.
  const [isSelectedForUI, setIsSelectedForUI] = createSignal(props.isSelected());

  let didLongPress = false;

  const isLocal = !!props.offline;
  const safeLink = props.link ?? '';
  const examplePdf = 'D:\\Programming\\Projects\\Tauri\\haru\\public\\pdf\\example.pdf';
  const localPdfPath = isLocal ? (safeLink || examplePdf) : '';

  onMount(async () => {
    setLoading(true);
    setThumbError(false);

    try {
      if (isLocal) {
        if (!localPdfPath) throw new Error('no local path');
        const base64 = await invoke<string>('generate_pdf_thumbnail', { pdfPath: localPdfPath });
        if (!base64) throw new Error('empty thumbnail');
        const isDataUri = base64.startsWith('data:');
        setThumbnail(isDataUri ? base64 : `data:image/png;base64,${base64}`);
      } else {
        if (!safeLink) throw new Error('no remote link');

        try {
          const res = await fetch("http://localhost:3999/pdf-thumbnail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: safeLink })
          });
          if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
          const data = await res.json();
          if (data.thumbnail) {
            setThumbnail(data.thumbnail);
          } else {
            if (data.error) // console.warn(`Server error: ${data.error}`);
              throw new Error('No thumbnail in server response');
          }
        } catch (err) {
          // console.warn('Backend thumbnail fetch failed, falling back to thum.io:', err);
          const getPreviewUrl = () => `https://image.thum.io/get/width/400/crop/600/allowJPG/wait/20/noanimate/${safeLink}`;
          setThumbnail(getPreviewUrl());
        }
      }
    } catch (err) {
      // console.warn('Thumbnail generation failed:', err);
      setThumbError(true);
      setThumbnail(DOCUMENT_PLACEHOLDER_IMG);
    } finally {
      setLoading(false);
    }
  });

  const encodedLocalPath = encodeURIComponent(localPdfPath);
  const internalHref = `/pdf?path=${encodedLocalPath}`;

  const handleClick = (event: MouseEvent) => {
    if (didLongPress) {
      didLongPress = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // FIX: This block is now corrected
    if (props.selection()) {
      event.preventDefault();
      event.stopPropagation(); // Stop the event from propagating further
      
      const newState = !isSelectedForUI(); // Determine the new state
      setIsSelectedForUI(newState);      // Update the local UI state
      props.onSelect?.(newState);          // Notify the parent component
      return;
    }

    if (!isLocal && safeLink) {
      event.preventDefault();
      event.stopPropagation();
      void openUrl(safeLink);
    } else {
      navigate(internalHref);
    }
  };

  const handleLongPressStart = () => {
    if (props.setSelection) {
      const timeout = window.setTimeout(() => {
        props.setSelection(true);
        // When long press triggers selection mode, this item should be the first one selected.
        setIsSelectedForUI(true);
        props.onSelect?.(true);
        didLongPress = true;
      }, 500);
      setLongPressTimeout(timeout);
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimeout()) {
      clearTimeout(longPressTimeout()!);
      setLongPressTimeout(null);
    }
  };

  // Keep in sync with parent selection state
  createEffect(() => {
    setIsSelectedForUI(props.isSelected());
  });

  return (
    <div
      class={`cursor-pointer p-0.5 bg-gradient-to-br from-border-light-2 to-border-dark-2 rounded-lg shadow-md hover:shadow-lg transition duration-150 hover:scale-105 active:scale-100 overflow-hidden group w-full max-w-[280px] h-[360px] ${props.selection()
        ? isSelectedForUI()
          ? 'ring-4 ring-primary/60 shadow-none'
          : 'ring-4 ring-sidebar-light-2/60 shadow-none'
        : ''
        }`}
      onClick={handleClick}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
    >
      <div class="relative rounded-lg overflow-hidden bg-background-light-3 w-full h-full transition-shadow duration-300 group-hover:shadow-[0_0_15px_2px_rgba(255,255,255,0.1)]">
        {thumbnail() ? (
          <div class="absolute inset-0 w-full h-full bg-white z-0">
            <img
              src={thumbnail()!}
              alt={`${props.title} thumbnail`}
              class="w-full h-full object-contain"
              onError={() => {
                setThumbError(true);
                setThumbnail(DOCUMENT_PLACEHOLDER_IMG);
              }}
            />
          </div>
        ) : (
          <div class="absolute inset-0 w-full h-full bg-sidebar-light-3 z-0 flex items-center justify-center">
            {loading() ? (
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            ) : (
              <img
                src={DOCUMENT_PLACEHOLDER_IMG}
                alt="Default document preview"
                class="absolute inset-0 w-full h-full object-cover rounded-xl z-0"
              />
            )}
          </div>
        )}

        <div
          class="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(0deg, rgba(30,30,40,1) 0%, rgba(30,30,40,0.7) 25%, rgba(0,0,0,0.0) 40%)',
          }}
        />

        <div class="absolute top-0 right-2 z-20">
          <span
            class={`text-[0.6rem] font-medium px-2 py-0.5 bg-black/60 rounded uppercase ${isLocal ? 'text-accent' : 'text-gray-300'}`}
          >
            {props.type ? props.type : 'Document'}
          </span>
        </div>

        <Show when={isLocal}>
          <div class="absolute top-0 left-2 z-20">
            <span
              class={`text-[0.6rem] font-medium px-2 py-0.5 bg-black/60 rounded uppercase ${isLocal ? 'text-accent' : 'text-gray-300'}`}
            >
              {isLocal ? 'Local' : 'Remote'}
            </span>
          </div>
        </Show>

        <div class="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 flex flex-col gap-2 translate-y-8 group-hover:-translate-y-4 transition-transform duration-300">
          <p class="text-sm text-nowrap font-bold text-accent line-clamp-2 transition-colors">
            {props.title}
          </p>
          {props.tags && props.tags.length > 0 && (
            <div class="flex-nowrap gap-1 mt-1 flex transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
              {props.tags.slice(0, 2).map(tag => (
                <span class="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full truncate">
                  {tag}
                </span>
              ))}
              {props.tags.length > 3 && (
                <span class="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
                  +{props.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}