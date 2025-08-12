import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { readFile } from '@tauri-apps/plugin-fs';

function mimeFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
    case 'mp4':
      return 'audio/mp4';
    case 'ogg':
      return 'audio/ogg';
    case 'flac':
      return 'audio/flac';
    case 'aac':
      return 'audio/aac';
    case 'opus':
      return 'audio/opus';
    default:
      return 'audio/*';
  }
}

export default function AudioTranscribe() {
  const [filePath, setFilePath] = createSignal<string>('');
  const [audioSrc, setAudioSrc] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string>('');

  let revokeUrl: string | null = null;

  async function loadAudioFromPath(path: string) {
    try {
      setError('');
      // Revoke previous URL
      if (revokeUrl) {
        URL.revokeObjectURL(revokeUrl);
        revokeUrl = null;
      }

      const bytes = await readFile(path);
      const mime = mimeFromPath(path);
      const blob = new Blob([new Uint8Array(bytes as any)], { type: mime });
      const url = URL.createObjectURL(blob);
      revokeUrl = url;
      setAudioSrc(url);
      setFilePath(path);
    } catch (e: any) {
      console.error('Error reading audio file:', e);
      setError('Failed to read audio file');
      setAudioSrc(null);
    }
  }

  onMount(async () => {
    const webview = getCurrentWebview();
    const unlisten = await webview.onDragDropEvent(async (event) => {
      if (event.payload.type === 'drop' && event.payload.paths?.length) {
        const path = event.payload.paths[0];
        if (path.match(/\.(mp3|wav|m4a|ogg|flac|aac|opus)$/i)) {
          await loadAudioFromPath(path);
        } else {
          setError('Unsupported file type. Drop an audio file.');
        }
      }
    });

    onCleanup(() => {
      unlisten();
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    });
  });

  return (
    <div class="p-4">
      <div class="border-2 border-dashed border-gray-500/50 rounded-md p-6 text-center text-text-light-2/70">
        <p class="mb-2">Drop your audio file here</p>
        <p class="text-xs opacity-60">Supported: mp3, wav, m4a, ogg, flac, aac, opus</p>
      </div>

      <div class="mt-4 text-sm text-text-light-2/70">
        <p>Dropped File: {filePath() || '—'}</p>
        <Show when={error()}>
          <p class="text-red-400 mt-2">{error()}</p>
        </Show>
      </div>

      <Show when={!!audioSrc()}>
        <div class="mt-4">
          <p class="mb-2 text-text-light-2">Preview:</p>
          <audio src={audioSrc()!} controls preload="metadata" class="w-full" />
        </div>
      </Show>
    </div>
  );
}
