import SelectInput from "@/components/core/Input/SelectInput";
import Button from "@/components/core/Input/Button";
import useBehavior from "@/hooks/settings/useBehavior";
import Checkbox from "@/components/core/Input/Checkbox";
// import Input from "@/components/core/Input/Input";
import { useNavigate } from "@solidjs/router";

export default function Behavior() {

  const { chatStyle, setChatStyle, toggleServerStartup, toggleNotifications, toggleAutoSave, saveSettings, location, setLocation, notificationsEnabled, autoSaveEnabled, serverStartup, countryOptions } = useBehavior();

  const navigate = useNavigate();
  const goBack = () => {
    navigate(-1);
  };


  return (
    <section class="flex flex-col items-center h-min w-full mt-16">

      <div class="h-full w-full max-w-[60%] flex flex-col justify-between items-center">

        <h1 class="text-2xl font-bold mb-4">Behavior Settings</h1>
        <p class="text-gray-500 mb-16">Customize the behavior of your application.</p>

        <div class="w-full grid grid-cols-2 gap-4 gap-x-16">

          {/* Enable Notifications */}
          <label class="block mb-4">
            <span class="text-gray-500 truncate">Enable Notifications</span>
          </label>

          <div class="flex items-center justify-end gap-4">
            <p class={notificationsEnabled() ? "text-accent-light-1/40" : "text-text-dark-2"}>{notificationsEnabled() ? "Enabled" : "Disabled"}</p>
            <Checkbox
              selected={notificationsEnabled()}
              onChange={toggleNotifications}
              class=""
            />
          </div>

          {/* Auto-Save */}
          <label class="block mb-4">
            <span class="text-gray-500">Auto-Save Notes</span>
          </label>

          <div class="flex items-center gap-4 justify-end">
            <p class={autoSaveEnabled() ? "text-accent-light-1/40" : "text-text-dark-2"}>{autoSaveEnabled() ? "Enabled" : "Disabled"}</p>
            <Checkbox
              selected={autoSaveEnabled()}
              onChange={toggleAutoSave}
              class=""
            />
          </div>

          {/* Server Behavior */}
          <label class="block mb-4">
            <span class="text-gray-500">Server Autostart</span>
          </label>

          <div class="flex items-center gap-4 justify-end">
            <p class={serverStartup() ? "text-accent-light-1/40" : "text-text-dark-2"}>{serverStartup() ? "Enabled" : "Disabled"}</p>
            <Checkbox
              selected={serverStartup()}
              onChange={toggleServerStartup}
              class=""
            />
          </div>

          <div class="col-span-2 bg-accent-light-1/10 h-px my-4" />

          {/* Location Behavior */}
          <label class="flex items-center ">
            <span class="text-gray-500">Location</span>
          </label>
          <SelectInput
            options={countryOptions()}
            selected={location()}
            onChange={(value) => setLocation(String(value))}
            class="w-full"
            id="location-selector"
          />

          {/* Search Term */}
          <label class="flex items-center">
            <span class="text-gray-500">Chat Preferences</span>
          </label>
          <textarea
            class="w-full p-2 rounded bg-background-light-3 text-text-light-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="How do you like the tutor to act?"
            rows="4"
            value={chatStyle()}
            onInput={(e) => setChatStyle(e.currentTarget.value)}
          ></textarea>

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
