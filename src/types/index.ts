/**
 * アプリケーション共通型定義
 */

// AIの状態
export type AIStatus = 'checking' | 'ready' | 'downloading' | 'unavailable' | 'error';

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
  | { type: 'GET_CURRENT_TAB' };

export type MessageResponse =
  | { type: 'AI_STATUS'; status: AIStatus; message?: string }
  | { type: 'SCRIPT_GENERATED'; code: string }
  | { type: 'SCRIPT_EXECUTED'; result: ScriptExecutionResult }
  | { type: 'CURRENT_TAB'; tabId: number; url: string }
  | { type: 'ERROR'; message: string };
