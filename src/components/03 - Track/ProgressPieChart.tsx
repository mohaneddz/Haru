import PlotlyChart from './PlotlyChart';
import type { Data, Layout } from 'plotly.js';

export default function ProgressPieChart() {
  // Sample data for progress distribution
  const data: Data[] = [
    {
      type: 'pie',
      values: [45, 30, 15, 10],
      labels: ['Completed', 'In Progress', 'Not Started', 'Reviewed'],
      hole: 0.4,
      marker: {
        colors: ['#22D3EE', '#199CB0', '#147F90', '#3A476E']
      },
      textfont: {
        color: 'white'
      }
    }
  ];

  const layout: Partial<Layout> = {
    title: {
      text: 'Learning Progress Distribution',
      font: { color: 'white', size: 18 }
    },
    showlegend: true,
    legend: {
      orientation: 'v',
      x: 1.05,
      y: 0.5,
      font: { color: 'white' }
    }
  };

  return (
    <div class="w-full h-80">
      <PlotlyChart data={data} layout={layout} />
    </div>
  );
}
