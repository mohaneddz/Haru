export function isoToHHMM(iso: string): string { return iso.substring(11, 16); }

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


export function addSecondsToISO(iso: string, seconds: number): string {
	const date = new Date(iso);
	date.setSeconds(date.getSeconds() + seconds);
	return date.toISOString().substring(11, 16);
}

export function formatDuration(totalSeconds: number): string {
	if (totalSeconds < 60) return `0m ${Math.round(totalSeconds)}s`;
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m ${Math.round(totalSeconds % 60)}s`;
}
