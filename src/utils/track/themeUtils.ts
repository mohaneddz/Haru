

export const getCategoryTextColor = (category: TimeBlock['category']) => {
    const colors: Record<string, string> = {
        learning: 'text-text/70',
        project: 'text-text/70',
        work: 'text-text/70',
        study: 'text-text/70',
        break: 'text-text/70',
        personal: 'text-text/70',
        sleep: 'text-text/70',
        other: 'text-text/70',
        social: 'text-text/70',
    };
    return colors[category] ?? 'text-text/70';
};

export const getCSSVariableColor = (variable: string) => {
    if (typeof window !== 'undefined')
        return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return '#FFFFFF';
};

export const getCategoryColor = (category: TimeBlock['category']) => {  
    const colors: Record<string, string> = {
        learning: 'bg-accent-dark-1',
        project: 'bg-accent-dark-3',
        work: 'bg-accent-light-2',
        study: 'bg-accent-dark-3',
        break: 'bg-accent-light-3',
        personal: 'bg-accent',
        sleep: 'bg-background-light-3',
        other: 'bg-background-accent-3',
        social: 'bg-background-light-3',
    };
    return colors[category] ?? 'bg-background-light-3';
}
