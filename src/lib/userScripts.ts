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

/**
 * ページのテキストを抽出
 */
export async function extractPageText(tabId: number): Promise<string> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      // 不要な要素を除外してテキストを抽出
      const excludeSelectors = ['script', 'style', 'noscript', 'nav', 'header', 'footer', 'aside', 'iframe'];
      const clone = document.body.cloneNode(true) as HTMLElement;

      excludeSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      });

      // テキストを取得して整形
      const text = clone.innerText || clone.textContent || '';
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
    },
  });

  return results[0]?.result || '';
}

/**
 * 要約をオーバーレイで表示
 */
export async function showSummaryOverlay(tabId: number, summary: string): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    args: [summary],
    func: (summaryText: string) => {
      // 既存のオーバーレイを削除
      const existingOverlay = document.getElementById('ai-summary-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // オーバーレイコンテナを作成
      const overlay = document.createElement('div');
      overlay.id = 'ai-summary-overlay';
      overlay.innerHTML = `
        <style>
          #ai-summary-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 2147483647;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif;
          }
          #ai-summary-overlay .summary-card {
            background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
            border-radius: 16px;
            padding: 24px;
            max-width: 700px;
            max-height: 80vh;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          @media (prefers-color-scheme: dark) {
            #ai-summary-overlay .summary-card {
              background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
            }
            #ai-summary-overlay .summary-header h2 {
              color: #FFFFFF !important;
            }
            #ai-summary-overlay .summary-content {
              color: #FFFFFF !important;
            }
            #ai-summary-overlay .summary-content p,
            #ai-summary-overlay .summary-content span {
              color: #FFFFFF !important;
            }
            #ai-summary-overlay .summary-content h1,
            #ai-summary-overlay .summary-content h2,
            #ai-summary-overlay .summary-content h3 {
              color: #7DD3FC !important;
            }
            #ai-summary-overlay .summary-content strong {
              color: #FFFFFF !important;
            }
            #ai-summary-overlay .summary-content li {
              color: #FFFFFF !important;
            }
            #ai-summary-overlay .summary-content ul,
            #ai-summary-overlay .summary-content ol {
              color: #FFFFFF !important;
            }
          }
          #ai-summary-overlay .summary-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid #BAE6FD;
          }
          #ai-summary-overlay .summary-header h2 {
            margin: 0;
            color: #0C4A6E;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          #ai-summary-overlay .close-btn {
            background: #38BDF8;
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
          }
          #ai-summary-overlay .close-btn:hover {
            background: #0EA5E9;
          }
          #ai-summary-overlay .summary-content {
            overflow-y: auto;
            color: #334155;
            line-height: 1.7;
            font-size: 15px;
          }
          #ai-summary-overlay .summary-content h1,
          #ai-summary-overlay .summary-content h2,
          #ai-summary-overlay .summary-content h3 {
            color: #0369A1;
            margin-top: 16px;
            margin-bottom: 8px;
          }
          #ai-summary-overlay .summary-content ul,
          #ai-summary-overlay .summary-content ol {
            padding-left: 24px;
            margin: 8px 0;
          }
          #ai-summary-overlay .summary-content li {
            margin: 6px 0;
          }
          #ai-summary-overlay .summary-content p {
            margin: 8px 0;
          }
          #ai-summary-overlay .summary-content strong {
            color: #0C4A6E;
          }
        </style>
        <div class="summary-card">
          <div class="summary-header">
            <h2>📝 ページ要約</h2>
            <button class="close-btn" title="閉じる">×</button>
          </div>
          <div class="summary-content"></div>
        </div>
      `;

      document.body.appendChild(overlay);

      // マークダウンを簡易的にHTMLに変換
      const contentEl = overlay.querySelector('.summary-content') as HTMLElement;
      const htmlContent = summaryText
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      contentEl.innerHTML = `<p>${htmlContent}</p>`;

      // 閉じるボタン
      const closeBtn = overlay.querySelector('.close-btn');
      closeBtn?.addEventListener('click', () => overlay.remove());

      // 背景クリックで閉じる
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });

      // ESCキーで閉じる
      const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          overlay.remove();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    },
  });
}
