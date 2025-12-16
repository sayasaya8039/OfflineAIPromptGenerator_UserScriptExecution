/**
 * 設定画面コンポーネント
 */

import { useState, useEffect } from 'react';
import type { Settings, AIProvider } from '../types';
import './styles/options.css';

const VERSION = '1.1.0';

export function Options() {
  const [settings, setSettings] = useState<Settings>({
    provider: 'gemini',
    geminiApiKey: '',
    openaiApiKey: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // 設定を読み込み
  useEffect(() => {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
      setLoading(false);
    });
  }, []);

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
                オフラインで動作。Chrome 138+とフラグ設定が必要です。
              </p>
              {settings.provider === 'chrome-ai' && (
                <div className="chrome-ai-info">
                  <p>必要な設定:</p>
                  <ol>
                    <li><code>chrome://flags/#prompt-api-for-gemini-nano</code> → Enabled</li>
                    <li><code>chrome://flags/#optimization-guide-on-device-model</code> → Enabled BypassPerfRequirement</li>
                  </ol>
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
