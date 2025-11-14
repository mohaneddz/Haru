import { invoke } from '@tauri-apps/api/core';

export async function loadQuickNotes(): Promise<string[]> {
	const response = (await invoke('read_dir_recursive', {
		path: 'D:\\Programming\\Tauri\\haru\\src-tauri\\documents\\Notes',
	})) as string[];
	const files = response.filter((item: string) => item.endsWith('.md'));
	let notes: string[] = [];
	for (const file of files) {
		try {
			const content: string = await invoke('read_file', { path: file });
			notes.push(content);
		} catch (error) {
			console.error('Error reading file:', error);
			notes.push(''); // Add empty note if reading fails
		}
	}
	return notes;
}

export async function saveApi(file: string, content: string): Promise<void> {
	invoke('save_file', { file, content })
		.then(() => console.log(`Saved ${file} with content:`, content))
		.catch((err) => console.error(`Error saving ${file}:`, err));
}

export async function setQuicknotes(updater: (prev: string[]) => string[]): Promise<void> {
	invoke('update_quicknotes', { updater })
		.then(() => console.log('Quicknotes updated'))
		.catch((err) => console.error('Error updating quicknotes:', err));
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
		const filePath = `D:\\Programming\\Tauri\\haru\\src-tauri\\documents\\Notes\\note_${index}.md`;
		try {
			await invoke('delete_path', { path: filePath });
			console.log(`Deleted note_${index}.md`);
		} catch (err) {
			console.error(`Error deleting note_${index}.md:`, err);
		}
	}

	// Now rename remaining files to fill gaps
	let newIndex = 0;
	let currentIndex = 0;
	
	while (true) {
		// Skip deleted indices
		while (indicesToDelete.includes(currentIndex)) {
			currentIndex++;
		}
		
		const currentFilePath = `D:\Programming\Tauri\haru\src-tauri\documents\Notes\\note_${currentIndex}.md`;
		
		// Check if file exists
		try {
			await invoke('read_file', { path: currentFilePath });
		} catch {
			// No more files exist
			break;
		}
		
		// If current index doesn't match new index, rename the file
		if (currentIndex !== newIndex) {
			const newFilePath = `D:\Programming\Tauri\haru\src-tauri\documents\Notes\\note_${newIndex}.md`;
			try {
				await invoke('rename_path', { oldPath: currentFilePath, newPath: newFilePath });
				console.log(`Renamed note_${currentIndex}.md to note_${newIndex}.md`);
			} catch (err) {
				console.error(`Error renaming note_${currentIndex}.md:`, err);
			}
		}
		
		newIndex++;
		currentIndex++;
	}
}

export async function createQuicknote(number: number): Promise<void> {
	const path = 'D:\Programming\Tauri\haru\src-tauri\documents\Notes' + `\\note_${number}.md`;
	await invoke('save_file', { path, content: '' });
}