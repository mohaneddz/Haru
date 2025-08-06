import { invoke } from '@tauri-apps/api/core';
import { fetch } from '@tauri-apps/plugin-http';
import Database from '@tauri-apps/plugin-sql';
import { AW_BUCKET_ID, AW_API_URL, FASTTEXT_INPUT_PATH } from '@/constants/aw';

const DB_NAME = 'aw-events.db';
let dbInstance: Database | null = null;

// =================================================================================
// DATABASE HELPERS
// =================================================================================

async function getDbInstance(): Promise<Database> {
	if (dbInstance) return dbInstance;
	try {
		console.log(`Loading database: ${DB_NAME}`);
		dbInstance = await Database.load(`sqlite:${DB_NAME}`);
		await dbInstance.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        duration REAL NOT NULL,
        data TEXT NOT NULL,
        category TEXT NOT NULL,
        productivity INTEGER NOT NULL
      );
    `);
		await dbInstance.execute(`CREATE INDEX IF NOT EXISTS idx_timestamp ON events (timestamp);`);
		console.log('Database initialized successfully.');
		return dbInstance;
	} catch (error) {
		console.error('Failed to load or initialize the database:', error);
		throw error;
	}
}

export async function emptyDb(): Promise<void> {
	console.warn('Attempting to empty the events database...');
	try {
		const db = await getDbInstance();
		await db.execute('DELETE FROM events');
		console.log('The events table has been successfully emptied.');
	} catch (error) {
		console.error('Failed to empty the events table:', error);
		throw error;
	}
}

async function getLatestEventTimestamp(): Promise<string | null> {
	const db = await getDbInstance();
	const result = await db.select<Array<{ max_ts: string | null }>>('SELECT MAX(timestamp) as max_ts FROM events');
	return result[0]?.max_ts ?? null;
}

async function insertEvents(events: CategorizedEvent[]): Promise<void> {
	if (events.length === 0) return;
	const db = await getDbInstance();
	try {
		// Note: A transaction would be even faster for bulk inserts, but this is safe and reliable.
		for (const event of events) {
			await db.execute(
				'INSERT OR REPLACE INTO events (id, timestamp, duration, data, category, productivity) VALUES ($1, $2, $3, $4, $5, $6)',
				[
					event.id,
					event.timestamp,
					event.duration,
					JSON.stringify(event.data),
					event.category,
					event.productivity,
				]
			);
		}
		console.log(`Successfully inserted/updated ${events.length} events.`);
	} catch (error) {
		console.error('Failed to insert events into the database:', error);
	}
}

async function getEventsFromDb(start: Date, end: Date): Promise<CategorizedEvent[]> {
	const db = await getDbInstance();
	const result = await db.select<any[]>(
		'SELECT * FROM events WHERE timestamp >= $1 AND timestamp <= $2 ORDER BY timestamp ASC',
		[start.toISOString(), end.toISOString()]
	);
	return result.map((row) => ({ ...row, data: JSON.parse(row.data) }));
}

// =================================================================================
// CORE DATA FETCHING & PROCESSING (ROBUST VERSION)
// =================================================================================

export async function getActivityWatchEvents(start: Date, end: Date): Promise<CategorizedEvent[]> {
	try {
		await getDbInstance();
		const lastLocalTimestampStr = await getLatestEventTimestamp();

		let syncStartDate: Date | null = null;

		if (lastLocalTimestampStr) {
			// Incremental sync: start from the last event we have.
			syncStartDate = new Date(new Date(lastLocalTimestampStr).getTime() + 1);
		} else {
			// Full sync: find the very first event on the server.
			console.log('Local database is empty. Starting full historical sync.');
			const historicalStartDateStr = await fetchFirstEventTimestampFromServer();
			if (historicalStartDateStr) {
				syncStartDate = new Date(historicalStartDateStr);
			}
		}

		// If we have a valid start date and it's before the end of the user's view, start syncing.
		if (syncStartDate && syncStartDate < end) {
			console.log(
				`Starting sync process from ${syncStartDate.toISOString()} to ${end.toISOString()}`
			);
			await syncInChunks(syncStartDate, end);
		} else {
			console.log('No sync needed. Local data is up-to-date.');
		}

		console.log(
			`Sync complete. Querying local DB for user view: ${start.toISOString()} to ${end.toISOString()}`
		);
		return await getEventsFromDb(start, end);
	} catch (error) {
		console.error('A critical error occurred in getActivityWatchEvents:', error);
		return [];
	}
}

/**
 * Fetches data from the server in manageable chunks (e.g., 1 month at a time)
 * to prevent timeouts or server errors on large historical syncs.
 */
async function syncInChunks(syncStart: Date, syncEnd: Date): Promise<void> {
	let currentStart = new Date(syncStart);

	while (currentStart < syncEnd) {
		let currentEnd = new Date(currentStart);
		currentEnd.setMonth(currentEnd.getMonth() + 1); // Set chunk size to 1 month

		// Ensure the chunk does not go past the final sync date
		if (currentEnd > syncEnd) {
			currentEnd = new Date(syncEnd);
		}

		console.log(`   -> Syncing chunk: ${currentStart.toISOString()} to ${currentEnd.toISOString()}`);

		const rawEvents = await fetchEventsFromServer(currentStart, currentEnd);
		if (rawEvents.length > 0) {
			const categorizedEvents = await processEventsWithFastText(rawEvents);
			await insertEvents(categorizedEvents);
		} else {
			console.log('   -> No events in this chunk.');
		}

		// Move to the next chunk
		currentStart = new Date(currentEnd);
	}
}

// =================================================================================
// SERVER & FASTTEXT HELPERS (UNCHANGED)
// =================================================================================

async function fetchFirstEventTimestampFromServer(): Promise<string | null> {
	console.log('Querying server for the first-ever event...');
	try {
		const response = await fetch(AW_API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				timeperiods: ['1970-01-01T00:00:00Z/2999-12-31T23:59:59Z'],
				query: [
					`events = query_bucket("${AW_BUCKET_ID}");`,
					`events = sort_by_timestamp(events);`,
					`events = limit_events(events, 1);`, // ← correct
					`RETURN = events;`,
				],
			}),
		});
		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`Failed to fetch first event. Status: ${response.status}`, errorBody);
			return null;
		}
		const rawData = (await response.json()) as any[][];
		const firstEvent = rawData[0]?.[0];
		if (firstEvent?.timestamp) {
			console.log(`Found first event on server with timestamp: ${firstEvent.timestamp}`);
			return firstEvent.timestamp;
		}
		console.log('Server returned no events, bucket might be empty.');
		return null;
	} catch (error) {
		console.error('Failed to fetch the first event from ActivityWatch server:', error);
		return null;
	}
}

async function fetchEventsFromServer(start: Date, end: Date): Promise<any[]> {
	try {
		const response = await fetch(AW_API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				timeperiods: [`${start.toISOString()}/${end.toISOString()}`],
				query: [`events = query_bucket("${AW_BUCKET_ID}");`, `RETURN = events;`],
			}),
		});
		if (!response.ok) {
			console.error(`Failed to fetch ActivityWatch data. Status: ${response.status}`);
			return [];
		}
		const rawData = (await response.json()) as any[];
		return rawData[0] ?? [];
	} catch (error) {
		console.error('Failed to fetch from ActivityWatch server:', error);
		return [];
	}
}

async function processEventsWithFastText(events: any[]): Promise<CategorizedEvent[]> {
	if (events.length === 0) return [];
	const inputContent = events
		.map(
			(event) =>
				`${(event.data.app || 'other').replace(/\.exe$/i, '')} -- ${
					event.data.title || 'other'
				}`
		)
		.join('\n');
	try {
		await invoke('save_file', { path: FASTTEXT_INPUT_PATH, content: inputContent });
		const rawFastTextOutput: string = await invoke('run_fasttext');
		const categoryLabels = rawFastTextOutput.trim().split('\n').filter(Boolean);
		if (categoryLabels.length !== events.length) {
			console.error(
				`Mismatch: Event count (${events.length}) vs. FastText output count (${categoryLabels.length}).`
			);
		}
		return events.map((event, index) => {
			const { category, productivity } = mapLabelToCategory(
				categoryLabels[index] || '__label__unknown'
			);
			return { ...event, category, productivity };
		});
	} catch (error) {
		console.error('Error during FastText processing:', error);
		return events.map((event) => ({ ...event, category: 'other', productivity: 50 } as CategorizedEvent));
	}
}

function mapLabelToCategory(label: string): { category: ActivityCategory; productivity: number } {
	const labelMatch = label.match(/__label__(\w+)/);
	if (labelMatch && labelMatch[1]) {
		switch (labelMatch[1].toLowerCase()) {
			case 'work':
				return { category: 'work', productivity: 90 };
			case 'study':
				return { category: 'study', productivity: 85 };
			case 'personal':
				return { category: 'personal', productivity: 40 };
			case 'break':
				return { category: 'break', productivity: 20 };
			case 'social':
				return { category: 'social', productivity: 20 };
			default:
				return { category: 'other', productivity: 50 };
		}
	}
	return { category: 'other', productivity: 50 };
}

// Type definitions
interface CategorizedEvent {
	id: number;
	timestamp: string;
	duration: number;
	data: { [key: string]: any };
	category: ActivityCategory;
	productivity: number;
}
type ActivityCategory = 'work' | 'study' | 'personal' | 'break' | 'social' | 'other';
