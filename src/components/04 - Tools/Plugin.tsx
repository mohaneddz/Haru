import * as LucideIcons from 'lucide-solid';
import { createSignal } from 'solid-js';

import Toggle from '@/components/core/Input/Toggle';

interface Props {
  title?: string;
  description?: string;
  icon: string;
  size?: number;
  enabled: boolean;
}

export default function Plugin(props: Props) {
  const IconComponent = (LucideIcons as any)[props.icon] || LucideIcons['Award'];

  const [enabled, setEnabled] = createSignal(props.enabled || false);

  return (
    <div class="flex items-center gap-4 p-6 rounded-lg border transition-all duration-200" 
         classList={{
           "border-gray-600 text-text": enabled(),
           "bg-sidebar-light-1/40 border-gray-300 text-gray-500": !enabled(),
           "opacity-50": !enabled()
         }}>
      <div class="flex-shrink-0 p-3 rounded-md border transition-colors" 
           classList={{
             "border-gray-500 bg-gray-700": enabled(),
             "border-gray-400 bg-sidebar-light-1": !enabled()
           }}>
        {IconComponent && (
          <IconComponent 
            class={`w-${props.size || 12} h-${props.size || 12} transition-colors`}
            classList={{
              "text-accent": enabled(),
              "text-gray-400": !enabled()
            }}
          />
        )}
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold transition-colors" 
            classList={{
              "text-text": enabled(),
              "text-gray-600": !enabled()
            }}>
          {props.title}
        </h3>
        <p class="text-sm transition-colors" 
           classList={{
             "text-gray-400": enabled(),
             "text-gray-500": !enabled()
           }}>
          {props.description}
        </p>
      </div>
      <div class="flex-shrink-0">
        <Toggle enabled={enabled()} onToggle={setEnabled} />
      </div>
    </div>
  );
};
