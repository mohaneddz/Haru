import { db } from '@/database/connection';

export async function saveToTable(tableName: string, data: Record<string, any>) {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);

  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
  await db.execute(query, values);
}

export async function loadFromTable(tableName: string): Promise<Record<string, any>[]> {
  const query = `SELECT * FROM ${tableName}`;
  const result = await db.select(query) as Record<string, any>[];
  return result;
}

export async function deleteFromTable(tableName: string, condition: string, params: any[] = []) {
  const query = `DELETE FROM ${tableName} WHERE ${condition}`;
  await db.execute(query, params);
}

export async function updateTable(
  tableName: string,
  data: Record<string, any>,
  condition: string,
  params: any[] = []
) {
  const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), ...params];

  const query = `UPDATE ${tableName} SET ${setClause} WHERE ${condition}`;
  await db.execute(query, values);
}

export async function createTable(tableName: string, schema: string) {
  const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
  await db.execute(query);
}

export async function replaceTable(tableName: string, data: Record<string, any>) {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);

  const query = `REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
  await db.execute(query, values);
}

export async function removeTable(tableName: string) {
  const query = `DROP TABLE IF EXISTS ${tableName}`;
  await db.execute(query);
}