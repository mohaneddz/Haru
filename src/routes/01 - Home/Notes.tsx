import Files from "@/routes/01 - Home/Sidebar/Files";
import CodeMirrorEditor from "@/components/01 - Home/Notes/NoteEditor";

import { Link } from "lucide-solid";

import NoteTopBar from "@/components/01 - Home/Notes/NoteTopBar";
import NotesToolBar from "@/components/01 - Home/Notes/NotesToolBar";
import { useNotes } from "@/hooks/home/useNotes";

export default function Notes() {
  // @ts-ignore
  let { currFile, setCurrFile, content, setContent, editorContainerRef, openObsidian } = useNotes();

  return (
    <div class="flex items-center justify-start h-full w-full bg-background-dark-2">

      <Files class='z-50' currFile={currFile} setCurrFile={setCurrFile} />

      <div class="w-full flex flex-col h-full relative">

        <NoteTopBar />

        <NotesToolBar />

        <div
          ref={el => editorContainerRef = el}
          class="overflow-x-hidden justify-center items-center mx-16 drop-shadow-lg min-w-100 h-full bg-background-light-1"
        >
          <div class="absolute top-4 left-4" title="Open in Obsidian" onClick={openObsidian}>
            <Link class="text-primary cursor-pointer" />
          </div>

          <CodeMirrorEditor
            content={content()}
            onChange={(v) => setContent(v)}
          />
        </div>
      </div>
    </div>
  );
}