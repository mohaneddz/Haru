import Database from '@tauri-apps/plugin-sql';

const db = await Database.load('postgres://admin:admin@host/test');




const result = await db.execute(
  "INSERT into todos (id, title, status) VALUES ($1, $2, $3)",
  [todos.id, todos.title, todos.status],
);