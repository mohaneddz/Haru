export const loadDefinitions = async () => {
    const response = await fetch('/data/dictionary/definitions.csv');
    if (!response.ok) {
        console.error(`Failed to fetch definitions: ${response.status} ${response.statusText}`);
        return [];
    }
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    
    // Skip the header line
    const definitions = lines.slice(1).map(line => {
        const [dateAdded, term, definition] = line.split(',');
        return { dateAdded, term, definition };
    });
    return definitions;
};
