import { invoke } from '@tauri-apps/api/core';

export interface CourseInfo {
	name: string;
	description: string;
	difficulty: string;
	duration: string;
	prerequisites: string[];
	topics: string[];
	image: string;
}

export interface GameInfo extends CourseInfo {
	benefits: string[];
}

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}

	result.push(current.trim());
	return result;
}

export async function loadCourseData(): Promise<{ [key: string]: CourseInfo }> {
	try {
		const response = await fetch('/data/courses/courses.csv');

		if (!response.ok) {
			throw new Error(`Failed to fetch CSV: ${response.status}`);
		}

		const csvText = await response.text();
		const lines = csvText.trim().split('\n');

		if (lines.length < 2) {
			throw new Error('CSV file has no data rows');
		}

		const courseData: { [key: string]: CourseInfo } = {};

		// Parse each line after the header
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			const values = parseCSVLine(line);

			if (values.length < 7) {
				console.warn(`Skipping line ${i + 1}: insufficient columns`);
				continue;
			}

			const course: CourseInfo = {
				name: values[0].replace(/^"|"$/g, ''),
				description: values[1].replace(/^"|"$/g, ''),
				difficulty: values[2].replace(/^"|"$/g, ''),
				duration: values[3].replace(/^"|"$/g, ''),
				prerequisites: values[4].replace(/^"|"$/g, '').split('|').filter(Boolean),
				topics: values[5].replace(/^"|"$/g, '').split('|').filter(Boolean),
				image: values[6].replace(/^"|"$/g, ''),
			};

			courseData[course.name] = course;
		}

		return courseData;
	} catch (error) {
		console.error('Failed to load course data:', error);
		return {};
	}
}

export async function loadCourses(folder: string): Promise<CourseInfo[]> {
	const name = folder.toLocaleLowerCase();
	const path = `D:\\Programming\\Projects\\Tauri\\haru\\school\\${name}`;
	try {
		const response: string[] = await invoke('read_dir_recursive', { path });

		const folders = response.filter((item: string) => item.endsWith('/')).splice(1);
		const metadataFiles = response
			.filter((item: string) => item.endsWith('metadata.json'))
			.map((file) => file.replace(/\\/g, '/'));

		const courses = [];

		for (const folder of folders) {
			const folderName = folder.replace(path, '').replace(/\/$/, '').replace(/\\/g, '');
			const folderpath = folder.replace(/\\/g, '/');
			const metadataFile = metadataFiles.find((file) => file.startsWith(folderpath));

			if (metadataFile) {
				try {
					const metadataResponse = await invoke('read_file', { path: metadataFile });
					if (typeof metadataResponse === 'string') {
						const metadata = JSON.parse(metadataResponse);
						courses.push({
							name: folderName,
							...metadata,
							img: folderpath + metadata.img,
						});
					}
				} catch (error) {
					console.error(`Failed to load metadata for folder ${folderName}:`, error);
				}
			}
		}
		console.log(`Loaded courses from ${path}:`, courses);
		return courses;
	} catch (error) {
		console.error('Failed to load courses:', error);
		return [];
	}
}

export async function loadCourse(courseName: string): Promise<CourseInfo | null> {
	try {
		const response = await fetch(`/data/courses/${courseName}.json`);

		if (!response.ok) {
			throw new Error(`Failed to fetch course: ${response.status}`);
		}

		const courseData = await response.json();
		return courseData;
	} catch (error) {
		console.error('Failed to load course:', error);
		return null;
	}
}
