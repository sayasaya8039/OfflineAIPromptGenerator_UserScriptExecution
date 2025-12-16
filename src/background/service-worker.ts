/**
 * Service Worker (Background Script)
 * AI生成とスクリプト実行のメッセージハンドリング
 */

import { checkAIAvailability, generateScript, getSettings, saveSettings } from '../lib/ai';
import { executeScript, getCurrentTab } from '../lib/userScripts';
import type { MessageType, MessageResponse } from '../types';

// メッセージリスナー
chrome.runtime.onMessage.addListener(
  (
    message: MessageType,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('Message handling error:', error);
        sendResponse({
          type: 'ERROR',
          message: error instanceof Error ? error.message : String(error),
        });
      });

    // 非同期レスポンスのためtrueを返す
    return true;
  }
);

/**
 * メッセージを処理
 */
async function handleMessage(message: MessageType): Promise<MessageResponse> {
  switch (message.type) {
    case 'CHECK_AI_STATUS': {
      const { status, message: statusMessage, provider } = await checkAIAvailability();
      return { type: 'AI_STATUS', status, message: statusMessage, provider };
    }

    case 'GENERATE_SCRIPT': {
      const code = await generateScript(message.prompt);
      return { type: 'SCRIPT_GENERATED', code };
    }

    case 'EXECUTE_SCRIPT': {
      const result = await executeScript(message.tabId, message.code);
      return { type: 'SCRIPT_EXECUTED', result };
    }

    case 'GET_CURRENT_TAB': {
      const tab = await getCurrentTab();
      if (tab) {
        return { type: 'CURRENT_TAB', tabId: tab.tabId, url: tab.url };
      }
      throw new Error('アクティブなタブが見つかりません');
    }

    case 'GET_SETTINGS': {
      const settings = await getSettings();
      return { type: 'SETTINGS', settings };
    }

    case 'SAVE_SETTINGS': {
      await saveSettings(message.settings);
      return { type: 'SETTINGS_SAVED' };
    }

    default:
      throw new Error('不明なメッセージタイプです');
  }
}

// 拡張機能インストール時の処理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Offline AI Script Generator がインストールされました');
    // 初回インストール時に設定画面を開く
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log(`バージョン ${chrome.runtime.getManifest().version} に更新されました`);
  }
});
