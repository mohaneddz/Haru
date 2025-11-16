import { writeTextFile, readTextFile, BaseDirectory, readDir, remove, rename, mkdir } from '@tauri-apps/plugin-fs';

// Save file to AppData (supports subdirectories)
export async function saveFile(path: string, data: string) {
  try {
    // Ensure the directory exists
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (dir) {
      await createDir(dir);
    }
    await writeTextFile(path, data, { baseDir: BaseDirectory.AppData });
    console.log(`[saveFile] Successfully wrote file: ${path} with data length ${data.length}`);
  } catch (err) {
    console.error(`[saveFile] Failed to write file: ${path}`, err);
  }
}

// Read file from AppData (supports subdirectories)
export async function readFile(path: string) {
  try {
    const content = await readTextFile(path, { baseDir: BaseDirectory.AppData });
    console.log(`[readFile] Successfully read file: ${path}`);
    return content;
  } catch (err) {
    console.warn(`[readFile] File does not exist or failed to read: ${path}`, err);
    return null;
  }
}

// List files in a directory under AppData
export async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readDir(dir, { baseDir: BaseDirectory.AppData });
    return entries.filter(e => e.isFile).map(e => e.name);
  } catch (err) {
    console.warn(`[listFiles] Failed to list files in ${dir}`, err);
    return [];
  }
}

// Delete file from AppData
export async function deleteFile(path: string) {
  try {
    await remove(path, { baseDir: BaseDirectory.AppData });
    console.log(`[deleteFile] Deleted ${path}`);
  } catch (err) {
    console.error(`[deleteFile] Failed to delete ${path}`, err);
  }
}

// Rename file in AppData
export async function renameFile(oldPath: string, newPath: string) {
  try {
    await rename(oldPath, newPath, { oldPathBaseDir: BaseDirectory.AppData, newPathBaseDir: BaseDirectory.AppData });
    console.log(`[renameFile] Renamed ${oldPath} to ${newPath}`);
  } catch (err) {
    console.error(`[renameFile] Failed to rename`, err);
  }
}

// Create directory in AppData
export async function createDir(dir: string) {
  try {
    await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
    console.log(`[createDir] Created directory ${dir}`);
  } catch (err) {
    console.warn(`[createDir] Failed to create ${dir}`, err);
  }
}
