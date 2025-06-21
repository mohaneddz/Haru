import type { Data, Layout } from 'plotly.js';

// Timeline activity data structure
export interface TimeBlock {
	startTime: string;
	endTime: string;
	activity: string;
	category: 'learning' | 'project' | 'break' | 'sleep' | 'personal' | 'work';
	description?: string;
	productivity?: number;
}

// Get CSS variable color values
const getCSSVariableColor = (variable: string) => {
	if (typeof window !== 'undefined')
		return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
	return '#FFFFFF';
};

// Sample timeline data for different dates
export const timelineData: Record<string, TimeBlock[]> = {
	'2025-06-21': [
		{
			startTime: '06:00',
			endTime: '06:30',
			activity: 'Morning Routine',
			category: 'personal',
			productivity: 85,
		},
		{ startTime: '06:30', endTime: '07:30', activity: 'Exercise', category: 'personal', productivity: 90 },
		{ startTime: '07:30', endTime: '08:00', activity: 'Breakfast', category: 'break', productivity: 70 },
		{
			startTime: '08:00',
			endTime: '10:00',
			activity: 'SolidJS Learning',
			category: 'learning',
			description: 'Advanced patterns & state management',
			productivity: 95,
		},
		{ startTime: '10:00', endTime: '10:15', activity: 'Break', category: 'break', productivity: 60 },
		{
			startTime: '10:15',
			endTime: '12:00',
			activity: 'Portfolio Project',
			category: 'project',
			description: 'Building component library',
			productivity: 88,
		},
		{ startTime: '12:00', endTime: '13:00', activity: 'Lunch', category: 'break', productivity: 65 },
		{
			startTime: '13:00',
			endTime: '15:30',
			activity: 'Deep Learning Course',
			category: 'learning',
			description: 'Neural networks & backpropagation',
			productivity: 92,
		},
		{ startTime: '15:30', endTime: '15:45', activity: 'Coffee Break', category: 'break', productivity: 55 },
		{
			startTime: '15:45',
			endTime: '18:00',
			activity: 'Tauri App Development',
			category: 'project',
			description: 'Time tracking features',
			productivity: 87,
		},
		{ startTime: '18:00', endTime: '19:00', activity: 'Dinner', category: 'break', productivity: 70 },
		{ startTime: '19:00', endTime: '20:30', activity: 'Reading', category: 'personal', productivity: 80 },
		{
			startTime: '20:30',
			endTime: '21:30',
			activity: 'Planning & Review',
			category: 'personal',
			description: "Tomorrow's goals",
			productivity: 85,
		},
		{ startTime: '21:30', endTime: '06:00', activity: 'Sleep', category: 'sleep', productivity: 100 },
	],
	'2025-06-20': [
		{
			startTime: '06:30',
			endTime: '07:00',
			activity: 'Morning Routine',
			category: 'personal',
			productivity: 80,
		},
		{ startTime: '07:00', endTime: '08:00', activity: 'Gym', category: 'personal', productivity: 85 },
		{ startTime: '08:00', endTime: '08:30', activity: 'Breakfast', category: 'break', productivity: 75 },
		{
			startTime: '08:30',
			endTime: '11:00',
			activity: 'TypeScript Advanced',
			category: 'learning',
			description: 'Generics & utility types',
			productivity: 90,
		},
		{ startTime: '11:00', endTime: '11:15', activity: 'Break', category: 'break', productivity: 60 },
		{
			startTime: '11:15',
			endTime: '13:00',
			activity: 'Side Project',
			category: 'project',
			description: 'API development',
			productivity: 85,
		},
		{ startTime: '13:00', endTime: '14:00', activity: 'Lunch', category: 'break', productivity: 70 },
		{
			startTime: '14:00',
			endTime: '16:30',
			activity: 'Machine Learning',
			category: 'learning',
			description: 'Feature engineering',
			productivity: 88,
		},
		{ startTime: '16:30', endTime: '16:45', activity: 'Walk', category: 'break', productivity: 65 },
		{
			startTime: '16:45',
			endTime: '19:00',
			activity: 'Client Work',
			category: 'work',
			description: 'Bug fixes & testing',
			productivity: 82,
		},
		{ startTime: '19:00', endTime: '20:00', activity: 'Dinner', category: 'break', productivity: 75 },
		{
			startTime: '20:00',
			endTime: '21:00',
			activity: 'Social Time',
			category: 'personal',
			productivity: 85,
		},
		{
			startTime: '21:00',
			endTime: '22:00',
			activity: 'Reflection',
			category: 'personal',
			productivity: 80,
		},
		{ startTime: '22:00', endTime: '06:30', activity: 'Sleep', category: 'sleep', productivity: 100 },
	],
};

