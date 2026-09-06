export interface IndexedChunk {
  filePath: string;
  startLine: number;
  endLine: number;
  repo: string;
  sha: string;
  content: string;
}

export type IndexJobState = "pending" | "running" | "done" | "error";

export interface IndexJobStatus {
  status: IndexJobState;
  totalFiles: number;
  doneFiles: number;
  error?: string;
}

export interface IndexableFile {
  path: string;
  sha: string;
  size: number;
}

export interface IndexJobDoc {
  status: IndexJobState;
  files: IndexableFile[];
  nextIndex: number;
  totalFiles: number;
  doneFiles: number;
  error?: string;
}
