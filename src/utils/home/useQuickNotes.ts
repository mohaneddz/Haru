import { listFiles, readFile, saveFile, deleteFile, renameFile, createDir } from '@/utils/core/appdata';

export async function loadQuickNotes(): Promise<string[]> {
	const files = await listFiles('quick_notes');
	const mdFiles = files.filter((item: string) => item.endsWith('.md'));
	let notes: string[] = [];
	for (const file of mdFiles) {
		try {
			const content: string | null = await readFile(`quick_notes/${file}`);
			notes.push(content || '');
		} catch (error) {
			console.error('Error reading file:', error);
			notes.push(''); // Add empty note if reading fails
		}
	}
	return notes;
}

export async function saveApi(file: string, content: string): Promise<void> {
	saveFile(file, content);
}

export async function setQuicknotes(): Promise<void> {
	// This might need adjustment if used elsewhere, but for now, keep as is or remove if not needed
	console.log('setQuicknotes called, but not implemented for AppData');
}

export async function deleteQuicknotes(indices: boolean[]): Promise<void> {
	// Get indices to delete, sorted in descending order
	const indicesToDelete = indices
		.map((value, index) => value ? index : -1)
		.filter(index => index !== -1)
		.sort((a, b) => b - a);

	if (indicesToDelete.length === 0) return;

	// Delete all selected files first
	for (const index of indicesToDelete) {
		const filePath = `quick_notes/note_${index}.md`;
		await deleteFile(filePath);
		console.log(`Deleted ${filePath}`);
	}

	// Now rename remaining files to fill gaps
	let newIndex = 0;
	let currentIndex = 0;
	
	while (true) {
		// Skip deleted indices
		while (indicesToDelete.includes(currentIndex)) {
			currentIndex++;
		}
		
		const currentFilePath = `quick_notes/note_${currentIndex}.md`;
		
		// Check if file exists
		const content = await readFile(currentFilePath);
		if (content === null) {
			// No more files exist
			break;
		}
		
		// If current index doesn't match new index, rename the file
		if (currentIndex !== newIndex) {
			const newFilePath = `quick_notes/note_${newIndex}.md`;
			await renameFile(currentFilePath, newFilePath);
			console.log(`Renamed ${currentFilePath} to ${newFilePath}`);
		}
		
		newIndex++;
		currentIndex++;
	}
}

export async function createQuicknote(number: number): Promise<void> {
	await createDir('quick_notes');
	const path = `quick_notes/note_${number}.md`;
	await saveFile(path, '');
}