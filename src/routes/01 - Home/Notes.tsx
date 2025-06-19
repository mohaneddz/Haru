import Files from "@/routes/01 - Home/sidebar/Files";

import TextDisplayArea from "@/components/01 - Home/NoteArea";
import NoteTopBar from "@/components/01 - Home/NoteTopBar";
import NotesToolBar from "@/components/01 - Home/NotesToolBar";
import { TextExample } from "@/data/TextExample";

import { Paperclip } from "lucide-solid";


function FileSelectorButton() {
  return (
    <a class="absolute bottom-4 left-0 right-0 mx-auto w-fit h-10 bg-background-dark-2 border border-border rounded-md flex items-center justify-center text-muted hover:bg-muted/20 transition-colors duration-200 cursor-pointer z-50">
      // <Paperclip size={18} class="mr-2" />
    </a>
  );
};

export default function Notes() {

  return (
    <div class="flex items-center justify-start h-full w-full bg-background-dark-2">

      <Files class='z-50' />

      <div class="w-full items-center flex flex-col h-full justify-start">

        <NoteTopBar />
        <TextDisplayArea text={TextExample}/>
        <NotesToolBar />
        {/* <FileSelectorButton /> */}
      </div>
    </div>
  );
};