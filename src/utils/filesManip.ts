import { invoke } from '@tauri-apps/api/core';

// Creates a new file in the specified directory.
export async function createFileApi(dir: string): Promise<void> {
	try {
		const result = await invoke('create_file', { dir });
		if (result === 'error') {
			throw new Error('Failed to create file');
		}
	} catch (error) {
		console.error('Error creating file:', error);
		throw error; // Re-throw the error for further handling
	}
}

// Creates a new folder in the specified directory.
export async function createFolderApi(dir: string): Promise<void> {
	try {
		const result = await invoke('create_folder', { dir });
		if (result === 'error') {
			throw new Error('Failed to create folder');
		}
	} catch (error) {
		console.error('Error creating file:', error);
		throw error; // Re-throw the error for further handling
	}
}

// Renames a file or folder at the given path.
export async function renameApi(path: string, newpath: string): Promise<void> {
	try {
		console.log(`Renaming from ${path} to ${newpath}`);
		const result = await invoke('rename_path', { oldPath: path, newPath: newpath });
		if (result === 'error') {
			throw new Error('Failed to rename file');
		}
	} catch (error) {
		console.error('Error renaming file:', error);
		throw error; // Re-throw the error for further handling
	}
}

// Deletes a file or folder at the given path.
export async function deleteApi(path: string): Promise<void> {
	try {
		const result = await invoke('delete_path', { path });
		if (result === 'error') {
			throw new Error('Failed to delete file');
		}
	} catch (error) {
		console.error('Error creating file:', error);
		throw error; // Re-throw the error for further handling
	}
}

// Saves content to a file at the given path.
export async function saveApi(path: string, content: string): Promise<void> {
	try {
		const result = await invoke('save_file', { path, content });
		if (result === 'error') {
			throw new Error('Failed to save file');
		}
	} catch (error) {
		console.error('Error saving file:', error);
		throw error; // Re-throw the error for further handling
	}
}

// Reads a directory recursively and returns its contents.
export async function readDirApi(path: string): Promise<string[]> {
	try {
		const result = await invoke<string[]>('read_dir_recursive', { path });
		if (!result) {
			throw new Error('Failed to read directory recursively');
		}
		return result;
	} catch (error) {
		console.error('Error creating file:', error);
		throw error; // Re-throw the error for further handling
	}
}

// Moves a file or folder from source to destination.
export async function moveApi(source: string, destination: string): Promise<void> {
	try {
		console.log(`Invoking move_path with source: ${source}, destination: ${destination}`);
		const result = await invoke('move_path', { source, destination });
		if (result === 'error') {
			throw new Error('Failed to move file or folder');
		}
	} catch (error) {
		console.error('Error in moveApi:', error);
		throw error; // Re-throw the error for further handling
	}
}
