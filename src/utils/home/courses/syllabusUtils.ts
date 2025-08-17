import { invoke } from '@tauri-apps/api/core';
import type { Syllabus } from '@/types/home/library';

// Define the Chapter type for better clarity, if it's not already globally available
type Chapter = Record<string, Array<Record<string, string>>>;

export async function loadSyllabusFile(parent: string, courseName: string): Promise<Chapter[] | null> {
    const name = courseName.toLowerCase().replace(/-/g, ' ');
    const path = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${parent ? parent + '\\' + name : name}\\metadata.json`;
    
    try {
        console.log(path);
        if (!(await invoke('verify_file', { path }))) {
            console.log(`File not found, creating new file at ${path}`);
            // Ensure you are creating a file with valid initial JSON content if needed
            await invoke('create_file', { dir: path, name: 'metadata.json', content: JSON.stringify({ syllabus: [] }, null, 2) });
        }
        
        const response = await invoke('read_file', { path });
        const data = response && typeof response === 'string' ? JSON.parse(response) : null;
        // Directly return the syllabus array
        return data?.syllabus || [];
    } catch (error) {
        console.error('Error loading syllabus file:', error);
        return null;
    }
}

export async function saveSyllabusFile(parent: string, courseName: string, dataToSave: Syllabus): Promise<void> {
    const name = courseName.toLowerCase().replace(/-/g, ' ');
    const path = `D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents\\Modules\\${parent ? parent + '\\' + name : name}\\metadata.json`;

    try {
        const response = await invoke('read_file', { path });
        let existingData = {};
        if (response && typeof response === 'string') {
            try {
                existingData = JSON.parse(response);
            } catch (e) {
                console.error("Could not parse existing metadata.json, it might be corrupted or empty. Overwriting.", e);
            }
        }
        
        // Merge the new syllabus into the existing data
        const updatedData = { ...existingData, syllabus: dataToSave.syllabus };
        
        await invoke('save_file', { path, content: JSON.stringify(updatedData, null, 2) });
        
    } catch (error) {
        console.error('Error saving syllabus file:', error);
    }
}