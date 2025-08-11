export interface TodoistDue {
  date?: string; 
  string?: string; 
  timezone?: string;
  is_recurring?: boolean;
  lang?: string;
}

export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  project_id: string;
  section_id?: string;
  parent_id?: string;
  order?: number;
  priority?: 1 | 2 | 3 | 4;
  labels?: string[];
  creator_id?: string;
  assignee_id?: string;
  assignee_ids?: string[];
  due?: TodoistDue | null;
  url?: string;
  completed_date?: string;
  is_completed?: boolean;
  // …extend as needed
}

export interface CreateTaskArgs {
  content: string;
  description?: string;
  project_id?: string;
  section_id?: string;
  parent_id?: string;
  order?: number;
  priority?: 1 | 2 | 3 | 4;
  labels?: string[];
  due?: TodoistDue;
  assignee_id?: string;
  assignee_ids?: string[];
  // asynchronous natural language parse:
  due_string?: string;
  due_lang?: string;
}

export interface FetchTasksOptions {
  project_id?: string;
  section_id?: string;
  label_ids?: string[];
  filter?: string;
  lang?: string;
  limit?: number;
}

export type TaskPriority = "Low" | "Normal" | "Medium" | "High" | undefined;
export type TaskPriorityNumber = 1 | 2 | 3 | 4 | undefined;
export type SortOption = 'name' | 'progress' | 'deadline' | 'priority';
export type FilterOption = 'all' | 'project' | 'learning' | 'personal';