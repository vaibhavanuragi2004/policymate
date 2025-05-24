import { storage } from "../storage";
import { OpenRouterClient } from "./openrouter-client";

export class DocumentProcessor {
  private openRouterClient: OpenRouterClient;

  constructor() {
    this.openRouterClient = new OpenRouterClient();
  }

  async processDocument(documentId: number, buffer: Buffer): Promise<void> {
    try {
      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Extract text from document
      const text = await this.extractText(buffer, document.mimeType);
      
      // Split into chunks
      const chunks = this.splitIntoChunks(text);
      
      // Process each chunk
      let processedChunks = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding for the chunk
        const embedding = await this.openRouterClient.generateEmbedding(chunk);
        
        // Store chunk in database
        await storage.createDocumentChunk({
          documentId,
          content: chunk,
          chunkIndex: i,
          embedding: JSON.stringify(embedding),
          metadata: { page: Math.floor(i / 3) + 1, section: i }, // Simple metadata
        });
        
        processedChunks++;
      }

      // Update document status
      await storage.updateDocumentStatus(documentId, "ready", processedChunks);
      
    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      await storage.updateDocumentStatus(
        documentId, 
        "error", 
        undefined, 
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    // Simple text extraction - in production, use libraries like pdf-parse, mammoth, etc.
    if (mimeType === "application/pdf") {
      // For now, return mock text for PDF
      return this.mockPolicyText();
    } else if (mimeType.includes("word")) {
      // For now, return mock text for Word docs
      return this.mockPolicyText();
    } else {
      // Try to extract as plain text
      return buffer.toString('utf-8');
    }
  }

  private splitIntoChunks(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);
      
      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + chunkSize * 0.5) {
          chunk = text.slice(start, breakPoint + 1);
          start = breakPoint + 1 - overlap;
        } else {
          start = end - overlap;
        }
      } else {
        start = end;
      }
      
      chunks.push(chunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  private mockPolicyText(): string {
    return `
Employee Remote Work Policy

1. OVERVIEW
This policy outlines the guidelines for remote work arrangements for all employees of the company.

2. ELIGIBILITY
International employees are eligible for remote work with the following requirements:
- Must maintain overlap with core business hours (9 AM - 3 PM local time)
- Require manager approval for remote work arrangements
- Must have reliable internet connection and appropriate workspace
- Tax and legal compliance in the country of residence

3. APPROVAL PROCESS
All remote work requests must be submitted through the HR portal and approved by:
- Direct manager
- HR department
- Legal team (for international employees)

4. EQUIPMENT AND SECURITY
- Company will provide necessary equipment for remote work
- Employees must follow all security protocols
- VPN access required for all company systems
- Regular security training mandatory

5. PERFORMANCE EXPECTATIONS
- Maintain same productivity levels as in-office work
- Regular check-ins with supervisor
- Participate in all required meetings
- Meet all project deadlines

6. COMMUNICATION
- Must be available during agreed working hours
- Respond to communications within 4 hours during business hours
- Use company-approved communication tools

For specific international considerations, please consult with HR and Legal teams.
    `.trim();
  }
}
