import { TODOIST_KEY } from '@/config/env';
import { TodoistTask, CreateTaskArgs, FetchTasksOptions } from '@/types/track/todoist';

const BASE = 'https://api.todoist.com/rest/v2';
const HDRS = (requestId?: string): HeadersInit => ({
  Authorization: `Bearer ${TODOIST_KEY}`,
  'Content-Type': 'application/json',
  ...(requestId ? { 'X-Request-Id': requestId } : {}),
});

async function TodoistHandle204(response: Response) {
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Todoist ${response.status} ${response.statusText}: ${JSON.stringify(err)}`);
  }
}

export async function TodoistFetchTasks(options?: FetchTasksOptions, requestId?: string): Promise<TodoistTask[]> {
  const url = new URL(`${BASE}/tasks`);
  options && Object.entries(options).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, Array.isArray(v) ? v.join(',') : v.toString());
  });
  const res = await fetch(url.toString(), { headers: HDRS(requestId) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`fetchTasks failed ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export async function TodoistFetchTask(taskId: string, requestId?: string): Promise<TodoistTask> {
  const res = await fetch(`${BASE}/tasks/${encodeURIComponent(taskId)}`, { headers: HDRS(requestId) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`fetchTask ${taskId} failed ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export async function TodoistCreateTask(args: CreateTaskArgs, requestId?: string): Promise<TodoistTask> {
  const res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: HDRS(requestId),
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`createTask failed ${res.status}: ${JSON.stringify(err)}`);
  }
  const createdTask = await res.json(); // Store the parsed response
  console.log(`Created task with content: ${args}`);
  console.log('Created task:', createdTask); // Log the stored response
  return createdTask; // Return the stored response
} 


export async function TodoistUpdateTask(taskId: string, updates: Partial<CreateTaskArgs>, requestId?: string): Promise<void> {
  const res = await fetch(`${BASE}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'POST', // REST v2 uses POST for update, not PATCH :contentReference[oaicite:10]{index=10}
    headers: HDRS(requestId),
    body: JSON.stringify(updates),
  });
  await TodoistHandle204(res);
}

export async function TodoistDeleteTask(taskId: string, requestId?: string): Promise<void> {
  const res = await fetch(`${BASE}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
    headers: HDRS(requestId),
  });
  await TodoistHandle204(res);
}

export async function TodoistCloseTask(taskId: string, requestId?: string): Promise<void> {
  const res = await fetch(`${BASE}/tasks/${encodeURIComponent(taskId)}/close`, {
    method: 'POST',
    headers: HDRS(requestId),
  });
  await TodoistHandle204(res);
}

export async function TodoistReopenTask(taskId: string, requestId?: string): Promise<void> {
  const res = await fetch(`${BASE}/tasks/${encodeURIComponent(taskId)}/reopen`, {
    method: 'POST',
    headers: HDRS(requestId),
  });
  await TodoistHandle204(res);
}

export async function TodoistFetchTodayTasks(requestId?: string): Promise<TodoistTask[]> {
  const url = new URL(`${BASE}/tasks`);
  url.searchParams.set('filter', 'today');
  const res = await fetch(url.toString(), { headers: HDRS(requestId) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`fetchTodayTasks failed ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}
