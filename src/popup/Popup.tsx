/**
 * ポップアップメインコンポーネント
 */

import { useState, useEffect, useCallback } from 'react';
import type { AIStatus, AIProvider, ScriptExecutionResult, MessageResponse } from '../types';
import './styles/popup.css';

const VERSION = '1.4.0';

const PROVIDER_NAMES: Record<AIProvider, string> = {
  'chrome-ai': 'Chrome AI',
  'gemini': 'Gemini',
  'openai': 'OpenAI',
};

export function Popup() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [aiStatus, setAiStatus] = useState<AIStatus>('checking');
  const [statusMessage, setStatusMessage] = useState('AIの状態を確認中...');
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('gemini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [executionResult, setExecutionResult] = useState<ScriptExecutionResult | null>(null);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  // AIステータスとタブ情報を取得
  useEffect(() => {
    // AI状態チェック
    chrome.runtime.sendMessage({ type: 'CHECK_AI_STATUS' }, (response: MessageResponse) => {
      if (response?.type === 'AI_STATUS') {
        setAiStatus(response.status);
        setStatusMessage(response.message || '');
        if (response.provider) {
          setCurrentProvider(response.provider);
        }
      }
    });

    // 現在のタブを取得
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' }, (response: MessageResponse) => {
      if (response?.type === 'CURRENT_TAB') {
        setCurrentTabId(response.tabId);
        setCurrentUrl(response.url);
      }
    });
  }, []);

  // 設定画面を開く
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  // コード生成
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setExecutionResult(null);
    setGeneratedCode('');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_SCRIPT',
        prompt: prompt.trim(),
      }) as MessageResponse;

      if (response.type === 'SCRIPT_GENERATED') {
        setGeneratedCode(response.code);
      } else if (response.type === 'ERROR') {
        setStatusMessage(`エラー: ${response.message}`);
        setAiStatus('error');
      }
    } catch (error) {
      setStatusMessage(`生成エラー: ${error instanceof Error ? error.message : String(error)}`);
      setAiStatus('error');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating]);

  // スクリプト実行
  const handleExecute = useCallback(async () => {
    if (!generatedCode || !currentTabId || isExecuting) return;

    setIsExecuting(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_SCRIPT',
        code: generatedCode,
        tabId: currentTabId,
      }) as MessageResponse;

      if (response.type === 'SCRIPT_EXECUTED') {
        setExecutionResult(response.result);
      } else if (response.type === 'ERROR') {
        setExecutionResult({
          success: false,
          error: response.message,
          executedAt: Date.now(),
        });
      }
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executedAt: Date.now(),
      });
    } finally {
      setIsExecuting(false);
    }
  }, [generatedCode, currentTabId, isExecuting]);

  // 生成＆実行（ワンクリック）
  const handleGenerateAndExecute = useCallback(async () => {
    if (!prompt.trim() || isGenerating || isExecuting) return;

    setIsGenerating(true);
    setExecutionResult(null);
    setGeneratedCode('');

    try {
      const genResponse = await chrome.runtime.sendMessage({
        type: 'GENERATE_SCRIPT',
        prompt: prompt.trim(),
      }) as MessageResponse;

      if (genResponse.type !== 'SCRIPT_GENERATED') {
        throw new Error(genResponse.type === 'ERROR' ? genResponse.message : '生成に失敗しました');
      }

      setGeneratedCode(genResponse.code);
      setIsGenerating(false);

      if (currentTabId) {
        setIsExecuting(true);
        const execResponse = await chrome.runtime.sendMessage({
          type: 'EXECUTE_SCRIPT',
          code: genResponse.code,
          tabId: currentTabId,
        }) as MessageResponse;

        if (execResponse.type === 'SCRIPT_EXECUTED') {
          setExecutionResult(execResponse.result);
        }
      }
    } catch (error) {
      setStatusMessage(`エラー: ${error instanceof Error ? error.message : String(error)}`);
      setAiStatus('error');
    } finally {
      setIsGenerating(false);
      setIsExecuting(false);
    }
  }, [prompt, currentTabId, isGenerating, isExecuting]);

  // ページ要約
  const handleSummarize = useCallback(async () => {
    if (!currentTabId || isSummarizing) return;

    setIsSummarizing(true);
    setExecutionResult(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SUMMARIZE_PAGE',
        tabId: currentTabId,
      }) as MessageResponse;

      if (response.type === 'ERROR') {
        setExecutionResult({
          success: false,
          error: response.message,
          executedAt: Date.now(),
        });
      }
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executedAt: Date.now(),
      });
    } finally {
      setIsSummarizing(false);
    }
  }, [currentTabId, isSummarizing]);

  // AIステータスに応じたバッジ
  const getStatusBadge = () => {
    const badges: Record<AIStatus, { class: string; text: string }> = {
      checking: { class: 'badge-checking', text: '確認中...' },
      ready: { class: 'badge-ready', text: `${PROVIDER_NAMES[currentProvider]} 準備完了` },
      downloading: { class: 'badge-downloading', text: 'ダウンロード中' },
      unavailable: { class: 'badge-unavailable', text: '利用不可' },
      'no-api-key': { class: 'badge-warning', text: 'APIキー未設定' },
      error: { class: 'badge-error', text: 'エラー' },
    };
    const badge = badges[aiStatus];
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const isReady = aiStatus === 'ready';
  const needsSetup = aiStatus === 'no-api-key' || aiStatus === 'unavailable';
  const canExecute = !!generatedCode && !!currentTabId;

  return (
    <div className="popup-container">
      {/* ヘッダー */}
      <header className="header">
        <h1 className="title">Offline AI Script Generator</h1>
        <div className="header-info">
          {getStatusBadge()}
          <span className="version">v{VERSION}</span>
        </div>
      </header>

      {/* ステータスメッセージ */}
      {statusMessage && !isReady && (
        <div className={`status-message status-${aiStatus}`}>
          {statusMessage}
          {needsSetup && (
            <button className="btn-link" onClick={openOptions}>
              設定を開く
            </button>
          )}
        </div>
      )}

      {/* 現在のページ情報 */}
      {currentUrl && (
        <div className="current-page">
          <span className="label">対象ページ:</span>
          <span className="url" title={currentUrl}>
            {currentUrl.length > 40 ? currentUrl.substring(0, 40) + '...' : currentUrl}
          </span>
        </div>
      )}

      {/* ページ要約ボタン */}
      <button
        className="btn btn-summarize"
        onClick={handleSummarize}
        disabled={!isReady || !currentTabId || isSummarizing}
      >
        {isSummarizing ? '要約中...' : '📝 このページを要約'}
      </button>

      {/* 入力エリア */}
      <div className="input-section">
        <label htmlFor="prompt" className="input-label">
          やりたいこと:
        </label>
        <textarea
          id="prompt"
          className="prompt-input"
          placeholder="例: このページの画像を全部グレー化する"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={!isReady || isGenerating}
          rows={3}
        />
      </div>

      {/* アクションボタン */}
      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={handleGenerateAndExecute}
          disabled={!isReady || !prompt.trim() || isGenerating || isExecuting || !currentTabId}
        >
          {isGenerating ? '生成中...' : isExecuting ? '実行中...' : '生成 & 実行'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleGenerate}
          disabled={!isReady || !prompt.trim() || isGenerating}
        >
          生成のみ
        </button>
      </div>

      {/* 生成されたコード */}
      {generatedCode && (
        <div className="code-section">
          <div className="section-header">
            <span className="section-title">生成されたコード:</span>
            <button
              className="btn btn-small btn-execute"
              onClick={handleExecute}
              disabled={!canExecute || isExecuting}
            >
              {isExecuting ? '実行中...' : '実行'}
            </button>
          </div>
          <pre className="code-block">
            <code>{generatedCode}</code>
          </pre>
        </div>
      )}

      {/* 実行結果 */}
      {executionResult && (
        <div className={`result-section ${executionResult.success ? 'success' : 'error'}`}>
          <div className="result-header">
            {executionResult.success ? '✓ 実行完了' : '✗ 実行エラー'}
          </div>
          {executionResult.error && (
            <div className="result-error">{executionResult.error}</div>
          )}
          {executionResult.result !== undefined && (
            <div className="result-value">
              結果: {JSON.stringify(executionResult.result, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* フッター */}
      <footer className="footer">
        <span>Powered by {PROVIDER_NAMES[currentProvider]}</span>
        <button className="btn-settings" onClick={openOptions} title="設定">
          ⚙️
        </button>
      </footer>
    </div>
  );
}
