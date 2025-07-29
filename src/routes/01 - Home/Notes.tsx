// TODO : Change to CodeMirror Editor
import Files from "@/routes/01 - Home/Sidebar/Files";
import { For, Show } from "solid-js";

import TextDisplayArea from "@/components/01 - Home/Notes/NoteArea";
import NoteTopBar from "@/components/01 - Home/Notes/NoteTopBar";
import NotesToolBar from "@/components/01 - Home/Notes/NotesToolBar";
import { useNotes } from "@/hooks/home/useNotes";

export default function Notes() {
  const { currLine, lineText, setCurrLine, setLineText, lineIndices, currFile, setCurrFile } = useNotes();

  return (
    <div class="flex items-center justify-start h-full w-full ">

      <Files class='z-50' currFile={currFile} setCurrFile={setCurrFile} />

      <div class="w-full flex flex-col h-full relative ">

        <NoteTopBar />
        <NotesToolBar />

        <div class="flex-1 overflow-x-hidden justify-center items-center mx-16 bg-background-dark-1 px-4 py-8 drop-shadow-lg rounded-md">

          <For each={lineIndices}>{(index) =>
            <>
              <Show when={currLine() !== index}>
                {/* Renders A Latex / Markdown version of that text */}
                <TextDisplayArea
                  id={`line-${index}`}
                  text={lineText()[index]}
                  onClick={() => setCurrLine(index)}
                />
              </Show>
              <Show when={currLine() === index}>
                <input
                  id={`line-${index}`}
                  type="text"
                  class="w-full text-text-light rounded-md p-2 focus:outline-none focus:ring-none focus:ring-primary transition-colors duration-200"
                  value={lineText()[index]}
                  onClick={() => setCurrLine(index)}
                  onChange={(e) => {
                    const newText = e.currentTarget.value;
                    setLineText((prev) => {
                      const newLines = [...prev];
                      newLines[index] = newText;
                      return newLines;
                    });
                  }}
                />
              </Show>
            </>
          }</For>
        </div>
      </div>
    </div>
  );
}