import { useState, useCallback } from "react";
import { Upload, File, FileText, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";

export default function DocumentUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);
      
      const response = await apiRequest("POST", "/api/documents/upload", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vector-status"] });
      toast({
        title: "Document uploaded",
        description: "Your document is being processed...",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("DELETE", `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vector-status"] });
      toast({
        title: "Document deleted",
        description: "Document has been removed from the knowledge base.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (validateFile(file)) {
        uploadMutation.mutate(file);
      }
    });
  }, [uploadMutation]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (validateFile(file)) {
        uploadMutation.mutate(file);
      }
    });
    e.target.value = '';
  }, [uploadMutation]);

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, DOC, and DOCX files are allowed.",
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <File className="text-red-500" />;
    } else if (mimeType.includes('word')) {
      return <FileText className="text-blue-500" />;
    }
    return <File className="text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-success-green';
      case 'processing':
        return 'text-warning-yellow';
      case 'error':
        return 'text-error-red';
      default:
        return 'text-slate-gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return '✓ Processed';
      case 'processing':
        return 'Processing...';
      case 'error':
        return '✗ Error';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-corporate-blue">
          Policy Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-accent-blue bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 dark:border-gray-600 hover:border-accent-blue'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <Upload className="mx-auto h-8 w-8 text-slate-gray mb-3" />
          <p className="text-sm text-slate-gray mb-2">
            Drag & drop policy documents
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX up to 10MB
          </p>
          <Button className="mt-3" size="sm" disabled={uploadMutation.isPending}>
            Browse Files
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Documents List */}
        <div className="space-y-2">
          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent-blue border-t-transparent mx-auto"></div>
            </div>
          )}
          
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(document.mimeType)}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {document.originalName}
                  </p>
                  <p className={`text-xs ${getStatusColor(document.status)}`}>
                    {getStatusText(document.status)}
                  </p>
                  {document.status === 'error' && document.errorMessage && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-error-red" />
                      <p className="text-xs text-error-red">
                        {document.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(document.id)}
                disabled={deleteMutation.isPending}
                className="text-slate-gray hover:text-error-red"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {!isLoading && documents.length === 0 && (
            <div className="text-center py-4 text-slate-gray">
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
