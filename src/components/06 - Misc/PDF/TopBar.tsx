interface Props {
    currentPage: () => number;
    numPages: () => number;
    loading: () => boolean;
    zoomLevels: number[];
    scale: () => number;
    setScale: (value: number) => void;
    fitToWidth: () => boolean;
    setFitToWidth: (value: boolean) => void;
    prevPage: () => void;
    nextPage: () => void;
    gotoPage: (event: Event) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    rotateClockwise: () => void;
    toggleFullscreen: () => void;
}


export default function TopBar(props: Props) {
    return (
        <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-3 py-2 z-50 pt-8">

            <div class="flex items-center justify-between gap-3">
                {/* Left: Navigation */}
                <div class="flex items-center space-x-2">
                    <button
                        onClick={props.prevPage}
                        disabled={props.loading() || props.currentPage() === 1 || props.numPages() === 0}
                        class="p-1.5 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50 text-text transition-colors"
                        title="Previous page (←)"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <button
                        onClick={props.nextPage}
                        disabled={props.loading() || props.currentPage() === props.numPages() || props.numPages() === 0}
                        class="p-1.5 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50 text-text transition-colors"
                        title="Next page (→)"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>

                    <form onSubmit={props.gotoPage} class="flex items-center space-x-1">
                        <input
                            id="page"
                            name="page"
                            type="number"
                            min="1"
                            max={props.numPages() || 1}
                            value={props.currentPage()}
                            onInput={(e) => {
                                // Allow typing but don't navigate until form is submitted
                                const target = e.target as HTMLInputElement;
                                if (target.value === '') return;
                                const value = parseInt(target.value);
                                if (!isNaN(value) && value >= 1 && value <= props.numPages()) {
                                    // Update the input value but don't change current page yet
                                }
                            }}
                            disabled={props.loading() || props.numPages() === 0}
                            class="w-12 text-text bg-gray-700 border border-gray-600 text-center px-1 py-1 rounded text-xs disabled:opacity-50"
                        />
                        <span class="text-gray-300 text-xs">/ {props.numPages() || 0}</span>
                    </form>
                </div>

                {/* Center: Zoom */}
                <div class="flex items-center space-x-2">

                    <button
                        onClick={props.zoomOut}
                        class="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-text transition-colors"
                        title="Zoom out (Ctrl + -)"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                        </svg>
                    </button>

                    <select
                        value={(() => {
                            const currentScale = props.scale();
                            // Check if current scale matches a preset zoom level
                            const exactMatch = props.zoomLevels.find(level => Math.abs(level - currentScale) < 0.01);
                            return exactMatch || currentScale;
                        })()}
                        onChange={(e) => {
                            const newScale = parseFloat(e.target.value);
                            if (!isNaN(newScale) && newScale > 0) {
                                props.setScale(newScale);
                                props.setFitToWidth(false);
                            }
                        }}
                        class="bg-gray-700 border border-gray-600 text-text px-2 py-1 rounded text-xs w-24"
                    >
                        {/* Show preset zoom levels */}
                        {props.zoomLevels.map(level => (
                            <option value={level}>{Math.round(level * 100)}%</option>
                        ))}
                        {/* Show current scale if it's not a preset */}
                        {!props.zoomLevels.find(level => Math.abs(level - props.scale()) < 0.01) && (
                            <option value={props.scale()}>{Math.round(props.scale() * 100)}%</option>
                        )}
                    </select>

                    <button
                        onClick={props.zoomIn}
                        class="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-text transition-colors"
                        title="Zoom in (Ctrl + +)"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </button>

                    <button
                        onClick={() => props.setFitToWidth(!props.fitToWidth())}
                        class={`p-1.5 rounded transition-colors ${props.fitToWidth() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'} text-text`}
                        title="Fit to width (Ctrl + W)"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                        </svg>
                    </button>
                </div>

                {/* Right: Tools */}
                <div class="flex items-center space-x-2">
                    <button
                        onClick={props.rotateClockwise}
                        class="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-text transition-colors"
                        title="Rotate (R)"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"></path>
                        </svg>
                    </button>

                    <button
                        onClick={props.toggleFullscreen}
                        class="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-text transition-colors"
                        title="Fullscreen (Ctrl + F)"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
