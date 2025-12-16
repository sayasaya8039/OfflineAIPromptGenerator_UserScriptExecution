/**
 * スクリプト実行モジュール
 * Content Script方式でCSP制限を回避
 */

import type { ScriptExecutionResult } from '../types';

/**
 * 指定タブでスクリプトを実行
 * ISOLATED worldでCSPを完全に回避
 */
export async function executeScript(
  tabId: number,
  code: string
): Promise<ScriptExecutionResult> {
  const startTime = Date.now();

  try {
    // ISOLATED worldで実行（CSPの影響を受けない）
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: executeUserCode,
      args: [code],
      world: 'ISOLATED', // 拡張機能の分離環境で実行
    });

    const result = results[0]?.result;

    if (result && typeof result === 'object' && 'success' in result) {
      return {
        success: result.success as boolean,
        result: result.result,
        error: result.error as string | undefined,
        executedAt: startTime,
      };
    }

    return {
      success: true,
      result: result,
      executedAt: startTime,
    };
  } catch (error) {
    console.error('Script execution failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executedAt: startTime,
    };
  }
}

/**
 * ユーザーコードを実行する関数
 * この関数はページのコンテキストで実行される
 */
function executeUserCode(code: string): { success: boolean; result?: unknown; error?: string } {
  try {
    // Function コンストラクタでコードを実行
    const fn = new Function(code);
    const result = fn();
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 現在のタブ情報を取得
 */
export async function getCurrentTab(): Promise<{ tabId: number; url: string } | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url) {
      return { tabId: tab.id, url: tab.url };
    }
    return null;
  } catch (error) {
    console.error('Failed to get current tab:', error);
    return null;
  }
}
