import { Node, Connection } from '@/types/home/roadmap';

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

export async function loadNodesFromCSV(): Promise<{ nodes: Node[], connections: Connection[] }> {
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
      console.log('Make sure the file exists at: public/data/canvas/nodes.csv');
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
    
    const nodes: Node[] = [];
    const connections: Connection[] = [];
    
    console.log('CSV Header:', firstLine);
    console.log('Number of lines to process:', lines.length - 1);
    
    // Parse each line after the header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const values = parseCSVLine(line);
      
      // Debug log for first few lines
      if (i <= 3) {
        console.log(`Line ${i + 1} parsed values:`, values);
      }
      
      // Ensure we have at least the minimum required columns
      if (values.length < 6) {
        console.warn(`Skipping line ${i + 1}: insufficient columns (${values.length}/6)`, values);
        continue;
      }
      
      const node: Node = {
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
      
      // If there's a connection column (fromNodeId), create connections
      if (values[8] && values[8].trim() !== '') {
        connections.push({
          fromNodeId: values[8].trim(),
          toNodeId: values[0] || `node-${i}`, // Connect to current node
        });
      }
    }
    
    console.log(`Successfully loaded ${nodes.length} nodes and ${connections.length} connections`);
    return { nodes, connections };
  } catch (error) {
    console.error('Failed to load nodes from CSV:', error);
    return { nodes: [], connections: [] };
  }
}