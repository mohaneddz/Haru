import { invoke } from '@tauri-apps/api/core';

// Creates a new file in the specified directory.
export async function createFileApi(dir: string): Promise<void> {
	const result = await invoke('create_file', { dir });
	if (result === 'error') {
		throw new Error('Failed to create file');
	}
	console.log(`File created at: ${result}`);
}

// Creates a new folder in the specified directory.
export async function createFolderApi(dir: string): Promise<void> {
	const result = await invoke('create_folder', { dir });
	if (result === 'error') {
		throw new Error('Failed to create folder');
	}
	console.log(`Folder created at: ${result}`);
}

// Renames a file or folder at the given path.
export async function renameApi(path: string, newName: string): Promise<void> {
	const result = await invoke('rename_node', { path, newName });
	if (result === 'error') {
		throw new Error('Failed to rename file');
	}
	console.log(`File renamed to: ${result}`);
}

// Deletes a file or folder at the given path.
export async function deleteApi(path: string): Promise<void> {
	const result = await invoke('delete_path', { path });
	if (result === 'error') {
		throw new Error('Failed to delete file');
	}
	console.log(`File deleted at: ${result}`);
}

// Saves content to a file at the given path.
export async function saveApi(path: string, content: string): Promise<void> {
	const result = await invoke('save_file', { path, content });
	if (result === 'error') {
		throw new Error('Failed to save file');
	}
	console.log(`File saved at: ${result}`);
}

// Reads a directory recursively and returns its contents.
export async function readDirApi(path: string): Promise<string[]> {
    const result = await invoke<string[]>('read_dir_recursive', { path });
    if (!result) {
        throw new Error('Failed to read directory recursively');
    }
    console.log(`Directory contents: ${result}`);
    return result;
}

// Moves a file or folder from source to destination.
export async function moveApi(source: string, destination: string): Promise<void> {
	const result = await invoke('move_path', { source, destination });
	if (result === 'error') {
		throw new Error('Failed to move file or folder');
	}
	console.log(`Moved from ${source} to ${destination}`);
}
