import { oldNode, Connection } from '@/types/home/roadmap';
import { invoke } from '@tauri-apps/api/core';

// Interface for a single concept from the backend response
export interface BackendConcept {
	name: string;
	description: string;
	dependencies: string[];
	subtopic_number: string;
	date_learned: string | null;
}

// Interface for the entire JSON object from the backend
export interface BackendResponse {
	concepts: BackendConcept[];
	[key: string]: any;
}

export function processConceptData(data: BackendResponse): { nodes: oldNode[]; connections: Connection[] } {
	const nodes: oldNode[] = [];
	const connections: Connection[] = [];

	if (!data.concepts || !Array.isArray(data.concepts)) {
		console.error("Backend data does not contain a 'concepts' array.");
		return { nodes: [], connections: [] };
	}

	// Build resolvers so dependencies can be matched by subtopic_number or name
	const normalizeName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
	const sanitizeId = (s: string) => s.trim().replace(/[^\d.]/g, ''); // keep digits and dots

	const idBySubtopic = new Map<string, string>();
	const idByName = new Map<string, string>();
	for (const c of data.concepts) {
		const id = (c.subtopic_number || '').trim();
		if (!id) continue;
		const sanitized = sanitizeId(id);
		idBySubtopic.set(id, id);
		if (sanitized) idBySubtopic.set(sanitized, id);
		if (c.name) idByName.set(normalizeName(c.name), id);
	}

	const resolveDependency = (depRaw: string): string | null => {
		if (!depRaw) return null;
		const raw = depRaw.trim();
		const byExact = idBySubtopic.get(raw);
		if (byExact) return byExact;
		const bySan = idBySubtopic.get(sanitizeId(raw));
		if (bySan) return bySan;
		const byName = idByName.get(normalizeName(raw));
		if (byName) return byName;
		return null;
	};

	// --- Hierarchical Layout Algorithm ---
	const horizontalSpacing = 250;
	const verticalSpacing = 180;

	// Group concepts by major topic number (e.g., '1' from '1.1')
	const groupedConcepts = new Map<number, BackendConcept[]>();
	data.concepts.forEach((concept) => {
		const major = Math.floor(parseFloat(concept.subtopic_number));
		if (!isNaN(major)) {
			if (!groupedConcepts.has(major)) {
				groupedConcepts.set(major, []);
			}
			groupedConcepts.get(major)!.push(concept);
		}
	});

	// Sort groups by major number
	const sortedGroups = Array.from(groupedConcepts.entries()).sort((a, b) => a[0] - b[0]);

	// Keep a set to deduplicate connections
	const seen = new Set<string>();

	// Place nodes and build connections
	sortedGroups.forEach(([major, conceptsInGroup]) => {
		conceptsInGroup.sort((a, b) => parseFloat(a.subtopic_number) - parseFloat(b.subtopic_number));

		const numNodesInRow = conceptsInGroup.length;
		const rowWidth = (numNodesInRow - 1) * horizontalSpacing;
		const startX = -rowWidth / 2;
		const y = (major - 1) * verticalSpacing;

		conceptsInGroup.forEach((concept, index) => {
			const node: oldNode = {
				id: concept.subtopic_number,
				text: concept.name,
				details: concept.description,
				x: startX + index * horizontalSpacing,
				y: y,
				width: 180,
				height: 80,
				learned: !!concept.date_learned,
				learnedDate: concept.date_learned ? new Date(concept.date_learned) : undefined,
			};
			nodes.push(node);
		});
	});

	// Create connections after all nodes are placed so resolution works across groups
	data.concepts.forEach((concept) => {
		if (!concept.dependencies || concept.dependencies.length === 0) return;
		for (const depRaw of concept.dependencies) {
			const from = resolveDependency(depRaw);
			const to = concept.subtopic_number;
			if (!from || !to || from === to) continue;
			const key = `${from}->${to}`;
			if (seen.has(key)) continue;
			seen.add(key);
			connections.push({ fromNodeId: from, toNodeId: to });
		}
	});

	console.log(`Processed ${nodes.length} nodes and ${connections.length} connections with hierarchical layout.`);
	return { nodes, connections };
}

export async function loadConceptsData(parent: string, courseName: string) {
	const name = courseName.toLowerCase().replace(/-/g, ' ');
	const dirPath = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
		parent ? parent + '\\' + name : name
	}`;
	const filePath = `${dirPath}\\concepts.json`;

	try {
		// Check if file exists first
		const exists = await invoke<boolean>('verify_file', { path: filePath });
		if (!exists) {
			// Initialize concepts.json as an empty array
			await invoke('create_file', { dir: dirPath, name: 'concepts.json', data: '[]' });
			return [];
		}

		const response = await invoke<string>('read_file', { path: filePath });
		const conceptsList = JSON.parse(response);
		if (!Array.isArray(conceptsList)) {
			throw new Error(`Invalid concepts data for course: ${courseName}`);
		}
		console.log(`Loaded concepts for course ${courseName}:`, conceptsList);
		return conceptsList;
	} catch (error) {
		console.error(`Failed to load concepts for course ${courseName}:`, error);
		return [];
	}
}

export async function saveConceptsData(parent: string, courseName: string, concepts: BackendConcept[]) {
	const name = courseName.toLowerCase().replace(/-/g, ' ');
	const dirPath = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
		parent ? parent + '\\' + name : name
	}`;

	try {
		const data = JSON.stringify(concepts, null, 2);
		await invoke('create_file', { dir: dirPath, name: 'concepts.json'});
		await invoke('save_file', { path: `${dirPath}\\concepts.json`, content: data });
		console.log(`Saved concepts for course ${courseName}:`, concepts);
	} catch (error) {
		console.error(`Failed to save concepts for course ${courseName}:`, error);
	}
}

// like load videos :
// try {
//     const path = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${
//       parent ? parent + '\\' + name : name
//     }\\videos.csv`;
//     // console.log(`Loading videos from path: ${path}`);

//     const response = await invoke<string>('read_file', { path });
//     if (!response) {
//       await invoke('create_file', { path });
//       throw new Error(`No videos found for course: ${courseName}`);
//     }

//     // Simple CSV line parser that handles quoted commas
//     const parseCSVLine = (line: string) => {
//       const regex = /"([^"]*)"|([^,]+)/g;
//       const result = [];
//       let match;
//       while ((match = regex.exec(line)) !== null) {
//         result.push(match[1] ?? match[2] ?? '');
//       }
//       return result;
//     };

//     const videosList = response
//       .split('\n')
//       .map((line) => line.trim())
//       .filter((line, index) => index > 0 && line.length > 0)
//       .map((line) => {
//         const [title, img, duration, count, tags, link] = parseCSVLine(line);
//         return {
//           title: title,
//           img: img,
//           duration: duration,
//           count: parseInt(count, 10),
//           tags: tags.split(';').filter(Boolean),
//           link: link as UrlString,
//         };
//       });

//     // console.log(`Loaded:`, videosList);
//     return videosList;
//   } catch (error) {
//     console.log(name);
//     console.error(`Failed to load videos for course ${courseName}:`, error);
//     return [];
//   }
