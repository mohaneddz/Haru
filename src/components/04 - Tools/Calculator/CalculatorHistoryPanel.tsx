import { Component, Accessor, For } from 'solid-js';

interface HistoryPanelProps {
  history: Accessor<string[]>;
  clearHistory: () => void;
  onSelectHistory: (result: string) => void;
}

const HistoryPanel: Component<HistoryPanelProps> = (props) => {
  return (
    <div class="bg-sidebar rounded-xl border border-border-light-1 p-6 h-full">
      <div class="flex items-center justify-between mb-4 ">
        <h3 class="text-lg font-semibold text-accent">History</h3>
        <button
          onClick={props.clearHistory}
          class="text-xs text-text/50 hover:text-text/80 transition-colors"
        >
          Clear
        </button>
      </div>
      <div class="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        <For each={props.history()}>
          {(entry) => (
            <div
              class="text-xs font-mono bg-background-light-1 rounded p-2 border border-border-light-1 cursor-pointer hover:bg-background-light-2 transition-colors"
              onClick={() => {
                const result = entry.split(' = ')[1];
                if (result) {
                  props.onSelectHistory(result);
                }
              }}
            >
              <div class="text-text/70">{entry}</div>
            </div>
          )}
        </For>
        
        {props.history().length === 0 && (
          <div class="text-xs text-text/50 text-center py-8">
            No calculations yet
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;