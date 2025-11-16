import { readFile } from '@/utils/core/appdata';

export async function loadDefinitions(): Promise<Definition[]> {
  const content = await readFile('definitions.json');
  if (!content) return [];

  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('definitions.json does not contain a valid array');
      return [];
    }
  } catch (error) {
    console.error('Failed to parse definitions.json:', error);
    return [];
  }
}
