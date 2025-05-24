import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertDocumentSchema, insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { DocumentProcessor } from "./lib/document-processor";
import { RAGService } from "./lib/rag-service";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  },
});

const documentProcessor = new DocumentProcessor();
const ragService = new RAGService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentData = {
        filename: req.file.filename || `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        status: "processing",
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);

      // Process document asynchronously
      documentProcessor.processDocument(document.id, req.file.buffer)
        .catch(error => {
          console.error(`Error processing document ${document.id}:`, error);
          storage.updateDocumentStatus(document.id, "error", undefined, error.message);
        });

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      await storage.deleteDocument(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Vector database status
  app.get("/api/vector-status", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      const readyDocuments = documents.filter(doc => doc.status === "ready");
      const totalChunks = readyDocuments.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0);
      
      res.json({
        documentCount: readyDocuments.length,
        embeddingCount: totalChunks,
        lastUpdated: readyDocuments.length > 0 
          ? Math.max(...readyDocuments.map(doc => doc.processedAt?.getTime() || 0))
          : null,
        status: readyDocuments.length > 0 ? "ready" : "empty"
      });
    } catch (error) {
      console.error("Error fetching vector status:", error);
      res.status(500).json({ message: "Failed to fetch vector status" });
    }
  });

  // Conversation routes
  app.post("/api/conversations", async (req, res) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:sessionId", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Message routes
  app.get("/api/conversations/:sessionId/messages", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await storage.getMessages(conversation.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:sessionId/messages", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messageSchema = z.object({
        content: z.string().min(1),
        language: z.string().optional(),
      });

      const { content, language } = messageSchema.parse(req.body);

      // Create user message
      const userMessage = await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content,
        originalLanguage: language || conversation.language,
        sources: null,
      });

      // Generate AI response using RAG
      const response = await ragService.generateResponse(content, language || conversation.language);

      // Create assistant message
      const assistantMessage = await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: response.content,
        originalLanguage: language || conversation.language,
        sources: response.sources,
      });

      res.json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
