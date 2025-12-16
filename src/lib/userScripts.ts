/**
 * Chrome User Scripts API 連携モジュール
 * 生成されたスクリプトをページに注入・実行する
 */

import type { ScriptExecutionResult } from '../types';

/**
 * 指定タブでスクリプトを実行
 * scriptタグ注入方式でCSPを回避
 */
export async function executeScript(
  tabId: number,
  code: string
): Promise<ScriptExecutionResult> {
  const startTime = Date.now();

  try {
    // chrome.scripting.executeScript で scriptタグを注入
    await chrome.scripting.executeScript({
      target: { tabId },
      func: injectScript,
      args: [code],
      world: 'MAIN',
    });

    return {
      success: true,
      result: 'スクリプトを実行しました',
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
 * ページ内で実行される関数
 * scriptタグを動的に作成してコードを実行
 */
function injectScript(codeToExecute: string): void {
  // scriptタグを作成
  const script = document.createElement('script');
  script.textContent = codeToExecute;

  // ページに挿入（即座に実行される）
  (document.head || document.documentElement).appendChild(script);

  // 実行後にタグを削除
  script.remove();
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
