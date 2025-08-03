import { For } from 'solid-js';
import { Filter, ArrowUpDown, Search, ChevronDown } from 'lucide-solid'
import GoalCard from '@/components/03 - Track/GoalCard';
import Input from '@/components/core/Input/Input';

import useGoals from '@/hooks/tracking/useGoals';


export default function LeftMenu() {
    const {
        filteredAndSortedGoals,
        showSortMenu,
        setShowSortMenu,
        showFilterMenu,
        setShowFilterMenu,
        searchTerm,
        setSearchTerm,
        setSortBy,
        getFilterLabel,
        getSortLabel,
        setFilterBy,
        getPriorityLabel
    } = useGoals();


    return (
        <div class="bg-sidebar text-text/70 h-full pt-8 pb-20 rounded-md p-8 flex flex-col col-span-3 gap-4 overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
                <p class='text-lg text-accent font-semibold'>Goals In Progress</p>
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
                                    All Types
                                </button>
                                <button
                                    class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                    onClick={() => { setFilterBy('project'); setShowFilterMenu(false); }}
                                >
                                    Projects
                                </button>
                                <button
                                    class="w-full px-3 py-2 text-left text-sm hover:bg-sidebar-light-3 transition-colors"
                                    onClick={() => { setFilterBy('learning'); setShowFilterMenu(false); }}
                                >
                                    Learning
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

            </div>
            <div class="flex flex-col gap-4">
                <For each={filteredAndSortedGoals()}>
                    {(goal) => (
                        <GoalCard
                            name={goal.name}
                            progress={goal.progress}
                            category={goal.category}
                            priority={getPriorityLabel(goal.priority)}
                            deadline={goal.deadline}
                        />
                    )}
                </For>
            </div>
        </div>
    );
};
