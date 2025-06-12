import { sections, entries } from '@/layout/sidebar/Entries';
// @ts-ignore
import {
  Home,
  Compass,
  Library,
  BookOpen,
  FileText,
  GraduationCap,
  PenLine,
  Swords,
  Gamepad2,
  ListChecks,
  Trophy,
  BarChart,
  Target,
  Clock,
  PencilRuler,
  Puzzle,
  LayoutDashboard,
  Calculator,
  AlarmClock,
  Activity,
  ChevronRight,
} from 'lucide-solid';
import { For } from 'solid-js';

// Create icon mapping
const iconMap = {
  Home,
  Compass,
  Library,
  BookOpen,
  FileText,
  GraduationCap,
  PenLine,
  Swords,
  Gamepad2,
  ListChecks,
  Trophy,
  BarChart,
  Target,
  Clock,
  PencilRuler,
  Puzzle,
  LayoutDashboard,
  Calculator,
  AlarmClock,
  Activity,
};

import { createSignal } from 'solid-js';

export default function MiddleSection() {

  const [activeSection, setActiveSection] = createSignal<string | null>(null);
  const [activeEntry, setActiveEntry] = createSignal<string | null>(null);

  return (
    <div class="h-full w-full flex flex-col items-center text-white gap-0">

      <For each={sections}>

        {(section) => {
          const SectionIconComponent = iconMap[section.icon as keyof typeof iconMap];

          return (
            <div class="w-full bg-sidebar m-0">

              <div class="text-sm font-semibold uppercase tracking-widest text-accent hover:bg-sidebar-light-1 hover:cursor-pointer py-4 w-full  px-6"
                onClick={() => setActiveSection(activeSection() === section.title ? null : section.title)}
              >
                {SectionIconComponent && <SectionIconComponent class="inline-block mr-2 text-accent" />}
                {section.title}
                <ChevronRight class={`inline-block ml-2 text-xsm text-accent transition-transform duration-200 ${activeSection() === section.title ? 'rotate-90' : ''}`} />
              </div>

              <div class="flex flex-col  bg-sidebar-dark-2">

                <For each={entries.filter(entry => entry.section === section.section)}>

                  {(entry) => {
                    const EntryIconComponent = iconMap[entry.icon as keyof typeof iconMap];

                    return (
                      <a
                        class={
                          activeSection() !== section.title
                            ? "hidden"
                            : activeEntry() === entry.title
                              ? "text-xs py-3 text-accent-light-1 cursor-pointer  px-6 bg-sidebar-light-3 pl-14 "
                              : "text-xs py-3 text-accent-dark-1 hover:text-accent-light-1 hover:bg-sidebar-light-1 cursor-pointer px-6 pl-14 "
                        }
                        onClick={() =>
                          setActiveEntry(activeEntry() === entry.title ? null : entry.title)
                        }
                        href={'/' + section.slug + '/' + entry.slug}
                      >
                        {EntryIconComponent && (
                          <EntryIconComponent class="text-xsm h-4 w-4 inline-block mr-2 text-accent-dark-1 hover:text-accent-light-1" />
                        )}
                        {entry.title}
                      </a>
                    );
                  }}

                </For>

              </div>

            </div>
          );
        }}
      </For>

    </div>
  );
}