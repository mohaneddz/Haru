import { invoke } from '@tauri-apps/api/core';
import type { Document, Video, Tool } from '@/types/home/resource';

export async function loadVideos(parent: string, courseName: string): Promise<Video[]> {
	// console.log('Loading video resources');
	const name = courseName.toLowerCase().replace(/-/g, ' ');
	try {
		const path = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
			parent ? parent + '\\' + name : name
		}\\videos.csv`;
		// console.log(`Loading videos from path: ${path}`);

		const response = await invoke<string>('read_file', { path });
		if (!response) {
			await invoke('create_file', { path });
			throw new Error(`No videos found for course: ${courseName}`);
		}

		// Simple CSV line parser that handles quoted commas
		const parseCSVLine = (line: string) => {
			const regex = /"([^"]*)"|([^,]+)/g;
			const result = [];
			let match;
			while ((match = regex.exec(line)) !== null) {
				result.push(match[1] ?? match[2] ?? '');
			}
			return result;
		};

		const videosList = response
			.split('\n')
			.map((line) => line.trim())
			.filter((line, index) => index > 0 && line.length > 0)
			.map((line) => {
				const [title, img, duration, count, tags, link] = parseCSVLine(line);
				return {
					title: title,
					img: img,
					duration: duration,
					count: parseInt(count, 10),
					tags: tags.split(';').filter(Boolean),
					link: link,
				};
			});

		// console.log(`Loaded:`, videosList);
		return videosList;
	} catch (error) {
		console.log(name);
		console.error(`Failed to load videos for course ${courseName}:`, error);
		return [];
	}
}

export async function loadTools(parent: string, courseName: string): Promise<Tool[]> {
	// console.log('Loading tool resources');
	const name = courseName.toLowerCase().replace(/-/g, ' ');
	try {
		const path = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
			parent ? parent + '\\' + name : name
		}\\tools.csv`;
		// console.log(`Loading tools from path: ${path}`);

		const response = await invoke<string>('read_file', { path });
		if (!response) {
			throw new Error(`No tools found for course: ${courseName}`);
		}

		// Use a CSV parser that respects quoted commas (same approach as loadVideos)
		const parseCSVLine = (line: string) => {
			const regex = /"([^"]*)"|([^,]+)/g;
			const result: string[] = [];
			let match;
			while ((match = regex.exec(line)) !== null) {
				result.push(match[1] ?? match[2] ?? '');
			}
			return result;
		};

		const toolsList = response
			.split('\n')
			.map((line) => line.trim())
			.filter((line, index) => index > 0 && line.length > 0) // skip header + empty
			.map((line) => {
				const [title = '', description = '', link = '', tags = ''] = parseCSVLine(line);
				return {
					title: title.replace(/"/g, ''),
					description: description.replace(/"/g, ''),
					link: link.replace(/"/g, ''),
					tags: tags
						.split(';')
						.filter(Boolean)
						.map((tag) => tag.replace(/"/g, ''))
						.slice(0, 2),
				};
			});

		console.log(`Loaded:`, toolsList);
		return toolsList;
	} catch (error) {
		console.error(`Failed to load tools for course ${courseName}:`, error);
		return [];
	}
}

export async function loadDocuments(parent: string, courseName: string): Promise<Document[]> {
	// console.log('Loading document resources');
	const name = courseName.toLowerCase().replace(/-/g, ' ');
	const documents: Document[] = [];
	const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

	try {
		const csvPath = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
			parent ? parent + '\\' + name : name
		}\\documents.csv`;
		// console.log(`Loading CSV documents from path: ${csvPath}`);

		const csvResponse = await invoke<string>('read_file', { path: csvPath }).catch(() => '');
		if (csvResponse) {
			const parseCSVLine = (line: string) => {
				const regex = /"([^"]*)"|([^,]+)/g;
				const result: string[] = [];
				let match;
				while ((match = regex.exec(line)) !== null) {
					result.push(match[1] ?? match[2] ?? '');
				}
				return result;
			};

			csvResponse
				.split('\n')
				.map((line) => line.trim())
				.filter((line, i) => i > 0 && line.length > 0)
				.forEach((line) => {
					// CSV expected order: title, link, tags, type, local (optional)
					const [title, link, tags, type, local] = parseCSVLine(line);
					documents.push({
						title,
						type: type || 'Lecture',
						link,
						tags: tags.split(';').filter(Boolean),
						local: local ? local.toLowerCase() === 'true' : false,
					});
				});
		}

		// --- Scan local directory ---
		const dirPath = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
			parent ? parent + '\\' + name : name
		}`;
		const exists = await invoke<boolean>('verify_folder', { path: dirPath });
		if (exists) {
			const files = await invoke<string[]>('read_dir_recursive', { path: dirPath, depth: 1 });
			for (const file of files) {
				const isFile = await invoke<boolean>('verify_file', { path: file });
				if (isFile) {
					const ext = file.split('.').pop()?.toLowerCase() ?? '';
					const alreadyAdded = documents.some((doc) => doc.link === file);

					if (!alreadyAdded && ALLOWED_EXTENSIONS.includes(ext)) {
						// Guess type based on filename
						let inferredType = 'Supplement';
						const fname = file.toLowerCase();
						if (fname.includes('lecture')) inferredType = 'Lecture';
						else if (fname.includes('exercise')) inferredType = 'Exercise';
						else if (fname.includes('book')) inferredType = 'Book';

						documents.push({
							title: file.split(/[/\\]/).pop() || file,
							type: inferredType,
							link: file,
							tags: ['Local', ext.toUpperCase()],
							local: true,
						});
					}
				}
			}
		}

		// console.log('Loaded documents:', documents);
		return documents;
	} catch (error) {
		console.error(`Failed to load documents for course ${courseName}:`, error);
		return documents;
	}
}

export async function AppendDocumentsFile(parent: string, courseName: string, documents: Document[]): Promise<boolean> {
	console.log(`Appending documents for course ${courseName}`);
	const name = courseName.toLowerCase().replace(/-/g, ' ');
	try {
		const csvPath = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
			parent ? parent + '\\' + name : name
		}\\documents.csv`;
		const csvContent =
			'\n' +
			documents
				.map((doc) => {
					return `"${doc.title}","${doc.link}","${doc.tags.join(';')}","${doc.type}","${
						doc.local
					}"`;
				})
				.join('\n');

		await invoke('save_file', { path: csvPath, content: csvContent });
		return true;
	} catch (error) {
		console.error(`Failed to append documents for course ${courseName}:`, error);
		return false;
	}
}

