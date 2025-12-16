/**
 * Chrome User Scripts API 連携モジュール
 * 生成されたスクリプトをページに注入・実行する
 */

import type { ScriptExecutionResult } from '../types';

/**
 * User Scripts APIの利用可能性をチェック
 */
export function isUserScriptsAvailable(): boolean {
  return typeof chrome !== 'undefined' &&
         typeof chrome.userScripts !== 'undefined';
}

/**
 * scripting APIの利用可能性をチェック（フォールバック用）
 */
export function isScriptingAvailable(): boolean {
  return typeof chrome !== 'undefined' &&
         typeof chrome.scripting !== 'undefined';
}

/**
 * 指定タブでスクリプトを実行（chrome.scripting.executeScript使用）
 * User Scripts APIより簡単で、動的コード実行に適している
 */
export async function executeScript(
  tabId: number,
  code: string
): Promise<ScriptExecutionResult> {
  const startTime = Date.now();

  try {
    if (!isScriptingAvailable()) {
      throw new Error('chrome.scripting APIが利用できません');
    }

    // chrome.scripting.executeScript で直接実行
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (codeToExecute: string) => {
        try {
          // eval代わりにFunctionコンストラクタを使用
          const fn = new Function(codeToExecute);
          const result = fn();
          return { success: true, result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      args: [code],
      world: 'MAIN', // ページのコンテキストで実行
    });

    const executionResult = results[0]?.result as { success: boolean; result?: unknown; error?: string } | undefined;

    if (!executionResult) {
      throw new Error('スクリプトの実行結果を取得できませんでした');
    }

    return {
      success: executionResult.success,
      result: executionResult.result,
      error: executionResult.error,
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
 * User Scripts APIでスクリプトを登録
 * 永続的に適用したい場合に使用
 */
export async function registerUserScript(
  id: string,
  code: string,
  matches: string[] = ['<all_urls>']
): Promise<void> {
  if (!isUserScriptsAvailable()) {
    throw new Error('chrome.userScripts APIが利用できません。拡張機能の設定で「ユーザースクリプトを許可」を有効にしてください。');
  }

  // 既存のスクリプトを削除
  try {
    await chrome.userScripts.unregister({ ids: [id] });
  } catch {
    // 存在しない場合はエラーを無視
  }

  // 新しいスクリプトを登録
  await chrome.userScripts.register([
    {
      id,
      matches,
      js: [{ code }],
      runAt: 'document_idle',
      world: 'MAIN',
    },
  ]);
}

/**
 * 登録済みユーザースクリプトを削除
 */
export async function unregisterUserScript(id: string): Promise<void> {
  if (!isUserScriptsAvailable()) {
    throw new Error('chrome.userScripts APIが利用できません');
  }

  await chrome.userScripts.unregister({ ids: [id] });
}

/**
 * 全ての登録済みスクリプトを取得
 */
export async function getRegisteredScripts(): Promise<chrome.userScripts.RegisteredUserScript[]> {
  if (!isUserScriptsAvailable()) {
    return [];
  }

  return await chrome.userScripts.getScripts();
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
