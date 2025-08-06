// import SelectInput from "@/components/core/Input/SelectInput";
import Button from "@/components/core/Input/Button";
import Input from "@/components/core/Input/Input";
import usePaths from "@/hooks/settings/usePaths";

import { Folder, Plus, Minus } from "lucide-solid";
import { For } from "solid-js";
import { useNavigate } from "@solidjs/router";

export default function Paths() {

  const {
    NotesLocation,
    setNotesLocation,
    QuicknotesLocation,
    setQuicknotesLocation,
    DocumentsLocation,
    setDocumentsLocation,
    RAGLocation,
    setRAGLocation,
    addRAGLocation,
    removeRAGLocation,
    selectFolder,
    saveSettings,
    indexLocation,
    setIndexLocation,

  } = usePaths();

  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <section class="flex flex-col items-center h-min w-full mt-16">

      <div class="h-full w-full max-w-[60%] flex flex-col justify-between items-center">


        <h1 class="text-2xl font-bold mb-4">Paths Settings</h1>
        <p class="text-gray-500 mb-16">Configure paths for various features of your application.</p>

        <div class="w-full grid grid-cols-2 gap-4 gap-x-16">

          <label class="block mb-4">
            <span class="text-gray-500"> Notes Location</span>
          </label>
          <div class="flex gap-4">
            <div class="aspect-square px-2 center bg-sidebar-light-2 border border-border-light-2 rounded-md text-text/70 clickable" onClick={() => selectFolder(setNotesLocation)}>
              <Folder size={8} class="w-8 h-8 text-gray-400" />
            </div>
            <Input
              readonly
              searchTerm={NotesLocation()}
              setSearchTerm={setNotesLocation}
              class="w-full text-sm"
              id="default-notes-location"
            />
          </div>

          <label class="block mb-4">
            <span class="text-gray-500"> Quicknotes Location</span>
          </label>
          <div class="flex gap-4">
            <div class="aspect-square px-2 center bg-sidebar-light-2 border border-border-light-2 rounded-md text-text/70 clickable" onClick={() => selectFolder(setQuicknotesLocation)}>
              <Folder size={8} class="w-8 h-8 text-gray-400" />
            </div>
            <Input
              readonly
              searchTerm={QuicknotesLocation()}
              setSearchTerm={setQuicknotesLocation}
              class="w-full text-sm"
              id="default-quicknotes-location"
            />
          </div>


          <label class="block mb-4">
            <span class="text-gray-500">Modules Location</span>
          </label>
          <div class="flex gap-4">
            <div class="aspect-square px-2 center bg-sidebar-light-2 border border-border-light-2 rounded-md text-text/70 clickable" onClick={() => selectFolder(setDocumentsLocation)}>
              <Folder size={8} class="w-8 h-8 text-gray-400" />
            </div>
            <Input
              readonly
              searchTerm={DocumentsLocation()}
              setSearchTerm={setDocumentsLocation}
              class="w-full text-sm"
              id="default-documents-location"
            />
          </div>

          <div class="col-span-2 bg-accent-light-1/10 h-px my-4" />

          <label class="block mb-4">
            <span class="text-gray-500">Rag Indexes Location</span>
          </label>
          <div class="flex gap-4">
            <div class="aspect-square px-2 center bg-sidebar-light-2 border border-border-light-2 rounded-md text-text/70 clickable" onClick={() => selectFolder(setIndexLocation)}>
              <Folder size={8} class="w-8 h-8 text-gray-400" />
            </div>
            <Input
              readonly
              searchTerm={indexLocation()}
              setSearchTerm={setIndexLocation}
              class="w-full text-sm"
              id="default-index-location"
            />
          </div>

          <label class="block mb-4">
            <span class="text-gray-500">RAG Documents Location</span>
          </label>

          <div class="flex flex-col gap-2 relative">
            <For each={RAGLocation()}>{(location, index) => (
              <div class="flex gap-4">
                <div class="aspect-square px-2 center bg-sidebar-light-2 border border-border-light-2 rounded-md text-text/70 clickable" onClick={() => selectFolder((value) => {
                  const newLocations = [...RAGLocation()];
                  newLocations[index()] = typeof value === "string" ? value : String(value);
                  setRAGLocation(newLocations);
                })}>
                  <Folder size={8} class="w-8 h-8 text-gray-400" />
                </div>
                <Input
                  readonly
                  searchTerm={location}
                  setSearchTerm={(value) => {
                    const newLocations = [...RAGLocation()];
                    newLocations[index()] = value;
                    setRAGLocation(newLocations);
                  }}
                  class="w-full text-sm"
                  id={`rag-location-${index()}`}
                />
              </div> 
            )}</For>
            <div class="absolute -right-28 top-0 h-full flex gap-2 center">
              <div class="aspect-square px-2 center bg-sidebar-light-2 border border-border-light-2 rounded-full text-text/70 clickable" onClick={addRAGLocation}>
                <Plus size={8} class="w-4 h-4 text-gray-400 clickable" />
              </div>
              <div class="aspect-square px-2 center bg-sidebar-light-2 border border-border-light-2 rounded-full text-text/70 clickable" onClick={removeRAGLocation}>
                <Minus size={8} class="w-4 h-4 text-gray-400 clickable" />
              </div>
            </div>
          </div>

        </div>

        <div class=" w-full grid grid-cols-2 gap-4 mt-8">
          <Button
            onClick={goBack}
            variant="basic"
            class="w-full mt-4 text-center"
          >
            Cancel
          </Button>
          <Button
            onClick={saveSettings}
            variant="primary"
            class="w-full mt-4 text-center"
          >
            Save
          </Button>
        </div>

      </div>
    </section>
  );
};