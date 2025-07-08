import { createSignal, createMemo, For } from 'solid-js';
import LayoutCard from '@/components/02 - Practice/training/LayoutCard';

interface HeatmapCell {
  id: string;
  date: string;
  value: number;
  studyCount: number;
  correctAnswers: number;
}

interface Props {
  class?: string;
}

export default function FlashCardsHeatmap(props: Props) {
  const [selectedCell, setSelectedCell] = createSignal<HeatmapCell | null>(null);
  const [hoveredCell, setHoveredCell] = createSignal<HeatmapCell | null>(null);
  const [tooltipPosition, setTooltipPosition] = createSignal({ x: 0, y: 0 });

  // Generate compact data for 10 weeks
  const generateHeatmapData = (): HeatmapCell[] => {
    const data: HeatmapCell[] = [];
    const today = new Date();

    for (let week = 0; week < 10; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (week * 7 + day));

        const studyCount = Math.floor(Math.random() * 15);
        const correctAnswers = Math.floor(studyCount * (0.6 + Math.random() * 0.4));

        data.push({
          id: `${week}-${day}`,
          date: date.toISOString().split('T')[0],
          value: studyCount,
          studyCount,
          correctAnswers
        });
      }
    }

    return data.reverse();
  };

  const heatmapData = createMemo(() => generateHeatmapData());

  const getIntensityColor = (value: number): string => {
    if (value === 0) return 'bg-gray-800 hover:bg-gray-700';
    if (value <= 3) return 'bg-cyan-900/40 hover:bg-cyan-900/60';
    if (value <= 6) return 'bg-cyan-700/50 hover:bg-cyan-700/70';
    if (value <= 9) return 'bg-cyan-500/60 hover:bg-cyan-500/80';
    if (value <= 12) return 'bg-cyan-400/70 hover:bg-cyan-400/90';
    return 'bg-cyan-300 hover:bg-cyan-200';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCellClick = (cell: HeatmapCell) => {
    setSelectedCell(selectedCell()?.id === cell.id ? null : cell);
  };

  const handleCellHover = (cell: HeatmapCell, e: MouseEvent) => {
    setHoveredCell(cell);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  return (
    <LayoutCard hoverable={false} border class={props.class} >
      <div class="">

        <div class="mb-3">
          <h3 class="text-sm font-semibold text-cyan-400 mb-1">Study Activity</h3>
          <p class="text-xs text-gray-500">Last 10 weeks</p>
        </div>

        {/* Compact Heatmap Grid */}
        <div class="mb-3">
          <div class="grid grid-cols-7 gap-0.5 mb-2">
            {/* Minimal day labels */}
            <div class="text-xs text-gray-600 text-center py-1">S</div>
            <div class="text-xs text-gray-600 text-center py-1">M</div>
            <div class="text-xs text-gray-600 text-center py-1">T</div>
            <div class="text-xs text-gray-600 text-center py-1">W</div>
            <div class="text-xs text-gray-600 text-center py-1">T</div>
            <div class="text-xs text-gray-600 text-center py-1">F</div>
            <div class="text-xs text-gray-600 text-center py-1">S</div>
          </div>

          <div class="grid grid-cols-7 gap-0.5">
            <For each={heatmapData()}>
              {(cell) => (
                <div
                  class={`
                    w-3 h-3 rounded-sm cursor-pointer transition-all duration-200
                    ${getIntensityColor(cell.value)}
                    ${selectedCell()?.id === cell.id ? 'ring-1 ring-cyan-400 ring-offset-1 ring-offset-gray-900' : ''}
                  `}
                  onClick={() => handleCellClick(cell)}
                  onMouseEnter={(e) => handleCellHover(cell, e)}
                  onMouseLeave={handleCellLeave}
                />
              )}
            </For>
          </div>
        </div>

        {/* Compact Legend */}
        <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Less</span>
          <div class="flex gap-1">
            <div class="w-2 h-2 bg-gray-800 rounded-sm"></div>
            <div class="w-2 h-2 bg-cyan-900/40 rounded-sm"></div>
            <div class="w-2 h-2 bg-cyan-700/50 rounded-sm"></div>
            <div class="w-2 h-2 bg-cyan-500/60 rounded-sm"></div>
            <div class="w-2 h-2 bg-cyan-400/70 rounded-sm"></div>
            <div class="w-2 h-2 bg-cyan-300 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>

        {/* Compact Stats */}
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="bg-gray-800 p-2 rounded border border-gray-700">
            <div class="text-cyan-400 font-bold">
              {heatmapData().reduce((sum, cell) => sum + cell.studyCount, 0)}
            </div>
            <div class="text-gray-500">Total</div>
          </div>
          <div class="bg-gray-800 p-2 rounded border border-gray-700">
            <div class="text-cyan-400 font-bold">
              {heatmapData().filter(cell => cell.studyCount > 0).length}
            </div>
            <div class="text-gray-500">Active</div>
          </div>
          <div class="bg-gray-800 p-2 rounded border border-gray-700">
            <div class="text-cyan-400 font-bold">
              {Math.round(heatmapData().reduce((sum, cell) => sum + cell.studyCount, 0) / 70)}
            </div>
            <div class="text-gray-500">Avg/Day</div>
          </div>
        </div>

        {/* Selected Cell Mini Details */}
        {selectedCell() && (
          <div class="mt-3 bg-gray-800 p-3 rounded border border-cyan-400/30">
            <div class="text-xs text-cyan-400 font-medium mb-2">
              {formatDate(selectedCell()!.date)}
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-gray-400">Cards:</span>
                <span class="ml-1 text-white">{selectedCell()!.studyCount}</span>
              </div>
              <div>
                <span class="text-gray-400">Correct:</span>
                <span class="ml-1 text-white">{selectedCell()!.correctAnswers}</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Tooltip */}
        {hoveredCell() && (
          <div
            class="fixed z-50 bg-gray-800 border border-cyan-400/50 rounded px-2 py-1 text-xs text-white shadow-lg pointer-events-none"
            style={{
              left: `${tooltipPosition().x + 10}px`,
              top: `${tooltipPosition().y - 40}px`
            }}
          >
            <div class="text-cyan-400 font-medium">{formatDate(hoveredCell()!.date)}</div>
            <div class="text-gray-300">
              {hoveredCell()!.studyCount} cards • {hoveredCell()!.correctAnswers} correct
            </div>
          </div>
        )}
      </div>
    </LayoutCard>
  );
}