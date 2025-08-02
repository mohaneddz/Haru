import type { Layout } from 'plotly.js';

// Chart layout configurations
export const dailyLayout: Partial<Layout> = {
	title: { text: 'Daily Time Distribution', font: { color: 'white', size: 16 } },
	barmode: 'stack',
	xaxis: { title: { text: 'Date' }, gridcolor: 'rgba(255,255,255,0.1)' },
	yaxis: { title: { text: 'Hours' }, gridcolor: 'rgba(255,255,255,0.1)' },
	legend: { orientation: 'h', y: -0.2 },
	paper_bgcolor: 'transparent',
	plot_bgcolor: 'transparent',
	font: { color: 'white' },
};

export const productivityLayout: Partial<Layout> = {
	title: { text: 'Hourly Productivity & Focus', font: { color: 'white', size: 16 } },
	xaxis: { title: { text: 'Hour of Day' }, gridcolor: 'rgba(255,255,255,0.1)', range: [0, 23] },
	yaxis: { title: { text: 'Score (%)' }, gridcolor: 'rgba(255,255,255,0.1)', range: [0, 100] },
	legend: { orientation: 'h', y: -0.2 },
	paper_bgcolor: 'transparent',
	plot_bgcolor: 'transparent',
	font: { color: 'white' },
};

export const categoryLayout: Partial<Layout> = {
	title: { text: 'Time by Category', font: { color: 'white', size: 16 } },
	paper_bgcolor: 'transparent',
	plot_bgcolor: 'transparent',
	font: { color: 'white' },
};

export const weeklyLayout: Partial<Layout> = {
	title: { text: 'Weekly Time Trend', font: { color: 'white', size: 16 } },
	xaxis: { title: { text: 'Day' }, gridcolor: 'rgba(255,255,255,0.1)' },
	yaxis: { title: { text: 'Total Hours' }, gridcolor: 'rgba(255,255,255,0.1)' },
	shapes: [
		{
			type: 'line',
			x0: 0,
			x1: 6,
			y0: 8,
			y1: 8,
			line: { color: 'rgba(255,255,255,0.3)', width: 2, dash: 'dash' },
		},
	],
	paper_bgcolor: 'transparent',
	plot_bgcolor: 'transparent',
	font: { color: 'white' },
};
