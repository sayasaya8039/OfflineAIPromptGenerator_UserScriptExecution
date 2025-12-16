/**
 * Chrome Built-in AI (Gemini Nano) 型定義
 * Prompt API for Chrome Extensions
 */

declare global {
  interface LanguageModelAvailability {
    available: 'readily' | 'after-download' | 'no';
    defaultTemperature?: number;
    defaultTopK?: number;
    maxTopK?: number;
  }

  interface LanguageModelCreateOptions {
    temperature?: number;
    topK?: number;
    systemPrompt?: string;
    initialPrompts?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
    signal?: AbortSignal;
  }

  interface LanguageModelSession {
    prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
    promptStreaming(input: string, options?: { signal?: AbortSignal }): ReadableStream<string>;
    clone(): Promise<LanguageModelSession>;
    destroy(): void;
    tokensSoFar: number;
    maxTokens: number;
    tokensLeft: number;
  }

  interface LanguageModelCapabilities {
    available: 'readily' | 'after-download' | 'no';
    defaultTemperature: number;
    defaultTopK: number;
    maxTopK: number;
    supportsLanguage(languageTag: string): 'readily' | 'after-download' | 'no';
  }

  interface LanguageModel {
    availability(): Promise<LanguageModelAvailability>;
    capabilities(): Promise<LanguageModelCapabilities>;
    create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
  }

  // グローバル変数として宣言
  const LanguageModel: LanguageModel;

  // window.ai も古いAPIとして対応
  interface Window {
    ai?: {
      languageModel?: LanguageModel;
    };
  }
}

export {};
