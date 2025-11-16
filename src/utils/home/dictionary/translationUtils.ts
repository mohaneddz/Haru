import { readFile } from '@/utils/core/appdata';

export async function loadTranslations(): Promise<Translation[]> {
  const content = await readFile('translations.json');
  if (!content) return [];

  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('translations.json does not contain a valid array');
      return [];
    }
  } catch (error) {
    console.error('Failed to parse translations.json:', error);
    return [];
  }
}
