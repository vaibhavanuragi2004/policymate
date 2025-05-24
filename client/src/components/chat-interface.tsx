import { useState, useEffect, useRef } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ChatMessage from "./chat-message";
import type { Message, Conversation } from "@shared/schema";

interface ChatInterfaceProps {
  sessionId: string;
  language: string;
}

export default function ChatInterface({ sessionId, language }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create conversation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        sessionId,
        language,
      });
      return response.json();
    },
    onSuccess: (conversation: Conversation) => {
      setConversationId(conversation.id);
    },
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${sessionId}/messages`],
    enabled: !!conversationId,
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/conversations/${sessionId}/messages`, {
        content,
        language,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${sessionId}/messages`] 
      });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize conversation
  useEffect(() => {
    if (sessionId && !conversationId) {
      createConversationMutation.mutate();
    }
  }, [sessionId, conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(trimmedMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = createConversationMutation.isPending || sendMessageMutation.isPending;

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-corporate-blue">
              Policy Assistant
            </h2>
            <p className="text-sm text-slate-gray">
              Ask questions about company policies in any language
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-gray">
            <Bot className="h-4 w-4" />
            <span>Powered by Cerebras Qwen3</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && !messagesLoading && (
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white text-sm" />
              </div>
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-foreground">
                    👋 Hello! I'm your multilingual policy assistant. I can help you find answers 
                    to company policy questions in your preferred language. What would you like to know?
                  </p>
                </div>
                <p className="text-xs text-slate-gray mt-2">PolicyAI • Just now</p>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white text-sm" />
              </div>
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-accent-blue" />
                    <span className="text-slate-gray text-sm">
                      Searching policy documents...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-border">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about company policies..."
                className="resize-none min-h-[80px] pr-12"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4 text-xs text-slate-gray">
                  <span>Press ⌘ + Enter to send</span>
                  <div className="flex items-center space-x-1">
                    <span>🔒 End-to-end encrypted</span>
                  </div>
                </div>
                <div className="text-xs text-slate-gray">
                  {message.length}/2000
                </div>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="bg-accent-blue hover:bg-blue-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
