import PlotlyChart from './PlotlyChart';
import type { Data, Layout } from 'plotly.js';

export default function UsageMetricsChart() {
  // Sample data for usage metrics
  const data: Data[] = [
    {
      x: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      y: [2.5, 3.2, 4.1, 3.8, 4.5, 2.1, 1.8],
      type: 'scatter',
      mode: 'lines+markers',
      marker: { color: '#60A5FA' },
      line: { color: '#60A5FA', width: 3 },
      name: 'Study Hours'
    },
    {
      x: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      y: [85, 88, 92, 87, 94, 79, 82],
      type: 'bar',
      marker: { color: '#22D3EE' },
      name: 'Performance Score',
      yaxis: 'y2'
    }
  ];

  const layout: Partial<Layout> = {
    title: {
      text: 'Weekly Study Metrics',
      font: { color: 'white', size: 18 }
    },    
    xaxis: {
      title: { text: 'Day of Week' },
      color: 'white',
      gridcolor: 'rgba(255,255,255,0.1)'
    },
    yaxis: {
      title: { text: 'Study Hours' },
      side: 'left',
      color: 'white',
      gridcolor: 'rgba(255,255,255,0.1)'
    },
    yaxis2: {
      title: { text: 'Performance Score' },
      side: 'right',
      overlaying: 'y',
      color: 'white'
    },
    legend: {
      orientation: 'h',
      y: -0.1,
      font: { color: 'white' }
    }
  };

  return (
    <div class="w-full h-80 ">
      <PlotlyChart data={data} layout={layout} />
    </div>
  );
}
