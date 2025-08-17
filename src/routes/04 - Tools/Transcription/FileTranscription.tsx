import { Show } from 'solid-js';

import CodeMirrorEditor from "@/components/01 - Home/Notes/CodeMirrorEditor";
import Button from '@/components/core/Input/Button';
import useTranscript from '@/hooks/plugins/useFileTranscript';

import Download from 'lucide-solid/icons/download';
import Stars from 'lucide-solid/icons/stars';
import Pen from 'lucide-solid/icons/pen';

export default function FileTranscription() {

  const {
    transcription,
    setTranscription,
    filePath,
    audioSrc,
    error,
    loadingTranscript,
    loadingRefinement,
    handleTranscribe,
    saveTranscript,
    refineTranscript,
    dragging,
    setDragging,
  } = useTranscript();

  return (
    <main
      class="flex flex-col p-8 h-screen w-full max-w-6xl mx-auto relative items-center z-80 mt-20"
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
    >
      <p class="text-center text-text-light-2/70 mb-8">
        Drop an audio file anywhere on this page to start transcription
      </p>

      <Show when={dragging()}>
        <div class="absolute inset-0 bg-primary/20 border-4 border-dashed border-primary rounded-lg flex items-center justify-center text-primary text-xl font-bold pointer-events-none transition-all z-1000">
          Drop your audio here
        </div>
      </Show>

      <div class="mt-4 text-sm text-text-light-2 w-full">
        <div>Dropped File:
          <p class="text-accent">
            {filePath() || '—'}
          </p>
        </div>
        <Show when={error()}>
          <p class="text-red-400 mt-2">{error()}</p>
        </Show>
      </div>

      <Show when={!!audioSrc()}>
        <div class="bg-sidebar p-4 rounded-md border border-sidebar-light-3 shadow-md flex justify-center items-center w-full">
          <audio
            src={audioSrc()!}
            controls
            preload="metadata"
            class="w-full max-w-3xl rounded-lg bg-background-light-1 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
      </Show>

      <div class="bg-sidebar flex flex-col p-4 rounded-md border-1 border-sidebar-light-3 my-8 h-full w-full overflow-y-hidden">
        <div class="flex justify-between items-center mb-2">
          <p class="mb-2 text-text-light-2">Transcription:</p>
          <div class="flex gap-4">
            <Download class="text-primary cursor-pointer" onClick={saveTranscript} />
          </div>
        </div>
        <div class="overflow-x-hidden justify-center items-center px-4 drop-shadow-lg h-full bg-background-light-1 rounded-md overflow-y-auto">
          <CodeMirrorEditor content={transcription() || ''} onChange={setTranscription} class='h-full' />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-8 w-full max-w-lg">
        <Button variant='primary' onClick={handleTranscribe} disabled={loadingTranscript() || loadingRefinement()} class='flex gap-4 center'>
          <Pen class=" cursor-pointer ml-2" />
          {loadingTranscript() ? 'Transcribing…' : 'Transcribe'}
        </Button>
        <Button variant='secondary' class="flex gap-4 center" disabled={loadingRefinement()} onClick={refineTranscript}>
          <Stars class=" cursor-pointer ml-2" />
          {loadingRefinement() ? 'Refining…' : 'Refine'}
        </Button>

      </div>

    </main>
  );
}
