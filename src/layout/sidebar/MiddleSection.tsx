import { sections, entries } from '@/layout/sidebar/Entries';
import { For, createSignal, onMount } from 'solid-js'; // Added Component and JSX
import { invoke } from "@tauri-apps/api/core";
import * as icons from 'lucide-solid';
import type { LucideIconComponent } from '@/types/misc/sidebar';

interface Props {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
}

export default function MiddleSection(props: Props) {

  const [activeSection, setActiveSection] = createSignal<string | null>(null);
  const [activeEntry, setActiveEntry] = createSignal<string | null>(null);
  const [app, setApp] = createSignal(false);

  onMount(() => {
    invoke("is_app_running").then((isRunning) => setApp(isRunning as boolean));
  });

  const stopApp = async () => {
    setApp(false);
    try {
      await invoke("stop_app");
      console.log("App stopped successfully");
    } catch (error) {
      console.error("Failed to stop app:", error);
    }
  };

  const startApp = async () => {
    setApp(true);
    try {
      await invoke("run_app");
      console.log("App started successfully");
    } catch (error) {
      console.error("Failed to start app:", error);
    }
  };

  const handleToggleApp = () => {
    if (app()) {
      stopApp();
    } else {
      startApp();
    }
  };

  return (
    <div class="h-full w-full flex flex-col items-center text-text gap-0 relative">

      <For each={sections}>
        {(section) => {
          const iconName = section.icon as keyof typeof icons;
          const SectionIcon = icons[iconName] as LucideIconComponent;
          const ChevronRightIcon = icons['ChevronRight'] as LucideIconComponent;

          return (
            <div class="w-full bg-sidebar m-0">

              <div
                class={`text-sm font-semibold uppercase tracking-widest text-accent hover:bg-sidebar-light-1 cursor-pointer w-full py-4 ${props.isOpen ? ` px-6 ` : `pl-4`}`}
                onClick={() => setActiveSection(activeSection() === section.title ? null : section.title)}
              >
                {SectionIcon && <SectionIcon class={`inline-block text-accent ${props.isOpen ? ` mr-2 ` : ``}`} />}
                {props.isOpen ? section.title : ''}
                {ChevronRightIcon && (
                  <ChevronRightIcon
                    class={`inline-block ml-2 text-xsm text-accent transition-transform duration-200 ${activeSection() === section.title ? 'rotate-90' : ''
                      }`}
                  />
                )}
              </div>

              <div class="flex flex-col bg-sidebar-dark-2">
                <For each={entries.filter(entry => entry.section === section.section)}>
                  {(entry) => {
                    const entryIconName = entry.icon as keyof typeof icons;
                    const EntryIcon = icons[entryIconName] as LucideIconComponent;

                    return (
                      <a
                        class={
                          activeSection() !== section.title
                            ? 'hidden'
                            : activeEntry() === entry.title
                              ? `text-xs py-3 text-accent-light-1 cursor-pointer bg-sidebar-light-3 ${props.isOpen ? `px-6 pl-14` : `pl-8`}`
                              : `text-xs py-3 text-accent-dark-1 hover:text-accent-light-1 hover:bg-sidebar-light-1 cursor-pointer ${props.isOpen ? `px-6 pl-14` : `pl-8`}`
                        }
                        onClick={() =>
                          setActiveEntry(activeEntry() === entry.title ? null : entry.title)
                        }
                        href={`/${section.slug}/${entry.slug}`}
                      >
                        {EntryIcon && (
                          <EntryIcon class="text-xsm h-4 w-4 inline-block mr-2 text-accent-dark-1 hover:text-accent-light-1" />
                        )}
                        {props.isOpen ? entry.title : ''}
                      </a>
                    );
                  }}
                </For>
              </div>

            </div>
          );
        }}
      </For>

      {/* user icon + username + settings button */}
      <div class="w-full gap-1 flex flex-col absolute bottom-0">
        <div class="flex items-center justify-between w-full px-8 bg-sidebar text-text/40 text-xs">
          <p>App ...</p>
          <button onClick={handleToggleApp} class={`clickable rounded-full h-3 aspect-square ${app() ? 'bg-accent' : 'bg-gray-700'}`} />
        </div>
      </div>

    </div>
  );
}


