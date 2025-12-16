/**
 * スクリプト実行モジュール
 * chrome.userScripts APIを使用して動的コード実行
 */

import type { ScriptExecutionResult } from '../types';

// スクリプトIDのカウンター
let scriptCounter = 0;

/**
 * 指定タブでスクリプトを実行
 * userScripts APIでスクリプトを登録し、ページをリロードして実行
 */
export async function executeScript(
  tabId: number,
  code: string
): Promise<ScriptExecutionResult> {
  const startTime = Date.now();
  const scriptId = `ai-script-${++scriptCounter}`;

  try {
    // 現在のタブのURLを取得
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) {
      throw new Error('タブのURLを取得できません');
    }

    // chrome:// や edge:// などの特殊ページはスキップ
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      throw new Error('このページではスクリプトを実行できません');
    }

    // 既存のスクリプトをすべて削除
    try {
      const existingScripts = await chrome.userScripts.getScripts();
      if (existingScripts.length > 0) {
        await chrome.userScripts.unregister({ ids: existingScripts.map(s => s.id) });
      }
    } catch {
      // 無視
    }

    // URLパターンを作成
    const url = new URL(tab.url);
    const matchPattern = `${url.protocol}//${url.host}/*`;

    // userScripts APIでスクリプトを登録
    await chrome.userScripts.register([{
      id: scriptId,
      matches: [matchPattern],
      js: [{ code: wrapCode(code) }],
      runAt: 'document_end',
      world: 'MAIN',
    }]);

    // ページをリロードしてスクリプトを実行
    await chrome.tabs.reload(tabId);

    // 少し待ってからスクリプトを削除（一度だけ実行）
    setTimeout(async () => {
      try {
        await chrome.userScripts.unregister({ ids: [scriptId] });
      } catch {
        // 無視
      }
    }, 3000);

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
 * コードをラップしてエラーハンドリングを追加
 */
function wrapCode(code: string): string {
  return `
(function() {
  try {
    ${code}
    console.log('[AI Script] 実行完了');
  } catch (e) {
    console.error('[AI Script] エラー:', e);
  }
})();
`;
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