export async function AppendVideosFile(parent: string, courseName: string, videos: Video[]): Promise<boolean> {
	console.log(`Appending videos for course ${courseName}`);
	const name = courseName.toLowerCase().replace(/-/g, ' ');
	try {
		const csvPath = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
			parent ? parent + '\\' + name : name
		}\\videos.csv`;
		// CSV columns: title,img,duration,count,tags,link
		const csvContent =
			'\n' +
			videos
				.map((v) => {
					const count =
						typeof v.count === 'number'
							? v.count
							: v.count
							? parseInt(String(v.count), 10) || 0
							: 0;
					const duration = v.duration || '';
					return `"${v.title}","${v.img || ''}","${duration}","${count}","${(
						v.tags || []
					).join(';')}","${v.link || ''}"`;
				})
				.join('\n');

		await invoke('save_file', { path: csvPath, content: csvContent });
		return true;
	} catch (error) {
		console.error(`Failed to append videos for course ${courseName}:`, error);
		return false;
	}
}

export async function AppendToolsFile(parent: string, courseName: string, tools: Tool[]): Promise<boolean> {
	console.log(`Appending tools for course ${courseName}`);
	const name = courseName.toLowerCase().replace(/-/g, ' ');
	try {
		const csvPath = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
			parent ? parent + '\\' + name : name
		}\\tools.csv`;
		const q = (s: string) => `"${(s ?? '').replace(/"/g, '')}"`;

		const csvContent =
			'\n' +
			tools
				.map((t) => {
					const tags = (t.tags ?? []).join(';');
					return [q(t.title ?? ''), q(t.description ?? ''), q(t.link ?? ''), q(tags)].join(',');
				})
				.join('\n');

		await invoke('save_file', { path: csvPath, content: csvContent });
		return true;
	} catch (error) {
		console.error(`Failed to append tools for course ${courseName}:`, error);
		return false;
	}
}
