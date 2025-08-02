import { isoToHHMM, addSecondsToISO, formatDuration } from '@/utils/track/timeUtils';
import { getCSSVariableColor } from '@/utils/track/themeUtils';
import type { Data } from 'plotly.js';

export function getTimelineForDay(events: CategorizedEvent[]): TimeBlock[] {
    return events.reduce((acc: TimeBlock[], event) => {
        if (event.duration < 60) return acc;
        acc.push({
            startTime: isoToHHMM(event.timestamp),
            endTime: addSecondsToISO(event.timestamp, event.duration),
            activity: event.data.title,
            category: event.category,
            productivity: event.productivity,
        });
        return acc;
    }, []);
}

export function getDailyTimeData(events: CategorizedEvent[]): Data[] {
    const today = new Date();
    const categories: ActivityCategory[] = ['work', 'study', 'personal', 'break', 'other', 'social'];
    const categoryTotals: Record<string, number[]> = Object.fromEntries(
        categories.map((c) => [c, Array(7).fill(0)])
    );
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - (6 - i));
        dates.push(day.toLocaleDateString(undefined, { weekday: 'short' }));
        const dayStart = new Date(day.setHours(0, 0, 0, 0));
        const dayEnd = new Date(day.setHours(23, 59, 59, 999));
        const dailyEvents = events.filter(
            (event) => new Date(event.timestamp) >= dayStart && new Date(event.timestamp) <= dayEnd
        );
        for (const event of dailyEvents) {
            if (categoryTotals[event.category]) {
                categoryTotals[event.category][i] += event.duration;
            }
        }
    }
    Object.keys(categoryTotals).forEach((cat) => {
        categoryTotals[cat] = categoryTotals[cat].map((secs) => parseFloat((secs / 3600).toFixed(2)));
    });
    return [
        {
            x: dates,
            y: categoryTotals['work'],
            name: 'Work',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-accent-dark-1') },
        },
        {
            x: dates,
            y: categoryTotals['study'],
            name: 'study',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-accent-dark-3') },
        },
        {
            x: dates,
            y: categoryTotals['personal'],
            name: 'Personal',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-sidebar-light-3') },
        },
        {
            x: dates,
            y: categoryTotals['break'],
            name: 'Break',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-background-light-3') },
        },
        {
            x: dates,
            y: categoryTotals['social'],
            name: 'Social',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-background-light-3') },
        },
        {
            x: dates,
            y: categoryTotals['other'],
            name: 'Other',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-text-light-2') },
        },
    ] as Data[];
}

export function getProductivityData(events: CategorizedEvent[]): Data[] {
    const hourlyData = Array(24)
        .fill(0)
        .map(() => ({ weightedProductivity: 0, totalDuration: 0 }));
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    for (const event of events) {
        const hour = new Date(event.timestamp).getHours();
        hourlyData[hour].weightedProductivity += event.duration * event.productivity;
        hourlyData[hour].totalDuration += event.duration;
    }
    const productivityValues = hourlyData.map((h) =>
        h.totalDuration > 0 ? Math.round(h.weightedProductivity / h.totalDuration) : 0
    );
    return [
        {
            x: hours,
            y: productivityValues,
            name: 'Productivity',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: getCSSVariableColor('--color-accent-dark-1'), width: 3 },
            marker: { color: getCSSVariableColor('--color-accent'), size: 6 },
        },
    ] as Data[];
}

export function getCategoryData(events: CategorizedEvent[]): Data[] {
    const categoryTotals: Record<string, number> = {};
    for (const event of events) {
        categoryTotals[event.category] = (categoryTotals[event.category] || 0) + event.duration;
    }
    const labels = Object.keys(categoryTotals);
    const values = labels.map((label) => parseFloat((categoryTotals[label] / 3600).toFixed(2)));
    return [
        {
            labels,
            values,
            type: 'pie',
            marker: {
                colors: [
                    getCSSVariableColor('--color-accent'),
                    getCSSVariableColor('--color-accent-dark-1'),
                    getCSSVariableColor('--color-accent-dark-3'),
                    getCSSVariableColor('--color-sidebar-light-3'),
                    getCSSVariableColor('--color-background-light-3'),
                    getCSSVariableColor('--color-text-light-2'),
                ],
            },
            textinfo: 'label+percent',
            textfont: { color: 'white' },
            hovertemplate: '<b>%{label}</b><br>%{value:.1f} hours<br>%{percent}<extra></extra>',
        },
    ] as Data[];
}

export function getWeeklyTrendData(events: CategorizedEvent[]): Data[] {
    const today = new Date();
    const dailyTotals: number[] = Array(7).fill(0);
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - (6 - i));
        labels.push(day.toLocaleDateString(undefined, { weekday: 'short' }));
        const dayStart = new Date(day.setHours(0, 0, 0, 0));
        const dayEnd = new Date(day.setHours(23, 59, 59, 999));
        const dailyEvents = events.filter(
            (event) => new Date(event.timestamp) >= dayStart && new Date(event.timestamp) <= dayEnd
        );
        const totalDurationSeconds = dailyEvents.reduce((sum, event) => sum + event.duration, 0);
        dailyTotals[i] = parseFloat((totalDurationSeconds / 3600).toFixed(2));
    }
    return [
        {
            x: labels,
            y: dailyTotals,
            name: 'Total Hours',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: getCSSVariableColor('--color-accent'), width: 4 },
            marker: { color: getCSSVariableColor('--color-accent-dark-3'), size: 8 },
            fill: 'tonexty',
            fillcolor: `rgba(6, 182, 212, 0.1)`,
        },
    ] as Data[];
}

export function getTotalTime(events: CategorizedEvent[]): string {
    const totalDuration = events.reduce((sum, event) => sum + event.duration, 0);
    return formatDuration(totalDuration);
}

export function getAverageSession(events: CategorizedEvent[]): string {
    if (events.length === 0) return '0m 0s';
    const totalDuration = events.reduce((sum, event) => sum + event.duration, 0);
    return formatDuration(totalDuration / events.length);
}

export function getActiveDays(events: CategorizedEvent[]): string {
    const activeDays = new Set(events.map((event) => new Date(event.timestamp).toLocaleDateString()));
    return `${activeDays.size} days`;
}

export function getLongestSession(events: CategorizedEvent[]): string {
    if (events.length === 0) return '0m 0s';
    const longestDuration = Math.max(...events.map((event) => event.duration));
    return formatDuration(longestDuration);
}
