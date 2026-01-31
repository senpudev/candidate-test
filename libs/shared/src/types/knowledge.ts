// Semantic search result (RAG / searchSimilar).
export interface SearchResult {
  content: string;
  courseId: string;
  score: number;
  chunkIndex?: number;
  metadata?: {
    pageNumber?: number;
    section?: string;
  };
}
