import { db } from '@/database/connection';

export async function testDummy() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      status TEXT
    );
  `);
  console.log('Dummy result:', result);
  return result;
}


export async function testInert() {
    // Use AUTOINCREMENT instead of manually calculating the next ID
    const result = await db.execute(
        "INSERT INTO data (title, status) VALUES ($1, $2)",
        ['Test Todo', 'pending'],
    );

    console.log('Insert result:', result);
    return result;
}

export async function testUpdate() {
    // Update all rows - toggle status between pending and completed
    const result = await db.execute(`
        UPDATE data 
        SET status = CASE 
            WHEN status = 'pending' THEN 'completed' 
            ELSE 'pending' 
        END
    `);

    console.log('Update result:', result);
    return result;
}

export async function testDelete() {
    // Delete all rows from the table
    const result = await db.execute("DELETE FROM data");
    console.log('Delete result:', result);
    return result;
}

export async function testGetAll() {
    const result = await db.select("SELECT * FROM data");
    console.log('Get All result:', result);
    return result;
}

export async function testGetById(id: string) {
    const newId = parseInt(id, 10);
    const result = await db.select(
        "SELECT * FROM data WHERE id = $1",
        [newId],
    );
    console.log('Get By ID result:', result);
    return result;
}

export async function dropDummy() {
    const result = await db.execute("DROP TABLE IF EXISTS data");
    console.log('Drop Dummy result:', result);
    return result;
}