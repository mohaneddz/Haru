import { oldNode, Connection } from '@/types/home/roadmap';

// Interface for a single concept from the backend response
export interface BackendConcept {
  name: string;
  description: string;
  dependencies: string[];
  subtopic_number: string;
  date_learned: string | null;
}

// Interface for the entire JSON object from the backend
export interface BackendResponse {
  concepts: BackendConcept[];
  [key: string]: any; // Allows for other properties like error, message, etc.
}


export function processConceptData(data: BackendResponse): { nodes: oldNode[], connections: Connection[] } {
  const nodes: oldNode[] = [];
  const connections: Connection[] = [];

  if (!data.concepts || !Array.isArray(data.concepts)) {
    console.error("Backend data does not contain a 'concepts' array.");
    return { nodes: [], connections: [] };
  }

  // Build resolvers so dependencies can be matched by subtopic_number or name
  const normalizeName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const sanitizeId = (s: string) => s.trim().replace(/[^\d.]/g, ''); // keep digits and dots

  const idBySubtopic = new Map<string, string>();
  const idByName = new Map<string, string>();
  for (const c of data.concepts) {
    const id = (c.subtopic_number || '').trim();
    if (!id) continue;
    const sanitized = sanitizeId(id);
    idBySubtopic.set(id, id);
    if (sanitized) idBySubtopic.set(sanitized, id);
    if (c.name) idByName.set(normalizeName(c.name), id);
  }

  const resolveDependency = (depRaw: string): string | null => {
    if (!depRaw) return null;
    const raw = depRaw.trim();
    const byExact = idBySubtopic.get(raw);
    if (byExact) return byExact;
    const bySan = idBySubtopic.get(sanitizeId(raw));
    if (bySan) return bySan;
    const byName = idByName.get(normalizeName(raw));
    if (byName) return byName;
    return null;
  };

  // --- Hierarchical Layout Algorithm ---
  const horizontalSpacing = 250;
  const verticalSpacing = 180;

  // Group concepts by major topic number (e.g., '1' from '1.1')
  const groupedConcepts = new Map<number, BackendConcept[]>();
  data.concepts.forEach(concept => {
    const major = Math.floor(parseFloat(concept.subtopic_number));
    if (!isNaN(major)) {
      if (!groupedConcepts.has(major)) {
        groupedConcepts.set(major, []);
      }
      groupedConcepts.get(major)!.push(concept);
    }
  });

  // Sort groups by major number
  const sortedGroups = Array.from(groupedConcepts.entries()).sort((a, b) => a[0] - b[0]);

  // Keep a set to deduplicate connections
  const seen = new Set<string>();

  // Place nodes and build connections
  sortedGroups.forEach(([major, conceptsInGroup]) => {
    conceptsInGroup.sort((a, b) => parseFloat(a.subtopic_number) - parseFloat(b.subtopic_number));

    const numNodesInRow = conceptsInGroup.length;
    const rowWidth = (numNodesInRow - 1) * horizontalSpacing;
    const startX = -rowWidth / 2;
    const y = (major - 1) * verticalSpacing;

    conceptsInGroup.forEach((concept, index) => {
      const node: oldNode = {
        id: concept.subtopic_number,
        text: concept.name,
        details: concept.description,
        x: startX + index * horizontalSpacing,
        y: y,
        width: 180,
        height: 80,
        learned: !!concept.date_learned,
        learnedDate: concept.date_learned ? new Date(concept.date_learned) : undefined,
      };
      nodes.push(node);
    });
  });

  // Create connections after all nodes are placed so resolution works across groups
  data.concepts.forEach(concept => {
    if (!concept.dependencies || concept.dependencies.length === 0) return;
    for (const depRaw of concept.dependencies) {
      const from = resolveDependency(depRaw);
      const to = concept.subtopic_number;
      if (!from || !to || from === to) continue;
      const key = `${from}->${to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      connections.push({ fromNodeId: from, toNodeId: to });
    }
  });

  console.log(`Processed ${nodes.length} nodes and ${connections.length} connections with hierarchical layout.`);
  return { nodes, connections };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export async function loadNodesFromCSV(): Promise<{ nodes: oldNode[], connections: Connection[] }> {
  try {
    // Load the CSV file from the data folder
    const response = await fetch('/data/canvas/nodes.csv');
    
    if (!response.ok) {
      console.error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      console.error('Response URL:', response.url);
      return { nodes: [], connections: [] };
    }

    const csvText = await response.text();
    
    // Check if we got HTML instead of CSV (common when file doesn't exist)
    if (csvText.trim().startsWith('<')) {
      console.error('Received HTML instead of CSV - file likely doesn\'t exist at /data/canvas/nodes.csv');
      // console.log('Make sure the file exists at: public/data/canvas/nodes.csv');
      return { nodes: [], connections: [] };
    }
    
    if (!csvText.trim()) {
      console.warn('CSV file is empty');
      return { nodes: [], connections: [] };
    }
    
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      console.warn('CSV file has no data rows');
      return { nodes: [], connections: [] };
    }

    // Check if first line looks like a CSV header
    const firstLine = lines[0];
    if (!firstLine.includes('id') || !firstLine.includes('text')) {
      console.error('First line doesn\'t look like a proper CSV header:', firstLine);
      return { nodes: [], connections: [] };
    }
    
    const nodes: oldNode[] = [];
    const connections: Connection[] = [];
    
    // console.log('CSV Header:', firstLine);
    // console.log('Number of lines to process:', lines.length - 1);
    
    // Parse each line after the header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);

      // Ensure we have at least the minimum required columns
      if (values.length < 6) {
        console.warn(`Skipping line ${i + 1}: insufficient columns (${values.length}/6)`, values);
        continue;
      }
      
      const node: oldNode = {
        id: values[0] || `node-${i}`,
        text: (values[1] || 'Untitled').replace(/^"|"$/g, ''), // Remove surrounding quotes
        x: parseFloat(values[2]) || 0,
        y: parseFloat(values[3]) || 0,
        width: parseFloat(values[4]) || 150,
        height: parseFloat(values[5]) || 70,
        learned: values[6] === 'true',
        learnedDate: values[7] && values[7] !== '' ? new Date(values[7]) : undefined,
      };
      
      nodes.push(node);

      // If there's a connection column, it may contain multiple ids separated by ';' or '|'
      if (values[8] && values[8].trim() !== '') {
        const raw = values[8].replace(/^"|"$/g, '').trim();
        const deps = raw.split(/[;|]/).map(s => s.trim()).filter(Boolean);
        if (deps.length === 0 && raw) deps.push(raw); // fallback to single id if no separators
        for (const depId of deps) {
          connections.push({
            fromNodeId: depId,
            toNodeId: node.id,
          });
        }
      }
    }
    
    // console.log(`Successfully loaded ${nodes.length} nodes and ${connections.length} connections`);
    return { nodes, connections };
  } catch (error) {
    console.error('Failed to load nodes from CSV:', error);
    return { nodes: [], connections: [] };
  }
}
