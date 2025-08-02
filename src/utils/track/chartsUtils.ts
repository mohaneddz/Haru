import { isoToHHMM, addSecondsToISO, formatDuration } from '@/utils/track/timeUtils';
import { getCSSVariableColor } from '@/utils/track/themeUtils';
import type { Data } from 'plotly.js';

// Helper to get date ranges for week, month, quarter
function getPeriodDates(period: 'week' | 'month' | 'quarter'): { labels: string[]; ranges: { start: Date; end: Date }[] } {
    const today = new Date();
    let labels: string[] = [];
    let ranges: { start: Date; end: Date }[] = [];
    if (period === 'week') {
        for (let i = 0; i < 7; i++) {
            const day = new Date(today);
            day.setDate(today.getDate() - (6 - i));
            labels.push(day.toLocaleDateString(undefined, { weekday: 'short' }));
            const start = new Date(day.setHours(0, 0, 0, 0));
            const end = new Date(day.setHours(23, 59, 59, 999));
            ranges.push({ start, end });
        }
    } else if (period === 'month') {
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(year, month, i);
            labels.push(day.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }));
            const start = new Date(day.setHours(0, 0, 0, 0));
            const end = new Date(day.setHours(23, 59, 59, 999));
            ranges.push({ start, end });
        }
    } else if (period === 'quarter') {
        const year = today.getFullYear();
        const month = today.getMonth();
        const quarterStartMonth = Math.floor(month / 3) * 3;
        for (let m = quarterStartMonth; m < quarterStartMonth + 3; m++) {
            const firstDay = new Date(year, m, 1);
            const daysInMonth = new Date(year, m + 1, 0).getDate();
            labels.push(firstDay.toLocaleDateString(undefined, { month: 'short' }));
            const start = new Date(year, m, 1, 0, 0, 0, 0);
            const end = new Date(year, m, daysInMonth, 23, 59, 59, 999);
            ranges.push({ start, end });
        }
    }
    return { labels, ranges };
}

// Timeline for a day (unchanged, no period arg)
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

// Daily/Monthly/Quarterly time data
export function getTimeDataForPeriod(events: CategorizedEvent[], period: 'week' | 'month' | 'quarter'): Data[] {
    const categories: ActivityCategory[] = ['work', 'study', 'personal', 'break', 'other', 'social'];
    const { labels, ranges } = getPeriodDates(period);
    const categoryTotals: Record<string, number[]> = Object.fromEntries(
        categories.map((c) => [c, Array(labels.length).fill(0)])
    );
    for (let i = 0; i < ranges.length; i++) {
        const { start, end } = ranges[i];
        const periodEvents = events.filter(
            (event) => new Date(event.timestamp) >= start && new Date(event.timestamp) <= end
        );
        for (const event of periodEvents) {
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
            x: labels,
            y: categoryTotals['work'],
            name: 'Work',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-accent-dark-1') },
        },
        {
            x: labels,
            y: categoryTotals['study'],
            name: 'Study',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-accent-dark-3') },
        },
        {
            x: labels,
            y: categoryTotals['personal'],
            name: 'Personal',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-sidebar-light-3') },
        },
        {
            x: labels,
            y: categoryTotals['break'],
            name: 'Break',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-background-light-3') },
        },
        {
            x: labels,
            y: categoryTotals['social'],
            name: 'Social',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-background-light-3') },
        },
        {
            x: labels,
            y: categoryTotals['other'],
            name: 'Other',
            type: 'bar',
            marker: { color: getCSSVariableColor('--color-text-light-2') },
        },
    ] as Data[];
}

// Productivity by hour for period
export function getProductivityDataForPeriod(events: CategorizedEvent[], period: 'week' | 'month' | 'quarter'): Data[] {
    const hourlyData = Array(24)
        .fill(0)
        .map(() => ({ weightedProductivity: 0, totalDuration: 0 }));
    const { ranges } = getPeriodDates(period);
    const filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return ranges.some(({ start, end }) => eventDate >= start && eventDate <= end);
    });
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    for (const event of filteredEvents) {
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

// Category pie for period
export function getCategoryDataForPeriod(events: CategorizedEvent[], period: 'week' | 'month' | 'quarter'): Data[] {
    const { ranges } = getPeriodDates(period);
    const filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return ranges.some(({ start, end }) => eventDate >= start && eventDate <= end);
    });
    const categoryTotals: Record<string, number> = {};
    for (const event of filteredEvents) {
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

// Trend line for period
export function getTrendDataForPeriod(events: CategorizedEvent[], period: 'week' | 'month' | 'quarter'): Data[] {
    const { labels, ranges } = getPeriodDates(period);
    const totals: number[] = Array(labels.length).fill(0);
    for (let i = 0; i < ranges.length; i++) {
        const { start, end } = ranges[i];
        const periodEvents = events.filter(
            (event) => new Date(event.timestamp) >= start && new Date(event.timestamp) <= end
        );
        const totalDurationSeconds = periodEvents.reduce((sum, event) => sum + event.duration, 0);
        totals[i] = parseFloat((totalDurationSeconds / 3600).toFixed(2));
    }
    return [
        {
            x: labels,
            y: totals,
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

// Total time for period
export function getTotalTimeForPeriod(events: CategorizedEvent[], period: 'week' | 'month' | 'quarter'): string {
    const { ranges } = getPeriodDates(period);
    const filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return ranges.some(({ start, end }) => eventDate >= start && eventDate <= end);
    });
    const totalDuration = filteredEvents.reduce((sum, event) => sum + event.duration, 0);
    return formatDuration(totalDuration);
}

// Average session for period
export function getAverageSessionForPeriod(events: CategorizedEvent[], period: 'week' | 'month' | 'quarter'): string {
    const { ranges } = getPeriodDates(period);
    const filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return ranges.some(({ start, end }) => eventDate >= start && eventDate <= end);
    });
    if (filteredEvents.length === 0) return '0m 0s';
    const totalDuration = filteredEvents.reduce((sum, event) => sum + event.duration, 0);
    return formatDuration(totalDuration / filteredEvents.length);
}

// Active days for period
export function getActiveDaysForPeriod(events: CategorizedEvent[], period: 'week' | 'month' | 'quarter'): string {
    const { ranges } = getPeriodDates(period);
    const filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return ranges.some(({ start, end }) => eventDate >= start && eventDate <= end);
    });
    const activeDays = new Set(filteredEvents.map((event) => new Date(event.timestamp).toLocaleDateString()));
    return `${activeDays.size} days`;
}

// Longest session for period
export function getLongestSessionForPeriod(events: CategorizedEvent[], period: 'week' | 'month' | 'quarter'): string {
    const { ranges } = getPeriodDates(period);
    const filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return ranges.some(({ start, end }) => eventDate >= start && eventDate <= end);
    });
    if (filteredEvents.length === 0) return '0m 0s';
    const longestDuration = Math.max(...filteredEvents.map((event) => event.duration));
    return formatDuration(longestDuration);
}
