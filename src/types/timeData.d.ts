type ActivityCategory = 'study' | 'break'  | 'personal' | 'work' | 'other'|  'social';

interface TimeBlock {
    startTime: string;
    endTime: string;
    activity: string;
    category: ActivityCategory;
    description?: string;
    productivity?: number;
}

type ValidCategory = TimeBlock['category'];

const DEFAULT_CATEGORY: ValidCategory = 'personal';

function toValidCategory(category: string): ValidCategory {
    const validCategories: Set<ValidCategory> = new Set(["work", "study", "break", "personal", "other", "social"]);
    return validCategories.has(category as ValidCategory) ? category as ValidCategory : DEFAULT_CATEGORY;
}

interface TimeBlock {
	startTime: string;
	endTime: string;
	activity: string;
	category: 'study'  | 'break'  | 'personal' | 'work' | 'other' | 'social';
	description?: string;
	productivity?: number;
}


interface CategorizedEvent {
    id: number;
    timestamp: string;
    duration: number;
    data: { app: string; title: string; };
    category: ActivityCategory;
    productivity: number;
}

interface EventCache {
    events: CategorizedEvent[];
    start: string;
    end: string;
}

interface TimeBlock {
    startTime: string;
    endTime: string;
    activity: string;
    category: ActivityCategory;
    productivity: number;
}