import { apiRequest } from "./queryClient";

export interface RAGQuery {
  query: string;
  language?: string;
  sessionId: string;
}

export interface RAGResponse {
  userMessage: {
    id: number;
    content: string;
    role: string;
    timestamp: string;
  };
  assistantMessage: {
    id: number;
    content: string;
    role: string;
    timestamp: string;
    sources: Array<{
      documentId: number;
      documentName: string;
      chunkIndex: number;
      similarity: number;
      metadata?: any;
    }> | null;
  };
}

export class RAGClient {
  async sendQuery(query: RAGQuery): Promise<RAGResponse> {
    const response = await apiRequest(
      "POST",
      `/api/conversations/${query.sessionId}/messages`,
      {
        content: query.query,
        language: query.language,
      }
    );
    
    return response.json();
  }

  async getConversationHistory(sessionId: string) {
    const response = await apiRequest(
      "GET",
      `/api/conversations/${sessionId}/messages`
    );
    
    return response.json();
  }

  async createConversation(sessionId: string, language = "en") {
    const response = await apiRequest("POST", "/api/conversations", {
      sessionId,
      language,
    });
    
    return response.json();
  }
}

export const ragClient = new RAGClient();
