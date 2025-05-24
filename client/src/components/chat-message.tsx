import { formatDistanceToNow } from "date-fns";
import { Bot, ThumbsUp, ThumbsDown, Copy, User, File, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "Copied to clipboard",
      description: "Message content has been copied.",
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getFileIcon = (filename: string) => {
    if (filename.toLowerCase().includes('.pdf')) {
      return <File className="h-3 w-3 text-red-500" />;
    } else if (filename.toLowerCase().includes('.doc')) {
      return <FileText className="h-3 w-3 text-blue-500" />;
    }
    return <File className="h-3 w-3 text-gray-500" />;
  };

  const sources = message.sources as Array<{
    documentId: number;
    documentName: string;
    chunkIndex: number;
    similarity: number;
    metadata?: any;
  }> || [];

  if (message.role === "user") {
    return (
      <div className="flex items-start space-x-4 justify-end">
        <div className="flex-1 max-w-2xl">
          <div className="bg-accent-blue rounded-lg p-4 text-right">
            <p className="text-white">{message.content}</p>
          </div>
          <p className="text-xs text-slate-gray mt-2 text-right">
            You • {formatTimestamp(message.timestamp)}
          </p>
        </div>
        <div className="w-8 h-8 bg-corporate-blue rounded-full flex items-center justify-center flex-shrink-0">
          <User className="text-white text-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-4">
      <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="text-white text-sm" />
      </div>
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {message.content.split('\n').map((paragraph, index) => (
              <p key={index} className="text-foreground mb-2 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-slate-gray">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="bg-white dark:bg-gray-800 border border-border text-xs"
                >
                  <div className="flex items-center space-x-2">
                    {getFileIcon(source.documentName)}
                    <span className="font-medium">{source.documentName}</span>
                    {source.metadata?.page && (
                      <span className="text-slate-gray">• Page {source.metadata.page}</span>
                    )}
                  </div>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-slate-gray">
            PolicyAI • {formatTimestamp(message.timestamp)}
          </p>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-gray hover:text-success-green h-6 w-6 p-0"
              onClick={() => {
                toast({
                  title: "Feedback received",
                  description: "Thank you for your feedback!",
                });
              }}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-gray hover:text-error-red h-6 w-6 p-0"
              onClick={() => {
                toast({
                  title: "Feedback received", 
                  description: "Thank you for your feedback!",
                });
              }}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-gray hover:text-accent-blue h-6 w-6 p-0"
              onClick={copyToClipboard}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
