export const loadTranslations = async () => {
    const response = await fetch('/data/dictionary/translations.csv');
    if (!response.ok) {
        console.error(`Failed to fetch translation: ${response.status} ${response.statusText}`);
        return [];
    }
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    
    // Skip the header line
    const translations = lines.slice(1).map(line => {
        
        const firstComma = line.indexOf(',');
        const secondComma = line.indexOf(',', firstComma + 1);
        const dateAdded = line.slice(0, firstComma).replace(/^"|"$/g, '');
        const term = line.slice(firstComma + 1, secondComma).replace(/^"|"$/g, '');

        const translation = line.slice(secondComma + 1).replace(/^"|"$/g, '');
        return { dateAdded, term, translation };
    });
    return translations;
};
