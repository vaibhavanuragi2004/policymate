import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import LanguageSelector from "@/components/language-selector";
import DocumentUpload from "@/components/document-upload";
import ChatInterface from "@/components/chat-interface";
import VectorDatabaseStatus from "@/components/vector-database-status";
import ApiKeySettings from "@/components/api-key-settings";

export default function PolicyAdvisor() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Generate a unique session ID
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="text-accent-blue text-xl" />
                <h1 className="text-xl font-semibold text-corporate-blue">PolicyAI</h1>
              </div>
              <span className="text-sm text-slate-gray hidden sm:inline">
                Multilingual Policy Advisor
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector 
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <span className="text-sm text-slate-gray hidden sm:inline">
                  John Doe
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ApiKeySettings />
            <DocumentUpload />
            <VectorDatabaseStatus />
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <ChatInterface 
              sessionId={sessionId}
              language={selectedLanguage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
