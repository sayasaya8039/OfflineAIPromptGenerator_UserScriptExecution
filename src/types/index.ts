/**
 * アプリケーション共通型定義
 */

// AIプロバイダー
export type AIProvider = 'chrome-ai' | 'gemini' | 'openai';

// AIの状態
export type AIStatus = 'checking' | 'ready' | 'downloading' | 'unavailable' | 'error' | 'no-api-key';

// 設定
export interface Settings {
  provider: AIProvider;
  geminiApiKey: string;
  openaiApiKey: string;
}

// デフォルト設定
export const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  geminiApiKey: '',
  openaiApiKey: '',
};

// スクリプト実行結果
export interface ScriptExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executedAt: number;
}

// 生成されたスクリプト情報
export interface GeneratedScript {
  id: string;
  prompt: string;
  code: string;
  createdAt: number;
  lastExecuted?: number;
}

// メッセージ型（popup ↔ service-worker間通信）
export type MessageType =
  | { type: 'CHECK_AI_STATUS' }
  | { type: 'GENERATE_SCRIPT'; prompt: string }
  | { type: 'EXECUTE_SCRIPT'; code: string; tabId: number }
  | { type: 'GET_CURRENT_TAB' }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; settings: Settings }
  | { type: 'SUMMARIZE_PAGE'; tabId: number };

export type MessageResponse =
  | { type: 'AI_STATUS'; status: AIStatus; message?: string; provider?: AIProvider }
  | { type: 'SCRIPT_GENERATED'; code: string }
  | { type: 'SCRIPT_EXECUTED'; result: ScriptExecutionResult }
  | { type: 'CURRENT_TAB'; tabId: number; url: string }
  | { type: 'SETTINGS'; settings: Settings }
  | { type: 'SETTINGS_SAVED' }
  | { type: 'SUMMARIZE_RESULT'; success: boolean; summary?: string; error?: string }
  | { type: 'ERROR'; message: string };
