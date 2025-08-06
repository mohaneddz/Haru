import { createEffect, on, onCleanup, onMount } from 'solid-js';
import type { Data, Layout, Config } from 'plotly.js';

interface PlotlyChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  class?: string;
  id?: string;
}

export default function PlotlyChart(props: PlotlyChartProps) {
  let plotDiv: HTMLDivElement | undefined;
  const plotId = props.id || `plotly-chart-${Math.random().toString(36).substr(2, 9)}`;

  const baseLayout: Partial<Layout> = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: 'white' },
    margin: { l: 50, r: 50, t: 50, b: 50 },
  };

  const baseConfig: Partial<Config> = {
    responsive: true,
    displaylogo: false,
    displayModeBar: false, 
  };

  // onMount handles the INITIAL CREATION of the plot.
  // This runs only once when the component is first added to the DOM.
  onMount(async () => {
    if (!plotDiv) return;
    
    const Plotly = await import('plotly.js-dist-min');
    
    const mergedLayout = { ...baseLayout, ...props.layout };
    const mergedConfig = { ...baseConfig, ...props.config };

    // Create the plot with the initial data (which might be empty).
    (Plotly as any).newPlot(plotDiv, props.data, mergedLayout, mergedConfig);
  });

  // --- THIS IS THE CORRECTED PART ---
  // This createEffect is now specifically for UPDATES.
  createEffect(
    // 1. `on()` explicitly tracks the dependencies. We watch all props that might change.
    on(
      () => [props.data, props.layout, props.config],
      async ([newData, newLayout, newConfig]) => {
        // Ensure the plot has been mounted before trying to update it.
        if (plotDiv) {
          const Plotly = await import('plotly.js-dist-min');
          
          const mergedLayout = { ...baseLayout, ...newLayout };
          const mergedConfig = { ...baseConfig, ...newConfig };

          // Use Plotly.react for efficient updates. It re-uses the existing plot.
          (Plotly as any).react(plotDiv, newData, mergedLayout, mergedConfig);
        }
      },
      // 2. `defer: true` is the key. It prevents this effect from running on the
      // initial render, so it only runs on subsequent changes.
      { defer: true }
    )
  );

  // onCleanup correctly purges the plot to prevent memory leaks.
  onCleanup(async () => {
    if (plotDiv) {
      const Plotly = await import('plotly.js-dist-min');
      (Plotly as any).purge(plotDiv);
    }
  });

  return (
    <div
      ref={plotDiv}
      id={plotId}
      class={`w-full h-full ${props.class || ''}`}
    />
  );
}