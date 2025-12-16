/**
 * 設定画面コンポーネント
 */

import { useState, useEffect, useCallback } from 'react';
import type { Settings, AIProvider } from '../types';
import './styles/options.css';

const VERSION = '1.3.0';

// Chrome AIフラグ設定
const CHROME_FLAGS = [
  {
    id: 'prompt-api',
    url: 'chrome://flags/#prompt-api-for-gemini-nano',
    name: 'Prompt API for Gemini Nano',
    value: 'Enabled',
    description: 'Gemini Nano AIモデルを有効化'
  },
  {
    id: 'optimization-guide',
    url: 'chrome://flags/#optimization-guide-on-device-model',
    name: 'Enables optimization guide on device',
    value: 'Enabled BypassPerfRequirement',
    description: 'オンデバイスモデルを有効化（性能要件をバイパス）'
  }
];

// Chrome AI状態の型
type ChromeAIStatus = 'checking' | 'ready' | 'downloading' | 'not-available' | 'error';

export function Options() {
  const [settings, setSettings] = useState<Settings>({
    provider: 'gemini',
    geminiApiKey: '',
    openaiApiKey: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chromeAIStatus, setChromeAIStatus] = useState<ChromeAIStatus>('checking');
  const [chromeAIMessage, setChromeAIMessage] = useState('');
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

  // Chrome AI状態をチェック
  const checkChromeAI = useCallback(async () => {
    setChromeAIStatus('checking');
    setChromeAIMessage('Chrome AIの状態を確認中...');

    try {
      // @ts-expect-error - Chrome AI API
      if (typeof self !== 'undefined' && self.ai?.languageModel) {
        // @ts-expect-error - Chrome AI API
        const languageModel = self.ai.languageModel;

        let availability: string;
        if (typeof languageModel.availability === 'function') {
          availability = await languageModel.availability();
        } else if (typeof languageModel.capabilities === 'function') {
          const caps = await languageModel.capabilities();
          availability = caps.available;
        } else {
          setChromeAIStatus('not-available');
          setChromeAIMessage('Chrome AI APIが見つかりません');
          return;
        }

        switch (availability) {
          case 'readily':
          case 'ready':
            setChromeAIStatus('ready');
            setChromeAIMessage('Chrome AI準備完了！すぐに使用できます');
            break;
          case 'after-download':
          case 'downloadable':
            setChromeAIStatus('downloading');
            setChromeAIMessage('AIモデルのダウンロードが必要です。Chromeが自動でダウンロードを開始します');
            break;
          case 'downloading':
            setChromeAIStatus('downloading');
            setChromeAIMessage('AIモデルをダウンロード中...しばらくお待ちください');
            break;
          default:
            setChromeAIStatus('not-available');
            setChromeAIMessage('Chrome AIが利用できません。以下の手順で設定してください');
        }
      } else {
        setChromeAIStatus('not-available');
        setChromeAIMessage('Chrome AIが利用できません。以下の手順で設定してください');
      }
    } catch (error) {
      setChromeAIStatus('error');
      setChromeAIMessage(`エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // 設定を読み込み
  useEffect(() => {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
      setLoading(false);
    });
  }, []);

  // Chrome AI選択時に状態をチェック
  useEffect(() => {
    if (settings.provider === 'chrome-ai') {
      checkChromeAI();
    }
  }, [settings.provider, checkChromeAI]);

  // フラグURLをコピー
  const copyToClipboard = async (text: string, flagId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFlag(flagId);
      setTimeout(() => setCopiedFlag(null), 2000);
    } catch (error) {
      console.error('コピーに失敗しました:', error);
    }
  };

  // 設定を保存
  const handleSave = async () => {
    await chrome.storage.local.set({ settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // プロバイダー変更
  const handleProviderChange = (provider: AIProvider) => {
    setSettings({ ...settings, provider });
  };

  if (loading) {
    return <div className="options-container"><p>読み込み中...</p></div>;
  }

  return (
    <div className="options-container">
      <header className="header">
        <h1>Offline AI Script Generator</h1>
        <span className="version">v{VERSION}</span>
      </header>

      <main className="main">
        <section className="section">
          <h2>AIプロバイダー設定</h2>
          <p className="description">使用するAIサービスを選択してください。</p>

          <div className="provider-list">
            {/* Gemini */}
            <div
              className={`provider-card ${settings.provider === 'gemini' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('gemini')}
            >
              <div className="provider-header">
                <input
                  type="radio"
                  name="provider"
                  checked={settings.provider === 'gemini'}
                  onChange={() => handleProviderChange('gemini')}
                />
                <span className="provider-name">Gemini API</span>
                <span className="provider-badge free">無料枠あり</span>
              </div>
              <p className="provider-description">
                Google AI Studioで無料のAPIキーを取得できます。
              </p>
              {settings.provider === 'gemini' && (
                <div className="api-key-input">
                  <label>APIキー:</label>
                  <input
                    type="password"
                    placeholder="AIza..."
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="get-key-link"
                  >
                    APIキーを取得
                  </a>
                </div>
              )}
            </div>

            {/* OpenAI */}
            <div
              className={`provider-card ${settings.provider === 'openai' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('openai')}
            >
              <div className="provider-header">
                <input
                  type="radio"
                  name="provider"
                  checked={settings.provider === 'openai'}
                  onChange={() => handleProviderChange('openai')}
                />
                <span className="provider-name">OpenAI API</span>
                <span className="provider-badge paid">有料</span>
              </div>
              <p className="provider-description">
                GPT-4o-miniを使用。高品質なコード生成が可能です。
              </p>
              {settings.provider === 'openai' && (
                <div className="api-key-input">
                  <label>APIキー:</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="get-key-link"
                  >
                    APIキーを取得
                  </a>
                </div>
              )}
            </div>

            {/* Chrome AI */}
            <div
              className={`provider-card ${settings.provider === 'chrome-ai' ? 'selected' : ''}`}
              onClick={() => handleProviderChange('chrome-ai')}
            >
              <div className="provider-header">
                <input
                  type="radio"
                  name="provider"
                  checked={settings.provider === 'chrome-ai'}
                  onChange={() => handleProviderChange('chrome-ai')}
                />
                <span className="provider-name">Chrome Built-in AI</span>
                <span className="provider-badge experimental">実験的</span>
              </div>
              <p className="provider-description">
                Gemini Nano搭載。オフラインで動作、APIキー不要、完全無料。
              </p>
              {settings.provider === 'chrome-ai' && (
                <div className="chrome-ai-setup" onClick={(e) => e.stopPropagation()}>
                  {/* ステータス表示 */}
                  <div className={`chrome-ai-status status-${chromeAIStatus}`}>
                    <span className="status-icon">
                      {chromeAIStatus === 'checking' && '🔄'}
                      {chromeAIStatus === 'ready' && '✅'}
                      {chromeAIStatus === 'downloading' && '⏳'}
                      {chromeAIStatus === 'not-available' && '⚠️'}
                      {chromeAIStatus === 'error' && '❌'}
                    </span>
                    <span className="status-text">{chromeAIMessage}</span>
                    {chromeAIStatus !== 'checking' && (
                      <button
                        className="btn-refresh"
                        onClick={checkChromeAI}
                        title="再チェック"
                      >
                        🔄
                      </button>
                    )}
                  </div>

                  {/* 利用可能な場合 */}
                  {chromeAIStatus === 'ready' && (
                    <div className="chrome-ai-ready">
                      <p>Chrome AIはすぐに使用できます。設定を保存して使い始めましょう！</p>
                    </div>
                  )}

                  {/* ダウンロード中の場合 */}
                  {chromeAIStatus === 'downloading' && (
                    <div className="chrome-ai-downloading">
                      <div className="download-info">
                        <p>モデルサイズ: 約1.7GB</p>
                        <p>バックグラウンドでダウンロードされます。完了後に再度確認してください。</p>
                      </div>
                    </div>
                  )}

                  {/* 利用不可の場合 - セットアップガイド */}
                  {(chromeAIStatus === 'not-available' || chromeAIStatus === 'error') && (
                    <div className="chrome-ai-guide">
                      <h4>セットアップガイド</h4>

                      {/* 動作要件 */}
                      <div className="requirements">
                        <h5>📋 動作要件</h5>
                        <ul>
                          <li>Chrome バージョン 138 以上（推奨: 140以上）</li>
                          <li>メモリ: 16GB以上推奨</li>
                          <li>ストレージ: 22GB以上の空き容量</li>
                          <li>GPU: 4GB VRAM以上、またはCPU: 4コア以上</li>
                        </ul>
                      </div>

                      {/* ステップバイステップガイド */}
                      <div className="setup-steps">
                        <h5>🔧 設定手順</h5>

                        {CHROME_FLAGS.map((flag, index) => (
                          <div key={flag.id} className="setup-step">
                            <div className="step-number">Step {index + 1}</div>
                            <div className="step-content">
                              <p className="step-description">{flag.description}</p>
                              <div className="flag-url-container">
                                <code className="flag-url">{flag.url}</code>
                                <button
                                  className={`btn-copy ${copiedFlag === flag.id ? 'copied' : ''}`}
                                  onClick={() => copyToClipboard(flag.url, flag.id)}
                                >
                                  {copiedFlag === flag.id ? '✓ コピー済み' : '📋 コピー'}
                                </button>
                              </div>
                              <p className="step-value">
                                設定値: <strong>{flag.value}</strong>
                              </p>
                            </div>
                          </div>
                        ))}

                        <div className="setup-step">
                          <div className="step-number">Step 3</div>
                          <div className="step-content">
                            <p className="step-description">Chromeを再起動</p>
                            <p className="step-hint">設定変更後、Chromeを完全に終了して再起動してください。</p>
                          </div>
                        </div>

                        <div className="setup-step">
                          <div className="step-number">Step 4</div>
                          <div className="step-content">
                            <p className="step-description">モデルのダウンロードを待つ</p>
                            <p className="step-hint">
                              初回は約1.7GBのモデルがダウンロードされます。
                              バックグラウンドで行われるため、しばらくお待ちください。
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 参考リンク */}
                      <div className="reference-links">
                        <h5>📚 参考リンク</h5>
                        <a
                          href="https://developer.chrome.com/docs/ai/get-started"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Chrome AI 公式ドキュメント
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="actions">
          <button className="btn btn-primary" onClick={handleSave}>
            設定を保存
          </button>
          {saved && <span className="saved-message">保存しました！</span>}
        </div>
      </main>

      <footer className="footer">
        <p>APIキーはローカルに保存され、外部に送信されることはありません。</p>
      </footer>
    </div>
  );
}
