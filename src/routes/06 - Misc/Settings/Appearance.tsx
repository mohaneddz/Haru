import SelectInput from "@/components/core/Input/SelectInput";
import Button from "@/components/core/Input/Button";
import useAppearance from "@/hooks/settings/useAppearence";
import RangeSelector from "@/components/core/Input/RangeSelector";
import { useNavigate } from "@solidjs/router";

export default function Appearance() {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    font,
    setFont,
    initialPage,
    setInitialPage,
    saveSettings
  } = useAppearance();

  const navigate = useNavigate();
  const goBack = () => {
    navigate(-1);
  };

  return (
    <section class="flex flex-col items-center h-min w-full mt-16">
      <div class="h-full w-full max-w-[60%] flex flex-col justify-between items-center">
        <h1 class="text-2xl font-bold mb-4">Appearance Settings</h1>
        <p class="text-gray-500 mb-16">
          Customize the look and feel of your application.
        </p>

        <div class="w-full grid grid-cols-2 gap-4 gap-x-16">
          {/* Theme setting */}
          <label class="block mb-4">
            <span class="text-gray-500">Theme</span>
          </label>
          <SelectInput
            options={[
              { value: "", label: "Default" },
              { value: "spring", label: "Spring" },
              { value: "soft-paper", label: "Soft Paper" },
            ]}
            selected={theme()}
            onChange={(value) => setTheme(String(value))}
            class="w-full"
            id="theme-selector"
          />

          {/* Font setting */}
          <label class="block mb-4">
            <span class="text-gray-500">Font</span>
          </label>
          <SelectInput
            options={[
              { value: "Zen Dots", label: "Default" },
              { value: "Arial", label: "Arial" },
              { value: "Roboto", label: "Roboto" },
              { value: "Courier New", label: "Courier New" },
              { value: "Times New Roman", label: "Times New Roman" },
              { value: "Georgia", label: "Georgia" },
              { value: "Verdana", label: "Verdana" },
              { value: "Tahoma", label: "Tahoma" },
            ]}
            selected={font()}
            onChange={(value) => setFont(String(value))}
            class="w-full"
            id="accent-color-selector"
          />

          {/* Initial page setting */}
          <label class="block mb-4">
            <span class="text-gray-500">Initial Page</span>
          </label>
          <SelectInput
            options={[
              { value: "home/tutor", label: "Tutor" },
              { value: "home/library", label: "Library" },
              { value: "home/settings", label: "Notes" },
              { value: "home/quicknotes", label: "Quick Notes" },
              { value: "home/dictionary", label: "Dictionary" },
              { value: "practice/flashcards", label: "Flashcards" },
              { value: "practice/training", label: "Training" },
            ]}
            selected={initialPage()}
            onChange={(value) => setInitialPage(String(value))}
            class="w-full"
            id="initial-page-selector"
          />

          {/* Font size setting */}
          <label class="block mb-4">
            <span class="text-gray-500">Font Size</span>
          </label>
          <RangeSelector
            min={0.4}
            max={1.6}
            value={parseFloat(fontSize().toFixed(1))}
            step={0.1}
            onChange={(value) => {
              setFontSize(value);
            }}
          />

        </div>

        <div class="w-full grid grid-cols-2 gap-4 mt-8">
          <Button
            onClick={() => goBack()}
            variant="basic"
            class="w-full mt-4 text-center"
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveSettings()}
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
