export interface FileChunk {
  startLine: number;
  endLine: number;
  text: string;
}

const WINDOW_SIZE = 60;
const STRIDE = 50; // 10-line overlap

export function chunkFile(content: string): FileChunk[] {
  if (content.trim().length === 0) return [];

  const lines = content.split("\n");

  const chunks: FileChunk[] = [];
  for (let start = 0; start < lines.length; start += STRIDE) {
    const end = Math.min(start + WINDOW_SIZE, lines.length);
    chunks.push({
      startLine: start + 1,
      endLine: end,
      text: lines.slice(start, end).join("\n"),
    });
    if (end === lines.length) break;
  }
  return chunks;
}
