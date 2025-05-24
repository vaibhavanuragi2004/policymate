import { 
  users, documents, conversations, messages, documentChunks,
  type User, type InsertUser, type Document, type InsertDocument,
  type Conversation, type InsertConversation, type Message, type InsertMessage,
  type DocumentChunk
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
  updateDocumentStatus(id: number, status: string, chunkCount?: number, errorMessage?: string): Promise<void>;
  deleteDocument(id: number): Promise<void>;
  
  // Document chunks methods
  createDocumentChunk(chunk: Omit<DocumentChunk, 'id'>): Promise<DocumentChunk>;
  getDocumentChunks(documentId: number): Promise<DocumentChunk[]>;
  deleteDocumentChunks(documentId: number): Promise<void>;
  searchSimilarChunks(query: string, limit?: number): Promise<DocumentChunk[]>;
  
  // Conversation methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(sessionId: string): Promise<Conversation | undefined>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(conversationId: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private documentChunks: Map<number, DocumentChunk>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentDocumentId: number;
  private currentChunkId: number;
  private currentConversationId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.documentChunks = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentChunkId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      uploadedAt: new Date(),
      processedAt: null,
      chunkCount: 0,
      errorMessage: null,
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async updateDocumentStatus(id: number, status: string, chunkCount?: number, errorMessage?: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.status = status;
      if (chunkCount !== undefined) document.chunkCount = chunkCount;
      if (errorMessage !== undefined) document.errorMessage = errorMessage;
      if (status === "ready") document.processedAt = new Date();
      this.documents.set(id, document);
    }
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
    await this.deleteDocumentChunks(id);
  }

  async createDocumentChunk(chunk: Omit<DocumentChunk, 'id'>): Promise<DocumentChunk> {
    const id = this.currentChunkId++;
    const documentChunk: DocumentChunk = { ...chunk, id };
    this.documentChunks.set(id, documentChunk);
    return documentChunk;
  }

  async getDocumentChunks(documentId: number): Promise<DocumentChunk[]> {
    return Array.from(this.documentChunks.values()).filter(
      chunk => chunk.documentId === documentId
    );
  }

  async deleteDocumentChunks(documentId: number): Promise<void> {
    const chunksToDelete = Array.from(this.documentChunks.entries())
      .filter(([_, chunk]) => chunk.documentId === documentId)
      .map(([id]) => id);
    
    chunksToDelete.forEach(id => this.documentChunks.delete(id));
  }

  async searchSimilarChunks(query: string, limit = 5): Promise<DocumentChunk[]> {
    // Simple text-based similarity search for memory storage
    // In a real implementation, this would use vector similarity
    const chunks = Array.from(this.documentChunks.values());
    const queryLower = query.toLowerCase();
    
    return chunks
      .filter(chunk => chunk.content.toLowerCase().includes(queryLower))
      .slice(0, limit);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversation(sessionId: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      conv => conv.sessionId === sessionId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
