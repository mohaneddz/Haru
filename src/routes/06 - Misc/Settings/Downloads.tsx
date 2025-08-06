import useDownloads from "@/hooks/settings/useDownloads";
import Input from "@/components/core/Input/Input";
import Button from "@/components/core/Input/Button";
import { For, Show } from "solid-js";
import { Trash, Download, Pause, Octagon, Play } from "lucide-solid";

export default function Downloads() {
  const { downloads, downloadModel, token, setToken, pauseDownload, stopDownload, resumeDownload, } = useDownloads();

  return (
    <section class="flex flex-col items-center h-min w-full mt-16">
      <div class="h-full w-full max-w-[60%] flex flex-col justify-between items-center">
        <h1 class="text-2xl font-bold mb-4">Downloads Settings</h1>
        <p class="text-gray-500 mb-16 text-center">
          Download your tools for offline access and various features of your application.
        </p>

        <div class="w-full grid grid-cols-2 gap-4 gap-x-16">
          <div class="flex gap-4 col-span-2 mb-8">
            <Input
              searchTerm={token()}
              setSearchTerm={(val) => setToken(val)}
              placeholder="Enter Hugging Face Token"
              class="w-full text-sm"
              id="default-notes-location"
            />
          </div>

          <For each={downloads}>
            {(download) => (
              <>
                <label class="block mb-4">
                  <span class="text-text truncate">{download.name}</span>
                  <p class="text-xs text-gray-500">
                    {download.size} - {download.status} - {download.progress}%
                  </p>
                </label>
                <div class="flex justify-end gap-4">
                  {/* Trash/Stop Button */}
                  <div
                    class={`aspect-square px-2 center border border-border-light-2 rounded-md ${download.status === "downloading"
                      ? "text-text bg-error-light-2 clickable"
                      : "bg-sidebar-light-2 text-text/20"
                      }`}
                    onClick={() => {
                      if (download.status === "downloading") {
                        console.log(`Stopping download for ${download.name}`);
                        stopDownload(download.name);
                      } else {
                        console.log(`Trash clicked for ${download.name}`);
                        pauseDownload(download.name);
                      }
                    }}
                  >
                    <Show when={download.status === "downloading"} fallback={<Trash size={8} class="w-8 h-8" />}>
                      <Octagon size={8} class="w-8 h-8" />
                    </Show>
                  </div>

                  {/* Download/Pause/Resume Button */}
                  <div
                    class={`aspect-square px-2 center border border-border-light-2 rounded-md ${download.status === "downloading"
                      ? "text-text bg-accent-dark-2 clickable"
                      : download.status === "paused"
                      ? "text-text bg-accent-dark-2 clickable"
                      : "bg-accent text-text clickable"
                      }`}
                    onClick={() => {
                      if (download.status === "downloading") {
                        console.log(`Pausing download for ${download.name}`);
                        pauseDownload(download.name);
                      } else if (download.status === "paused") {
                        console.log(`Resuming download for ${download.name}`);
                        resumeDownload(download.name);
                      } else {
                        console.log(`Starting download for ${download.name}`);
                        downloadModel(download.name);
                      }
                    }}
                  >
                    <Show
                      when={download.status === "downloading"}
                      fallback={
                        <Show
                          when={download.status === "paused"}
                          fallback={<Download size={8} class="w-8 h-8" />}
                        >
                          <Play size={8} class="w-8 h-8" />
                        </Show>
                      }
                    >
                      <Pause size={8} class="w-8 h-8" />
                    </Show>
                  </div>
                </div>
              </>
            )}
          </For>
        </div>

        <div class="w-full grid grid-cols-2 gap-4 my-8">
          <Button
            onClick={() => console.log("Settings canceled")}
            variant="basic"
            class="w-full mt-4 text-center"
          >
            Cancel
          </Button>
          <Button
            onClick={() => console.log("Settings saved")}
            variant="primary"
            class="w-full mt-4 text-center"
          >
            Save
          </Button>
        </div>
      </div>
    </section>
  );
}