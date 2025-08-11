interface MessageProps {
  id?: number;
  text: string;
  user: boolean;
}
interface SourceData {
  path?: string;
  score_range?: [number, number];
  prompt_indices?: number[];
  title?: string;
  url?: string;
}

// Main interface for chat messages, now includes optional sources
interface MessageData {
  id: number;
  text: string;
  user: boolean;
  rawText?: string;
  sources?: SourceData[];
}