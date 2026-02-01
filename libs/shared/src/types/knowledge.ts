// Semantic search result (RAG / searchSimilar).
export interface SearchResult {
  content: string;
  courseId: string;
  score: number;
  chunkIndex?: number;
  sourceFile?: string;
  metadata?: {
    pageNumber?: number;
    section?: string;
  };
}
