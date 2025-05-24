import { OpenRouterClient } from "./openrouter-client";
import { VectorStore } from "./vector-store";

export interface RAGResponse {
  content: string;
  sources: Array<{
    documentId: number;
    documentName: string;
    chunkIndex: number;
    similarity: number;
    metadata?: any;
  }>;
}

export class RAGService {
  private openRouterClient: OpenRouterClient;
  private vectorStore: VectorStore;

  constructor() {
    this.openRouterClient = new OpenRouterClient();
    this.vectorStore = new VectorStore();
  }

  async generateResponse(query: string, language = "en"): Promise<RAGResponse> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.openRouterClient.generateEmbedding(query);
      
      // Search for relevant chunks
      const searchResults = await this.vectorStore.searchSimilar(queryEmbedding, 5);
      
      if (searchResults.length === 0) {
        return {
          content: await this.getNoDocumentsResponse(language),
          sources: [],
        };
      }

      // Prepare context from search results
      const context = searchResults
        .map(result => result.chunk.content)
        .join("\n\n");

      // Generate response using OpenRouter
      const systemPrompt = this.getSystemPrompt(language);
      const userPrompt = this.getUserPrompt(query, context);

      const response = await this.openRouterClient.generateCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      let content = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

      // Translate response if needed
      if (language !== "en") {
        content = await this.openRouterClient.translateText(content, language);
      }

      // Prepare sources
      const sources = searchResults.map(result => ({
        documentId: result.chunk.documentId,
        documentName: result.document?.originalName || "Unknown Document",
        chunkIndex: result.chunk.chunkIndex,
        similarity: result.similarity,
        metadata: result.chunk.metadata,
      }));

      return {
        content,
        sources,
      };

    } catch (error) {
      console.error("Error generating RAG response:", error);
      return {
        content: await this.getErrorResponse(language),
        sources: [],
      };
    }
  }

  private getSystemPrompt(language: string): string {
    const basePrompt = `You are a corporate policy advisor AI assistant. Your role is to provide accurate, helpful answers about company policies based on the provided context.

Guidelines:
1. Base your answers strictly on the provided policy documents
2. If the context doesn't contain enough information, clearly state this
3. Maintain a professional, authoritative tone
4. Cite specific policy sections when possible
5. If asked about something not covered in the policies, direct users to consult HR or legal teams
6. Provide clear, actionable guidance when possible
7. Always prioritize accuracy over completeness`;

    if (language !== "en") {
      return basePrompt + `\n\nImportant: Respond in ${language}, but preserve any specific policy terms, section numbers, or official terminology in their original language for accuracy.`;
    }

    return basePrompt;
  }

  private getUserPrompt(query: string, context: string): string {
    return `Based on the following company policy documents, please answer this question: "${query}"

Policy Context:
${context}

Please provide a comprehensive answer based on the policy information above. If the policies don't contain enough information to fully answer the question, please state what additional resources the employee should consult.`;
  }

  private async getNoDocumentsResponse(language: string): string {
    const response = "I don't have access to any policy documents yet. Please upload company policy documents first so I can help answer your questions.";
    
    if (language !== "en") {
      return await this.openRouterClient.translateText(response, language);
    }
    
    return response;
  }

  private async getErrorResponse(language: string): string {
    const response = "I apologize, but I'm experiencing technical difficulties. Please try again later or contact IT support if the problem persists.";
    
    if (language !== "en") {
      return await this.openRouterClient.translateText(response, language);
    }
    
    return response;
  }

  async testConnection(): Promise<{ success: boolean; model: string; provider: string }> {
    try {
      const testMessages = [
        { role: "user", content: "Hello, test connection" }
      ];
      
      const response = await this.openRouterClient.generateCompletion(testMessages, "qwen/qwen-2.5-72b-instruct");
      
      if (response && response.choices && response.choices.length > 0) {
        return {
          success: true,
          model: "Cerebras Llama 3.1 70B",
          provider: "Cerebras via OpenRouter"
        };
      } else {
        throw new Error("Invalid response from API");
      }
    } catch (error) {
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
