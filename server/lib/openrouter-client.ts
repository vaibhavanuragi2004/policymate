export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || "";
    
    if (!this.apiKey) {
      console.warn("OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable.");
    }
  }

  async generateCompletion(
    messages: Array<{ role: string; content: string }>,
    model = "qwen/qwen-2.5-72b-instruct"
  ): Promise<OpenRouterResponse> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key not configured. Please set your API key in the settings panel.");
    }

    try {
      console.log(`Making request to OpenRouter with model: ${model}`);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:5000",
          "X-Title": "PolicyAI Corporate Advisor",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 1000,
          top_p: 0.9,
        }),
      });

      console.log(`OpenRouter response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error response: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error("Invalid API key. Please check your OpenRouter API key and try again.");
        } else if (response.status === 402) {
          throw new Error("Insufficient credits in your OpenRouter account. Please add credits and try again.");
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        } else {
          throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }
      }

      const jsonResponse = await response.json();
      console.log("OpenRouter response received successfully");
      return jsonResponse;
    } catch (error) {
      console.error("OpenRouter API error:", error);
      
      if (error instanceof Error && error.message.includes("Unexpected token")) {
        throw new Error("Received invalid response from OpenRouter API. This usually indicates an authentication issue. Please verify your API key.");
      }
      
      throw new Error(`Failed to generate completion: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const messages = [
        {
          role: "system",
          content: `You are a professional translator specializing in corporate policy documents. Translate the following text to ${targetLanguage} while maintaining the exact meaning, context, and authoritative tone. Preserve any technical terms, policy references, and legal language. Return only the translation without explanations.`
        },
        {
          role: "user",
          content: text
        }
      ];

      const response = await this.generateCompletion(messages);
      return response.choices[0]?.message?.content || text;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Return original text if translation fails
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // For now, return a simple hash-based embedding
    // In production, you'd want to use a proper embedding model
    const hash = this.simpleHash(text);
    return Array.from({ length: 384 }, (_, i) => 
      Math.sin(hash + i) * Math.cos(hash * i)
    );
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}
