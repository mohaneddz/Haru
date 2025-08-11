import { createSignal, onMount, createMemo } from 'solid-js';
// import { TODOIST_KEY } from '@/config/env';
import { TodoistCreateTask, TodoistFetchTodayTasks } from '@/utils/track/todoistUtils';
import { SortOption, FilterOption, TaskPriority, TaskPriorityNumber } from '@/types/track/todoist';
import { marked } from 'marked';
import { createTable, loadFromTable, replaceTable, 
	// removeTable 
} from '@/utils/database/databaseUtils';

interface GoalData {
	id: number;
	name: string;
	progress: number;
	category: 'Goal' | 'Habit' | 'Project';
	priority: 1 | 2 | 3 | 4 | undefined;
	deadline?: string;
	repetition?: string; 
}

export default function useGoals() {
	const [goalAddModalOpen, setGoalAddModalOpen] = createSignal(false);
	const [habitAddModalOpen, setHabitAddModalOpen] = createSignal(false);
	const [projectAddModalOpen, setProjectAddModalOpen] = createSignal(false);

	const [initialGoals, setInitialGoals] = createSignal<GoalData[]>([]);

	function PriorityNumber(priority: TaskPriority): TaskPriorityNumber {
		switch (priority) {
			case 'Low':
				return 1;
			case 'Normal':
				return 2;
			case 'Medium':
				return 3;
			case 'High':
				return 4;
			default:
				return undefined;
		}
	}

	// function PriorityString(priority: TaskPriorityNumber): TaskPriority {
	// 	switch (priority) {
	// 		case 1:
	// 			return 'Low';
	// 		case 2:
	// 			return 'Normal';
	// 		case 3:
	// 			return 'Medium';
	// 		case 4:
	// 			return 'High';
	// 		default:
	// 			return undefined;
	// 	}
	// }

	const createGoal = async () => {
		const name = (document.getElementById('goal-input') as HTMLInputElement).value;
		// by default + month if no deadline is set
		const deadline = (document.getElementById('goal-date') as HTMLInputElement).value ;

		const prioritySelect = document.getElementById('goal-priority') as HTMLSelectElement;
		const priorityValue = prioritySelect.value as TaskPriority;
		const newGoal: GoalData = {
			id: Date.now(),
			name,
			progress: 0,
			category: 'Goal',
			priority: PriorityNumber(priorityValue),
			deadline
		};
		setInitialGoals([...initialGoals(), newGoal]);
		const res = await TodoistCreateTask({
			content: newGoal.name,
			priority: newGoal.priority,
			due: {
				date: newGoal.deadline,
				string: newGoal.deadline,
				lang: 'en',
				is_recurring: false
			},
			labels: ['Goal'],
		});
		console.log('Goal created:', newGoal);
		console.log('Todoist response:', res);
		setGoalAddModalOpen(false);
	};

	const createHabit = async () => {
		const name = (document.getElementById('habit-input') as HTMLInputElement).value;
		const repetition = (document.getElementById('habit-repetition') as HTMLInputElement).value;
		const prioritySelect = document.getElementById('habit-priority') as HTMLSelectElement;
		const priorityValue = prioritySelect.value as TaskPriority;

		const newHabit: GoalData = {
			id: Date.now(),
			name,
			progress: 0,
			category: 'Habit',
			priority: PriorityNumber(priorityValue),
			repetition: repetition,
		};
		setInitialGoals([...initialGoals(), newHabit]);
		const res = await TodoistCreateTask({
			content: newHabit.name,
			priority: newHabit.priority,
			due: {
				string: 'every monday',
				lang: 'en',
				is_recurring: true,
			},
			labels: ['Habit'],
		});
		console.log('Habit created:', newHabit);
		console.log('Todoist response:', res);
		setHabitAddModalOpen(false);
	};

	const createTask = async () => {
		try {
			const content = (document.getElementById('goal-input') as HTMLInputElement).value;
			console.log('Creating task with content:', content);
			const task = await TodoistCreateTask({ content });
			console.log('Task created:', task);
		} catch (error) {
			console.error('Error creating task:', error);
		}
	};

	function stripHtmlTags(html: string): string {
		return html.replace(/<[^>]*>/g, '');
	}

	function cacheLoadGoals(cache: GoalData[]) {
		if (cache.length > 0) {
			setInitialGoals(cache);
		} else {
			console.log('No cached goals found, fetching from Todoist');
		}
	}

	onMount(() => {
		// Removed unused 'cache' variable
		loadFromTable('goals')
			.then((data: Record<string, any>[]) => {
				const goals = data.map((item) => ({
					id: item.id,
					name: item.name,
					progress: item.progress,
					category: item.category,
					priority: item.priority,
					deadline: item.deadline,
				} as GoalData));
				cacheLoadGoals(goals); // Correctly handle the resolved data
			})
			.catch((error) => {
				console.error('Error loading goals from database:', error);
				if (error.includes('no such table')) {
					// If the table doesn't exist, create it
					createTable('goals', `
						id INTEGER PRIMARY KEY,
						name TEXT NOT NULL,
						progress INTEGER DEFAULT 0,
						category TEXT CHECK(category IN ('Project', 'Goal', 'Habit')) NOT NULL,
						priority INTEGER CHECK(priority IN (1, 2, 3, 4)) DEFAULT 2,
						deadline TEXT NOT NULL
					`);
				}
			});

		TodoistFetchTodayTasks()
			.then((tasks) => {
				console.log('Fetched tasks:', tasks);
				setInitialGoals(
					tasks.map((task) => ({
						id: parseInt(task.id, 10),
						// parse markdown, then strip HTML tags for plain text
						name: stripHtmlTags(marked.parseInline(task.content) as string),
						progress: 0,
						category: task.labels?.includes('Goal') ? 'Goal' :
							task.labels?.includes('Project') ? 'Project' :
							task.labels?.includes('Habit') ? 'Habit' : 'Goal',
						priority: task.priority as 1 | 2 | 3 | 4 | undefined,
						deadline: new Date().toISOString().split('T')[0],
					}))
				);
				// Save fetched goals to the database
				Promise.all(
					tasks.map((task) =>
						replaceTable('goals', {
							id: parseInt(task.id, 10),
							name: stripHtmlTags(marked.parseInline(task.content) as string),
							progress: 0,
							category: task.labels?.includes('Goal') ? 'Goal' :
								task.labels?.includes('Project') ? 'Project' :
								task.labels?.includes('Habit') ? 'Habit' : 'Goal',
							priority: task.priority as 1 | 2 | 3 | 4 | undefined,
							deadline: new Date().toISOString().split('T')[0],
						})
					)
				)
					.then(() => {
						console.log('Fetched goals saved to database');
					})
					.catch((error) => {
						console.error('Error saving fetched goals to database:', error);
					});
			})
			.catch((error) => {
				console.error('Error fetching tasks:', error);
			});
	});

	const [showSortMenu, setShowSortMenu] = createSignal(false);
	const [showFilterMenu, setShowFilterMenu] = createSignal(false);
	// Reactive signals
	const [searchTerm, setSearchTerm] = createSignal('');
	const [sortBy, setSortBy] = createSignal<SortOption>('progress');
	const [filterBy, setFilterBy] = createSignal<FilterOption>('all');

	// Computed filtered and sorted goals
	const filteredAndSortedGoals = createMemo(() => {
		let goals = [...initialGoals()];

		// Filter by search term
		if (searchTerm()) {
			goals = goals.filter((goal) => goal.name.toLowerCase().includes(searchTerm().toLowerCase()));
		}

		// Filter by category
		if (filterBy() !== 'all') {
			goals = goals.filter((goal) => filterBy() === 'all' || goal.category.toLowerCase() === filterBy());
		}

		// Sort goals
		goals.sort((a, b) => {
			switch (sortBy()) {
				case 'name':
					return a.name.localeCompare(b.name);
				case 'progress':
					return b.progress - a.progress;
				case 'deadline':
					return new Date(a.deadline ?? '1970-01-01').getTime() - new Date(b.deadline ?? '1970-01-01').getTime();
				case 'priority':
					return getPrioritySortValue(b.priority) - getPrioritySortValue(a.priority);
				default:
					return 0;
			}
		});

		return goals;
	});

	const getSortLabel = () => {
		switch (sortBy()) {
			case 'name':
				return 'Name';
			case 'progress':
				return 'Progress';
			case 'deadline':
				return 'Deadline';
			case 'priority':
				return 'Priority';
			default:
				return 'Sort';
		}
	};

	const getFilterLabel = () => {
		switch (filterBy()) {
			case 'all':
				return 'All';
			case 'project':
				return 'Project';
			case 'learning':
				return 'Learning';
			case 'personal':
				return 'Personal';
			default:
				return 'Filter';
		}
	};

	// Priority mapping helper
	function getPriorityLabel(priority: 1 | 2 | 3 | 4 | undefined): TaskPriority {
		switch (priority) {
			case 1:
				return 'Low';
			case 2:
				return 'Normal';
			case 3:
				return 'Medium';
			case 4:
				return 'High';
			default:
				return 'Normal';
		}
	}

	// Priority sorting helper
	function getPrioritySortValue(priority: 1 | 2 | 3 | 4 | undefined): number {
		switch (priority) {
			case 1:
				return 1; // Low
			case 2:
				return 2; // Normal
			case 3:
				return 3; // Medium
			case 4:
				return 4; // High
			default:
				return 0;
		}
	}

	return {
		goalAddModalOpen,
		setGoalAddModalOpen,
		habitAddModalOpen,
		setHabitAddModalOpen,
		projectAddModalOpen,
		setProjectAddModalOpen,
		initialGoals,

		createTask,
		createGoal,
		createHabit,

		filteredAndSortedGoals,
		showSortMenu,
		setShowSortMenu,
		showFilterMenu,
		setShowFilterMenu,
		searchTerm,
		setSearchTerm,
		sortBy,
		setSortBy,
		getFilterLabel,
		getSortLabel,
		setFilterBy,
		getPriorityLabel,
	};
}