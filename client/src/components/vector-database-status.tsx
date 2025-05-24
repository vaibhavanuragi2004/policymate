import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, CheckCircle, Clock } from "lucide-react";

interface VectorStatus {
  documentCount: number;
  embeddingCount: number;
  lastUpdated: number | null;
  status: string;
}

export default function VectorDatabaseStatus() {
  const { data: status, isLoading } = useQuery<VectorStatus>({
    queryKey: ["/api/vector-status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const formatLastUpdated = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-corporate-blue flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Knowledge Base</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-gray">Documents Indexed</span>
              <span className="text-sm font-semibold text-foreground">
                {status?.documentCount || 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-gray">Vector Embeddings</span>
              <span className="text-sm font-semibold text-foreground">
                {status?.embeddingCount?.toLocaleString() || 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-gray">Last Updated</span>
              <span className="text-sm font-semibold text-foreground">
                {formatLastUpdated(status?.lastUpdated || null)}
              </span>
            </div>
            
            <div 
              className={`mt-4 border rounded-lg p-3 flex items-center space-x-2 ${
                status?.status === 'ready'
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
              }`}
            >
              {status?.status === 'ready' ? (
                <CheckCircle className="h-4 w-4 text-success-green" />
              ) : (
                <Clock className="h-4 w-4 text-slate-gray" />
              )}
              <span 
                className={`text-sm font-medium ${
                  status?.status === 'ready' ? 'text-success-green' : 'text-slate-gray'
                }`}
              >
                {status?.status === 'ready' ? 'FAISS Ready' : 'No Data'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
