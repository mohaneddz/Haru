import { createSignal } from 'solid-js';
import { ChevronDown } from 'lucide-solid';

interface SyllabusCardProps {
  type: 'outer' | 'inner';
  title?: string;
  children?: any;
  defaultOpen?: boolean;
}

export default function SyllabusCard(props: SyllabusCardProps) {
  const [isOpen, setIsOpen] = createSignal(props.defaultOpen || false);

  const title = () => props.title || "Syllabus";

  if (props.type === 'outer') {
    return (
      <div class="border border-sidebar-light-3 rounded-lg shadow-sm">
        <button
          onClick={() => setIsOpen(!isOpen())}
          class="w-full px-4 py-3 text-left rounded-t-lg flex items-center justify-between focus:outline-none hover:bg-black/10 transition-colors duration-200"
        >
          <span class="font-medium text-white">{title()}</span>
          <ChevronDown
            class={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${
              isOpen() ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div 
          class={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen() ? ' opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div class="px-4 py-3 border-t border-sidebar-light-3 overflow-y-auto">
            {props.children || <p class="text-gray-200">Syllabus content goes here...</p>}
          </div>
        </div>
      </div>
    );
  }

  // Inner type - just the content without accordion functionality
  return (
    <div class="px-4 py-3 bg-sidebar-light-1 rounded-lg">
      {props.children || <p class="text-gray-200">Inner syllabus content</p>}
    </div>
  );
}