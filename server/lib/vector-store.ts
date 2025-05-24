import { storage } from "../storage";
import type { DocumentChunk } from "@shared/schema";

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
  document?: {
    id: number;
    originalName: string;
    filename: string;
  };
}

export class VectorStore {
  async searchSimilar(queryEmbedding: number[], limit = 5): Promise<SearchResult[]> {
    try {
      // Get all chunks from storage
      const documents = await storage.getDocuments();
      const readyDocuments = documents.filter(doc => doc.status === "ready");
      
      const allChunks: DocumentChunk[] = [];
      for (const doc of readyDocuments) {
        const chunks = await storage.getDocumentChunks(doc.id);
        allChunks.push(...chunks);
      }

      // Calculate similarity scores
      const results: SearchResult[] = [];
      
      for (const chunk of allChunks) {
        if (!chunk.embedding) continue;
        
        try {
          const chunkEmbedding = JSON.parse(chunk.embedding);
          const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
          
          const document = documents.find(doc => doc.id === chunk.documentId);
          
          results.push({
            chunk,
            similarity,
            document: document ? {
              id: document.id,
              originalName: document.originalName,
              filename: document.filename,
            } : undefined,
          });
        } catch (error) {
          console.error(`Error parsing embedding for chunk ${chunk.id}:`, error);
          continue;
        }
      }

      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
        
    } catch (error) {
      console.error("Error searching vector store:", error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  async getVectorCount(): Promise<number> {
    try {
      const documents = await storage.getDocuments();
      const readyDocuments = documents.filter(doc => doc.status === "ready");
      return readyDocuments.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0);
    } catch (error) {
      console.error("Error getting vector count:", error);
      return 0;
    }
  }
}
