import { createSignal, createMemo, For } from 'solid-js';
import { Filter, ArrowUpDown, Search, ChevronDown } from 'lucide-solid'
import GoalCard from '@/components/03 - Track/GoalCard';
import Input from '@/components/core/Input';

interface GoalData {
    id: number;
    name: string;
    progress: number;
    category: 'learning' | 'project' | 'personal';
    priority: 'high' | 'medium' | 'low';
    deadline: string;
}

type SortOption = 'name' | 'progress' | 'deadline' | 'priority';
type FilterOption = 'all' | 'learning' | 'project' | 'personal';

export default function LeftMenu() {

    // Sample goals data
    const initialGoals: GoalData[] = [
        { id: 1, name: 'Win Agri Challenge', progress: 50, category: 'project', priority: 'high', deadline: '2025-07-15' },
        { id: 2, name: 'Complete SolidJS Crash Course', progress: 40, category: 'learning', priority: 'medium', deadline: '2025-07-01' },
        { id: 3, name: 'Build Portfolio Website', progress: 25, category: 'project', priority: 'high', deadline: '2025-08-01' },
        { id: 4, name: 'Learn TypeScript Advanced Patterns', progress: 60, category: 'learning', priority: 'medium', deadline: '2025-07-30' },
        { id: 5, name: 'Finish Classical RL Course', progress: 80, category: 'learning', priority: 'low', deadline: '2025-06-30' },
    ];

    const [showSortMenu, setShowSortMenu] = createSignal(false);
    const [showFilterMenu, setShowFilterMenu] = createSignal(false);
    // Reactive signals
    const [searchTerm, setSearchTerm] = createSignal('');
    const [sortBy, setSortBy] = createSignal<SortOption>('progress');
    const [filterBy, setFilterBy] = createSignal<FilterOption>('all');


    // Computed filtebad and sorted goals
    const filtebadAndSortedGoals = createMemo(() => {
        let goals = [...initialGoals];

        // Filter by search term
        if (searchTerm()) {
            goals = goals.filter(goal =>
                goal.name.toLowerCase().includes(searchTerm().toLowerCase())
            );
        }

        // Filter by category
        if (filterBy() !== 'all') {
            goals = goals.filter(goal => goal.category === filterBy());
        }

        // Sort goals
        goals.sort((a, b) => {
            switch (sortBy()) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'progress':
                    return b.progress - a.progress; // Descending order
                case 'deadline':
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                default:
                    return 0;
            }
        });

        return goals;
    });


    const getSortLabel = () => {
        switch (sortBy()) {
            case 'name': return 'Name';
            case 'progress': return 'Progress';
            case 'deadline': return 'Deadline';
            case 'priority': return 'Priority';
            default: return 'Sort';
        }
    };

    const getFilterLabel = () => {
        switch (filterBy()) {
            case 'all': return 'All';
            case 'learning': return 'Learning';
            case 'project': return 'Project';
            case 'personal': return 'Personal';
            default: return 'Filter';
        }
    };

    return (
        <div class="bg-sidebar text-text/70 h-full py-4 rounded-md p-8 flex flex-col col-span-3 gap-4 overflow-y-auto pb-40" >          <div class="flex items-center justify-between mb-4">
            <p class='text-lg font-semibold'>Goals In Progress</p>
            <div class="flex gap-2 relative">
                <div class="relative">
                    <button
                        class="flex items-center gap-2 px-3 py-1 bg-sidebar-light-2 rounded-md hover:bg-sidebar-light-3 transition-colors"
                        onClick={() => setShowFilterMenu(!showFilterMenu())}
                    >
                        <Filter size={14} />
                        <span class="text-sm">{getFilterLabel()}</span>
                        <ChevronDown size={12} class={`transition-transform ${showFilterMenu() ? 'rotate-180' : ''}`} />
                    </button>
                    {showFilterMenu() && (
                        <div class="absolute top-full left-0 mt-1 bg-sidebar-light-2 border border-border-light-2 rounded-md shadow-lg z-10 min-w-32">
                            <button
                                class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                onClick={() => { setFilterBy('all'); setShowFilterMenu(false); }}
                            >
                                All Categories
                            </button>
                            <button
                                class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                onClick={() => { setFilterBy('learning'); setShowFilterMenu(false); }}
                            >
                                Learning
                            </button>
                            <button
                                class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                onClick={() => { setFilterBy('project'); setShowFilterMenu(false); }}
                            >
                                Project
                            </button>
                            <button
                                class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                onClick={() => { setFilterBy('personal'); setShowFilterMenu(false); }}
                            >
                                Personal
                            </button>
                        </div>
                    )}
                </div>

                <div class="relative">
                    <button
                        class="flex items-center gap-2 px-3 py-1 bg-sidebar-light-2 rounded-md hover:bg-sidebar-light-3 transition-colors"
                        onClick={() => setShowSortMenu(!showSortMenu())}
                    >
                        <ArrowUpDown size={14} />
                        <span class="text-sm">{getSortLabel()}</span>
                        <ChevronDown size={12} class={`transition-transform ${showSortMenu() ? 'rotate-180' : ''}`} />
                    </button>
                    {showSortMenu() && (
                        <div class="absolute top-full right-0 mt-1 bg-sidebar-light-2 border border-border-light-2 rounded-md shadow-lg z-10 min-w-32">
                            <button
                                class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                onClick={() => { setSortBy('progress'); setShowSortMenu(false); }}
                            >
                                Progress
                            </button>
                            <button
                                class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                onClick={() => { setSortBy('name'); setShowSortMenu(false); }}
                            >
                                Name
                            </button>
                            <button
                                class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                onClick={() => { setSortBy('deadline'); setShowSortMenu(false); }}
                            >
                                Deadline
                            </button>
                            <button
                                class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                onClick={() => { setSortBy('priority'); setShowSortMenu(false); }}
                            >
                                Priority
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

            <div class="relative mb-4">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/50 w-4 h-4" />
                <Input searchTerm={searchTerm()} setSearchTerm={setSearchTerm} />
            
            </div>          <For each={filtebadAndSortedGoals()}>
                {(goal) => (
                    <GoalCard
                        name={goal.name}
                        progress={goal.progress}
                        category={goal.category}
                        priority={goal.priority}
                        deadline={goal.deadline}
                    />
                )}
            </For>

        </div>
    );
};
