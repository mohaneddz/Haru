import { invoke } from '@tauri-apps/api/core';

export interface CourseInfo {
	title: string;
	description: string;
	difficulty: string;
	duration: string;
	overview: string;
	prerequisites: string[];
	topics: { [key: string]: string[] }[];
	tags?: string[];
	img: string;
}

export interface GameInfo extends CourseInfo {
	benefits: string[];
}

export async function loadCourseData(parent: string, course: string): Promise<CourseInfo> {
	try {
		const path = `D:\\Programming\\Projects\\Tauri\\haru\\school\\${parent}\\${course}`;
		const fullpath = `${path}\\metadata.json`;
		// console.log('Path:', fullpath);
		const metadataResponse = await invoke('read_file', { path: fullpath });
		// console.log('Metadata Response:', metadataResponse);

		if (typeof metadataResponse !== 'string') {
			throw new Error('Failed to read metadata file');
		}

		const metadata = JSON.parse(metadataResponse);

		// Process metadata to populate courseData
		const courseData = {
			title: metadata.title,
			description: metadata.description,
			difficulty: metadata.difficulty,
			duration: metadata.duration,
			prerequisites: metadata.prerequisites,
			topics: metadata.topics,
			tags: metadata.tags,
			img: path + '/' + metadata.img,
			overview: metadata.overview,
		};
		console.log(`Loaded course data : `, courseData);
		return courseData;
	} catch (error) {
		console.error('Failed to load course data:', error);
		return {} as CourseInfo;
	}
}

export async function loadCourses(folder: string): Promise<CourseInfo[]> {
	const title = folder.toLocaleLowerCase();
	const path = `D:\\Programming\\Projects\\Tauri\\haru\\school\\${title}`;
	try {
		const response: string[] = await invoke('read_dir_recursive', { path });

		const folders = response.filter((item: string) => item.endsWith('/')).splice(1);
		const metadataFiles = response
			.filter((item: string) => item.endsWith('metadata.json'))
			.map((file) => file.replace(/\\/g, '/'));

		const courses = [];

		for (const folder of folders) {
			const foldertitle = folder.replace(path, '').replace(/\/$/, '').replace(/\\/g, '');
			const folderpath = folder.replace(/\\/g, '/');
			const metadataFile = metadataFiles.find((file) => file.startsWith(folderpath));

			if (metadataFile) {
				try {
					const metadataResponse = await invoke('read_file', { path: metadataFile });
					if (typeof metadataResponse === 'string') {
						const metadata = JSON.parse(metadataResponse);
						courses.push({
							title: foldertitle,
							...metadata,
							img: folderpath + metadata.img,
						});
					}
				} catch (error) {
					console.error(`Failed to load metadata for folder ${foldertitle}:`, error);
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

export async function loadCoursesSections(): Promise<string[]> {
	const path = `D:\\Programming\\Projects\\Tauri\\haru\\school`;

	try {
		const response: string[] = await invoke('read_dir_recursive', { path, depth: 2 });
		const sections = response
			.filter((item: string) => item.endsWith('/'))
			.map((item) => item.replace(path, '').replace(/\/$/, '').replace(/\\/g, ''))
			.filter((item) => item !== '');
		console.log(`Loaded sections from ${path}:`, sections);
		return sections;
	} catch (error) {
		console.error('Failed to load course sections:', error);
		return [];
	}
}

export async function loadCourse(coursetitle: string): Promise<CourseInfo | null> {
	try {
		const response = await fetch(`/data/courses/${coursetitle}.json`);

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
