import { useState } from "react";
import { Key, Settings, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const setApiKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest("POST", "/api/settings/api-key", {
        apiKey: key,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Set Successfully",
        description: "Cerebras and Qwen3 models are now available for use.",
      });
      setApiKey("");
      setIsExpanded(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to set API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/settings/test-connection");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Test Successful",
        description: `Connected to ${data.model} via Cerebras inference.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setApiKeyMutation.mutate(apiKey.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-corporate-blue flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>AI Model Settings</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-gray hover:text-accent-blue"
          >
            <Key className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="api-key" className="text-sm font-medium">
                OpenRouter API Key
              </Label>
              <Badge variant="secondary" className="text-xs">
                Cerebras + Qwen3
              </Badge>
            </div>
            <p className="text-xs text-slate-gray">
              Required for accessing Cerebras fast inference and Qwen3 multilingual models
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="font-mono text-sm"
                disabled={setApiKeyMutation.isPending}
              />
              <div className="flex items-center space-x-2 text-xs text-slate-gray">
                <AlertCircle className="h-3 w-3" />
                <span>Get your API key from openrouter.ai</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="submit"
                size="sm"
                disabled={!apiKey.trim() || setApiKeyMutation.isPending}
                className="bg-accent-blue hover:bg-blue-600"
              >
                {setApiKeyMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Set API Key
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
              >
                {testConnectionMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent-blue border-t-transparent" />
                ) : (
                  "Test Connection"
                )}
              </Button>
            </div>
          </form>

          <div className="border-t border-border pt-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Model Configuration</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-gray">Primary Model:</span>
                  <div className="font-mono text-foreground">cerebras/llama3.1-70b</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-gray">Translation:</span>
                  <div className="font-mono text-foreground">Qwen3 via OpenRouter</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-gray">Inference Speed:</span>
                  <div className="font-mono text-foreground">2000+ tokens/sec</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-gray">Embedding:</span>
                  <div className="font-mono text-foreground">384-dim vectors</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}