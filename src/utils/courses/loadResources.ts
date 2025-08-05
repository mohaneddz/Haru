import { invoke } from '@tauri-apps/api/core';

interface VideoInfo {
	title: string;
	link: string;
	thumbnailUrl: string;
	duration: string;
	tags: string[];
}

// title,description,link,thumbnailUrl,tags
interface ToolInfo {
	title: string;
	description: string;
	link: string;
	thumbnailUrl: string;
	tags: string[];
}

export async function loadVideos(parent: string, courseName: string): Promise<VideoInfo[]> {
	const name = courseName.toLocaleLowerCase();
	try {
		const path = `D:\\Programming\\Projects\\Tauri\\haru\\school\\${
			parent ? parent + '\\' + name : name
		}\\videos.csv`;
		console.log(`Loading videos from path: ${path}`);

		const response = await invoke<string>('read_file', { path });
		if (!response) {
			throw new Error(`No videos found for course: ${courseName}`);
		}

		const videosList = response
			.split('\n') // Correct newline character
			.map((line) => line.trim())
			.filter((line, index) => index > 0 && line.length > 0) 
			.map((line) => {
				const [title, link, thumbnailUrl, duration, tags] = line.split(',');
				return { title, link, thumbnailUrl, duration, tags: tags.split(';').filter(Boolean) };
			});

		console.log(`Loaded:`, videosList);
		return videosList;
	} catch (error) {
		console.error(`Failed to load videos for course ${courseName}:`, error);
		return [];
	}
}

export async function loadTools(parent: string, courseName: string): Promise<ToolInfo[]> {
	const name = courseName.toLocaleLowerCase();
	try {
		const path = `D:\\Programming\\Projects\\Tauri\\haru\\school\\${
			parent ? parent + '\\' + name : name
		}\\tools.csv`;
		console.log(`Loading tools from path: ${path}`);

		const response = await invoke<string>('read_file', { path });
		if (!response) {
			throw new Error(`No tools found for course: ${courseName}`);
		}

		const toolsList = response
			.split('\n')
			.map((line) => line.trim())
			.filter((line, index) => index > 0 && line.length > 0) 
			.map((line) => {
				const [title, description, link, thumbnailUrl, tags] = line.split(',');
				return { title, description, link, thumbnailUrl, tags: tags.split(';').filter(Boolean) };
			});

		console.log(`Loaded tools:`, toolsList);
		return toolsList;
	} catch (error) {
		console.error(`Failed to load tools for course ${courseName}:`, error);
		return [];
	}
}
