import SelectInput from "@/components/core/Input/SelectInput";
import Button from "@/components/core/Input/Button";
import useAdvanced from "@/hooks/settings/useAdvanced";
import Checkbox from "@/components/core/Input/Checkbox";
import { useNavigate } from "@solidjs/router";

export default function Advanced() {
  const { voices
    , voice, setVoice,
    chatModel, setChatModel,
    transcriptMode, setTranscriptMode,
    speechModel, setSpeechModel,
    ragKeyModel, setRagKeyModel,
    topK, setTopK,
    embeddingSize, setEmbeddingSize,
    contextSize, setContextSize,
    gpuAcceleration, toggleGpuAcceleration,
    watchRagDirectories, toggleWatchRagDirectories, saveSettings
  } = useAdvanced();

  const navigate = useNavigate();
  const goBack = () => {
    navigate(-1);
  };

  return (
    <section class="flex flex-col items-center h-min w-full mt-16">
      <div class="h-full w-full max-w-[60%] flex flex-col justify-between items-center">
        <h1 class="text-2xl font-bold mb-4">Advanced Features</h1>
        <p class="text-gray-500 mb-16">Explore and customize advanced features of your application.</p>

        <div class="w-full grid grid-cols-2 gap-4 gap-x-16">
          {/* Local AI Tools */}
          <label class="block mb-4">
            <span class="text-gray-500">Chat Model</span>
          </label>
          <SelectInput
            options={[
              { value: "gemma-3-4b-it-q4_0.gguf", label: "Gemma 3" },
              { value: "ggml-model-i2_s.gguf", label: "BitNet" },
            ]}
            selected={chatModel()}
            onChange={setChatModel}
            class="w-full"
            id="local-ai-tools-selector"
          />

          {/* Transcript Mode */}
          <label class="block mb-4">
            <span class="text-gray-500">Transcript Mode</span>
          </label>
          <SelectInput
            options={[
              { value: "whisper-3-large-turbo", label: "Large" },
              { value: "whisper-3-base", label: "Base" },
              { value: "whisper-3-tiny", label: "Tiny" },
            ]}
            selected={transcriptMode()}
            onChange={setTranscriptMode}
            class="w-full"
            id="transcript-mode-selector"
          />

          {/* Speech Model */}
          <label class="block mb-4">
            <span class="text-gray-500">Speech Model</span>
          </label>
          <SelectInput
            options={[
              { value: "kokoro-82m", label: "Base" },
              { value: "kokoro-82m-hifi-gan", label: "Hifi GAN" },
            ]}
            selected={speechModel()}
            onChange={setSpeechModel}
            class="w-full"
            id="speech-model-selector"
          />

          {/* Tutor Voice */}
          <label class="block mb-4">
            <span class="text-gray-500">Tutor Voice</span>
          </label>
          <SelectInput
            options={voices()}
            selected={voice()}
            onChange={setVoice}
            class="w-full"
            id="tutor-voice-selector"
          />

          {/* RAG Key Model */}
          <label class="block mb-4">
            <span class="text-gray-500">RAG Keyer Model</span>
          </label>
          <SelectInput
            options={[
              { value: "all-MiniLM-L6-v2", label: "MiniLM6" },
              { value: "paraphrase-multilingual-MiniLM-L12-v2", label: "MiniLM12 (MultiLingual)" },
              { value: "msmarco-distilbert-base-v3", label: "DistilBert" },
              { value: "sentence-t5-base", label: "T5" },
            ]}
            selected={ragKeyModel()}
            onChange={setRagKeyModel}
            class="w-full"
            id="rag-key-model-selector"
          />

          <div class="col-span-2 bg-accent-light-1/10 h-px my-4" />

          {/* Watch RAG Directories */}
          <label class="block mb-4">
            <span class="text-gray-500">GPU Acceleration</span>
          </label>
          <div class="flex items-center justify-end gap-4">
            <p class={gpuAcceleration() ? "text-accent-light-1/40" : "text-text-dark-2"}>{gpuAcceleration() ? "Enabled" : "Disabled"}</p>
            <Checkbox
              class="w-5 h-5"
              selected={gpuAcceleration()}
              onChange={toggleGpuAcceleration}
            />
          </div>

          {/* Watch RAG Directories */}
          <label class="block mb-4">
            <span class="text-gray-500">Watch RAG Directories</span>
          </label>
          <div class="flex items-center justify-end gap-4">
            <p class={watchRagDirectories() ? "text-accent-light-1/40" : "text-text-dark-2"}>{watchRagDirectories() ? "Enabled" : "Disabled"}</p>
            <Checkbox
              class="w-5 h-5"
              selected={watchRagDirectories()}
              onChange={toggleWatchRagDirectories}
            />
          </div>

          {/* Top K Retrievals */}
          <label class="block mb-4">
            <span class="text-gray-500">Top K Retrievals</span>
          </label>
          <input
            type="number"
            value={topK()}
            min={1}
            onInput={e => setTopK(Number(e.currentTarget.value))}
            id="topk-input"
          />

          {/* Embedding Size */}
          <label class="block mb-4">
            <span class="text-gray-500">Embeddings Size</span>
          </label>
          <input
            type="number"
            value={embeddingSize()}
            min={1}
            onInput={e => setEmbeddingSize(Number(e.currentTarget.value))}
            id="embedding-size-input"
          />

          {/* Context Length */}
          <label class="block mb-4">
            <span class="text-gray-500">Context Length</span>
          </label>
          <input
            type="number"
            value={contextSize()}
            min={1}
            onInput={e => setContextSize(Number(e.currentTarget.value))}
            id="context-size-input"
          />

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
}