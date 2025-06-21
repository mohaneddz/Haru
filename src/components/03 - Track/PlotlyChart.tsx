import { createEffect, onCleanup, onMount } from 'solid-js';
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

  // Define base layout and config to be merged with props
  // These are defined outside the effects so they are consistent
  // for both newPlot and react calls.
  const baseLayout: Partial<Layout> = {
    paper_bgcolor: 'rgba(0,0,0,0)', // Transparent background for the entire paper
    plot_bgcolor: 'rgba(0,0,0,0)', // Transparent background for the plot area
    font: {
      color: 'white' // Default font color for the chart
    },
    margin: {
      l: 50,
      r: 50,
      t: 50,
      b: 50
    },
    // Add any other default layout options here
  };

  const baseConfig: Partial<Config> = {
    responsive: true, // Make the chart responsive to container size
    displaylogo: false, // Hide the Plotly logo
    // === THIS IS THE KEY CHANGE ===
    // Set displayModeBar to false to hide all buttons (zoom, pan, download, etc.)
    displayModeBar: false, 
    // If you wanted to keep *some* buttons, you would set displayModeBar: true,
    // and then use modeBarButtonsToRemove: ['button_id1', 'button_id2']
    // For example, to keep only the download button:
    // displayModeBar: true,
    // modeBarButtonsToRemove: [
    //   'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d',
    //   'autoScale2d', 'resetScale2d', 'hoverClosestCartesian',
    //   'hoverCompareCartesian', 'toggleSpikelines', 'sendDataToCloud'
    // ],
  };

  onMount(async () => {
    if (!plotDiv) return;
    
    // Import Plotly dynamically
    const Plotly = await import('plotly.js-dist-min');
    
    // Merge base layout and config with any props provided by the user
    const mergedLayout = { ...baseLayout, ...props.layout };
    const mergedConfig = { ...baseConfig, ...props.config };

    // Create the plot
    (Plotly as any).newPlot(plotDiv, props.data, mergedLayout, mergedConfig);
  });

  // Update plot when data, layout, or config changes
  createEffect(async () => {
    if (plotDiv) {
      const Plotly = await import('plotly.js-dist-min');
      
      // Re-merge layout and config to ensure latest props are applied
      const mergedLayout = { ...baseLayout, ...props.layout };
      const mergedConfig = { ...baseConfig, ...props.config };

      // Use Plotly.react to update the existing plot
      // It's important to pass the config here as well if it might change
      (Plotly as any).react(plotDiv, props.data, mergedLayout, mergedConfig);
    }
  });

  onCleanup(async () => {
    if (plotDiv) {
      const Plotly = await import('plotly.js-dist-min');
      (Plotly as any).purge(plotDiv); // Clean up plot when component unmounts
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