// Sample time tracking data for charts
export const timeData = {
	daily: [
		{ date: '2025-06-15', learning: 4.5, project: 3.2, break: 1.0, other: 2.3 },
		{ date: '2025-06-16', learning: 3.8, project: 4.1, break: 0.8, other: 1.9 },
		{ date: '2025-06-17', learning: 5.2, project: 2.8, break: 1.2, other: 2.1 },
		{ date: '2025-06-18', learning: 4.0, project: 3.9, break: 1.1, other: 2.5 },
		{ date: '2025-06-19', learning: 3.5, project: 4.3, break: 0.9, other: 2.2 },
		{ date: '2025-06-20', learning: 4.8, project: 3.5, break: 1.3, other: 1.8 },
		{ date: '2025-06-21', learning: 5.0, project: 3.0, break: 1.0, other: 2.0 },
	],
	hourly: Array.from({ length: 24 }, (_, i) => ({
		hour: i,
		productivity: Math.sin((i * Math.PI) / 12) * 50 + 50 + Math.random() * 20,
		focus: Math.cos((i * Math.PI) / 16) * 30 + 70 + Math.random() * 15,
	})),
	categories: [
		{ name: 'Learning', hours: 30.8, color: getCSSVariableColor('--color-accent') },
		{ name: 'Projects', hours: 24.8, color: getCSSVariableColor('--color-accent-dark-1') },
		{ name: 'Breaks', hours: 7.3, color: getCSSVariableColor('--color-sidebar-light-3') },
		{ name: 'Other', hours: 14.8, color: getCSSVariableColor('--color-background-light-3') },
	],
};

export const getCategoryTextColor = (category: TimeBlock['category']) => {
	const colors = {
		learning: 'text-text/70',
		project: 'text-text/70',
		work: 'text-text/70',
		break: 'text-text/70',
		personal: 'text-text/70',
		sleep: 'text-text/70',
	};
	return colors[category];
};

export const getTimeWidth = (startTime: string, endTime: string) => {
	const start = parseTime(startTime);
	let end = parseTime(endTime);

	// Handle overnight activities (like sleep)
	if (end < start) {
		end += 24 * 60; // Add 24 hours worth of minutes
	}

	const duration = end - start;
	return (duration / (24 * 60)) * 100; // Percentage of 24 hours
};

export const getTimePosition = (startTime: string) => {
	const start = parseTime(startTime);
	return (start / (24 * 60)) * 100; // Percentage position in 24 hours
};

export const parseTime = (timeStr: string) => {
	const [hours, minutes] = timeStr.split(':').map(Number);
	return hours * 60 + minutes;
};

export const formatTime = (timeStr: string) => {
	const [hours, minutes] = timeStr.split(':').map(Number);
	const period = hours >= 12 ? 'PM' : 'AM';
	const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
	return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const formatDate = (date: Date) => {
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

// Chart data generators
export const getDailyTimeData = (): Data[] =>
	[
		{
			x: timeData.daily.map((d) => d.date),
			y: timeData.daily.map((d) => d.learning),
			name: 'Learning',
			type: 'bar',
			marker: { color: getCSSVariableColor('--color-accent-dark-1') },
		},
		{
			x: timeData.daily.map((d) => d.date),
			y: timeData.daily.map((d) => d.project),
			name: 'Projects',
			type: 'bar',
			marker: { color: getCSSVariableColor('--color-accent-dark-3') },
		},
		{
			x: timeData.daily.map((d) => d.date),
			y: timeData.daily.map((d) => d.break),
			name: 'Breaks',
			type: 'bar',
			marker: { color: getCSSVariableColor('--color-sidebar-light-3') },
		},
		{
			x: timeData.daily.map((d) => d.date),
			y: timeData.daily.map((d) => d.other),
			name: 'Other',
			type: 'bar',
			marker: { color: getCSSVariableColor('--color-background-light-3') },
		},
	] as Data[];

export const getProductivityData = (): Data[] =>
	[
		{
			x: timeData.hourly.map((d) => d.hour),
			y: timeData.hourly.map((d) => d.productivity),
			name: 'Productivity',
			type: 'scatter',
			mode: 'lines+markers',
			line: { color: getCSSVariableColor('--color-sidebar-light-2'), width: 3 },
			marker: { color: getCSSVariableColor('--color-sidebar-light-3'), size: 6 },
		},
		{
			x: timeData.hourly.map((d) => d.hour),
			y: timeData.hourly.map((d) => d.focus),
			name: 'Focus Level',
			type: 'scatter',
			mode: 'lines+markers',
			line: { color: getCSSVariableColor('--color-accent-dark-1'), width: 3 },
			marker: { color: getCSSVariableColor('--color-accent'), size: 6 },
		},
	] as Data[];

export const getCategoryData = (): Data[] =>
	[
		{
			labels: timeData.categories.map((c) => c.name),
			values: timeData.categories.map((c) => c.hours),
			type: 'pie',
			marker: {
				colors: timeData.categories.map((c) => c.color),
			},
			textinfo: 'label+percent',
			textfont: { color: 'white' },
			hovertemplate: '<b>%{label}</b><br>%{value} hours<br>%{percent}<extra></extra>',
		},
	] as Data[];

export const getWeeklyTrendData = (): Data[] =>
	[
		{
			x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
			y: [8.2, 7.9, 8.8, 9.1, 8.5, 6.2, 5.8],
			name: 'Total Hours',
			type: 'scatter',
			mode: 'lines+markers',
			line: { color: getCSSVariableColor('--color-accent'), width: 4 },
			marker: { color: getCSSVariableColor('--color-accent-dark-3'), size: 8 },
			fill: 'tonexty',
			fillcolor: `rgba(6, 182, 212, 0.1)`, 
		},
	] as Data[];

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

// Get legend colors for timeline categories
export const getCategoryColor = (category: TimeBlock['category']) => {
	const colors = {
		learning: 'bg-accent-dark-1',
		project: 'bg-accent-dark-3',
		work: 'bg-sidebar-light-1',
		break: 'bg-sidebar-light-3',
		personal: 'bg-accent',
		sleep: 'bg-background-light-3',
	};
	return colors[category];
};
