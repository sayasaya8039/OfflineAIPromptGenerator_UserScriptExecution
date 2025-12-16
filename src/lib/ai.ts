/**
 * マルチプロバイダーAI連携モジュール
 * Chrome Built-in AI / Gemini API / OpenAI API 対応
 *
 * Chrome 140以降のPrompt API最新仕様に対応
 * - 言語サポート（日本語、英語、スペイン語）
 * - initialPromptsによるFew-shot学習
 * - パラメータ最適化
 */

import type { AIStatus, AIProvider, Settings } from '../types';

// システムプロンプト（コード生成用）- 精度向上のため詳細化
const SYSTEM_PROMPT = `あなたはJavaScriptコード生成の専門家です。
ユーザーの自然言語による指示を、ウェブページで即座に実行可能なJavaScriptコードに変換します。

【絶対ルール】
- 純粋なJavaScriptコードのみを出力する
- 説明文、コメント、マークダウン記法は一切不要
- コードブロック(\`\`\`javascript や \`\`\`)で囲まない
- 「はい」「わかりました」などの応答は不要

【コード要件】
- 即時実行可能な形式（関数定義のみは不可）
- document, window, DOM APIを適切に使用
- querySelectorAll, getElementByIdなどで要素を取得
- 処理完了時はconsole.logで結果を出力
- try-catchでエラーを適切にハンドリング

【出力形式】
コードのみを出力。以下の形式で：
(function() {
  // 処理コード
})();`;

// Few-shot用の初期プロンプト（精度向上のための例示）
const INITIAL_PROMPTS_CODE = [
  {
    role: 'user' as const,
    content: '指示: ページの背景色を青にする\n\nJavaScriptコードのみを出力:'
  },
  {
    role: 'assistant' as const,
    content: `(function() {
  try {
    document.body.style.backgroundColor = '#0066cc';
    console.log('背景色を青に変更しました');
  } catch(e) {
    console.error('エラー:', e.message);
  }
})();`
  },
  {
    role: 'user' as const,
    content: '指示: 全ての画像をグレースケールにする\n\nJavaScriptコードのみを出力:'
  },
  {
    role: 'assistant' as const,
    content: `(function() {
  try {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.style.filter = 'grayscale(100%)';
    });
    console.log(images.length + '個の画像をグレースケールに変更しました');
  } catch(e) {
    console.error('エラー:', e.message);
  }
})();`
  },
  {
    role: 'user' as const,
    content: '指示: ページ内のリンクを全て赤色にする\n\nJavaScriptコードのみを出力:'
  },
  {
    role: 'assistant' as const,
    content: `(function() {
  try {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      link.style.color = '#ff0000';
    });
    console.log(links.length + '個のリンクを赤色に変更しました');
  } catch(e) {
    console.error('エラー:', e.message);
  }
})();`
  }
];

/**
 * 設定を取得
 */
export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get('settings');
  return result.settings || { provider: 'gemini', geminiApiKey: '', openaiApiKey: '' };
}

/**
 * 設定を保存
 */
export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

/**
 * AI利用可能状態をチェック
 */
export async function checkAIAvailability(): Promise<{ status: AIStatus; message?: string; provider?: AIProvider }> {
  const settings = await getSettings();

  switch (settings.provider) {
    case 'chrome-ai':
      return checkChromeAI();
    case 'gemini':
      return checkGeminiAPI(settings.geminiApiKey);
    case 'openai':
      return checkOpenAIAPI(settings.openaiApiKey);
    default:
      return { status: 'error', message: '不明なプロバイダーです' };
  }
}

/**
 * Chrome Built-in AI チェック（Chrome 140以降の新API対応）
 */
async function checkChromeAI(): Promise<{ status: AIStatus; message?: string; provider: AIProvider }> {
  try {
    // @ts-expect-error - Chrome AI API
    if (typeof self !== 'undefined' && self.ai?.languageModel) {
      // Chrome 140以降: availability() または capabilities() を使用
      // @ts-expect-error - Chrome AI API
      const languageModel = self.ai.languageModel;

      // 新しいAPI（Chrome 140+）でavailabilityをチェック
      let availability: string;
      if (typeof languageModel.availability === 'function') {
        availability = await languageModel.availability();
      } else if (typeof languageModel.capabilities === 'function') {
        // 旧API（フォールバック）
        const caps = await languageModel.capabilities();
        availability = caps.available;
      } else {
        return {
          status: 'unavailable',
          message: 'Chrome AI APIが見つかりません',
          provider: 'chrome-ai'
        };
      }

      // パラメータ情報を取得（Chrome 140+）
      let paramsInfo = '';
      if (typeof languageModel.params === 'function') {
        try {
          const params = await languageModel.params();
          paramsInfo = ` (topK: ${params.defaultTopK}, temp: ${params.defaultTemperature})`;
        } catch {
          // パラメータ取得失敗は無視
        }
      }

      switch (availability) {
        case 'readily':
        case 'ready':
          return {
            status: 'ready',
            message: `Chrome AI準備完了${paramsInfo}`,
            provider: 'chrome-ai'
          };
        case 'after-download':
        case 'downloadable':
          return {
            status: 'downloading',
            message: 'AIモデルのダウンロードが必要です',
            provider: 'chrome-ai'
          };
        case 'downloading':
          return {
            status: 'downloading',
            message: 'AIモデルをダウンロード中...',
            provider: 'chrome-ai'
          };
        default:
          return {
            status: 'unavailable',
            message: 'Chrome AIが利用できません。Gemini APIまたはOpenAI APIを設定してください。',
            provider: 'chrome-ai'
          };
      }
    }
    return {
      status: 'unavailable',
      message: 'Chrome AIが利用できません。Chromeフラグを有効化してください。',
      provider: 'chrome-ai'
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Chrome AI エラー: ${error instanceof Error ? error.message : String(error)}`,
      provider: 'chrome-ai'
    };
  }
}

/**
 * Gemini API チェック
 */
function checkGeminiAPI(apiKey: string): { status: AIStatus; message?: string; provider: AIProvider } {
  if (!apiKey) {
    return {
      status: 'no-api-key',
      message: 'Gemini APIキーが設定されていません。設定画面でAPIキーを入力してください。',
      provider: 'gemini'
    };
  }
  return { status: 'ready', message: 'Gemini API準備完了', provider: 'gemini' };
}

/**
 * OpenAI API チェック
 */
function checkOpenAIAPI(apiKey: string): { status: AIStatus; message?: string; provider: AIProvider } {
  if (!apiKey) {
    return {
      status: 'no-api-key',
      message: 'OpenAI APIキーが設定されていません。設定画面でAPIキーを入力してください。',
      provider: 'openai'
    };
  }
  return { status: 'ready', message: 'OpenAI API準備完了', provider: 'openai' };
}

/**
 * プロンプトからJavaScriptコードを生成
 */
export async function generateScript(userPrompt: string): Promise<string> {
  const settings = await getSettings();

  switch (settings.provider) {
    case 'chrome-ai':
      return generateWithChromeAI(userPrompt);
    case 'gemini':
      return generateWithGemini(userPrompt, settings.geminiApiKey);
    case 'openai':
      return generateWithOpenAI(userPrompt, settings.openaiApiKey);
    default:
      throw new Error('不明なプロバイダーです');
  }
}

/**
 * Chrome Built-in AI で生成（Chrome 140以降の最新API対応）
 *
 * 精度向上のための実装:
 * 1. 言語サポート（日本語入出力を明示）
 * 2. initialPromptsによるFew-shot学習
 * 3. 低いtemperature（0.1）で一貫性のある出力
 * 4. topK=3で候補を絞り込み
 */
async function generateWithChromeAI(userPrompt: string): Promise<string> {
  // @ts-expect-error - Chrome AI API
  if (!self.ai?.languageModel) {
    throw new Error('Chrome AIが利用できません');
  }

  // @ts-expect-error - Chrome AI API
  const languageModel = self.ai.languageModel;

  // セッション作成オプション（Chrome 140以降対応）
  const sessionOptions: Record<string, unknown> = {
    systemPrompt: SYSTEM_PROMPT,
    // 精度向上: より低いtemperatureで決定的な出力
    temperature: 0.1,
    topK: 3,
    // Few-shot学習: 具体例を提供してモデルの出力形式を誘導
    initialPrompts: INITIAL_PROMPTS_CODE,
  };

  // Chrome 140以降: 言語サポートを明示的に指定
  // expectedInputs/expectedOutputsが使える場合は使用
  try {
    const availability = await languageModel.availability({
      expectedInputLanguages: ['ja'],
      expectedOutputLanguages: ['ja'],
    });
    if (availability === 'readily' || availability === 'ready') {
      // 日本語サポートが利用可能な場合、言語設定を追加
      sessionOptions.expectedInputLanguages = ['ja'];
      sessionOptions.expectedOutputLanguages = ['ja'];
    }
  } catch {
    // 言語サポートチェック失敗は無視（旧APIでは非対応）
  }

  const session = await languageModel.create(sessionOptions);

  try {
    const fullPrompt = `指示: ${userPrompt}\n\nJavaScriptコードのみを出力:`;
    const response = await session.prompt(fullPrompt);
    return extractCode(response);
  } finally {
    // セッションを確実に破棄
    if (session.destroy) {
      session.destroy();
    }
  }
}

/**
 * Gemini API で生成
 */
async function generateWithGemini(userPrompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\n指示: ${userPrompt}\n\nJavaScriptコードのみを出力:`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API エラー: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return extractCode(text);
}

/**
 * OpenAI API で生成
 */
async function generateWithOpenAI(userPrompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `指示: ${userPrompt}\n\nJavaScriptコードのみを出力:` }
      ],
      temperature: 0.3,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API エラー: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return extractCode(text);
}

/**
 * レスポンスからコードを抽出（精度向上のため複数パターン対応）
 */
function extractCode(response: string): string {
  let code = response.trim();

  // パターン1: マークダウンのコードブロック（```javascript または ```js または ```）
  const codeBlockMatch = code.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    code = codeBlockMatch[1].trim();
  }

  // パターン2: 先頭の「はい」「わかりました」などの応答を除去
  code = code.replace(/^(はい|わかりました|承知しました|以下|コード)[、。：:\s]*/i, '');

  // パターン3: 末尾の説明文を除去（「このコードは〜」など）
  code = code.replace(/\n\n(このコード|上記|以上|これで)[^\n]*$/i, '');

  // パターン4: 行頭のインデント記号を除去（> など）
  code = code.replace(/^>\s*/gm, '');

  // コードが空の場合はエラー
  if (!code || code.length < 5) {
    throw new Error('有効なコードを生成できませんでした');
  }

  return code;
}

// 要約用システムプロンプト（精度向上のため詳細化）
const SUMMARIZE_PROMPT = `あなたは文章要約の専門家です。
与えられたウェブページのテキストを要約してください。

【絶対ルール】
- 必ず日本語で出力する（英語等のページも日本語に翻訳して要約）
- 元の文章にない情報は絶対に追加しない
- 推測や解釈は含めない

【出力形式】
## 概要
1-2文で全体の内容を要約

## 主要ポイント
- ポイント1
- ポイント2
- ポイント3
（3-5点）

## キーワード
重要な用語をカンマ区切りで列挙`;

// 要約用のFew-shot例
const INITIAL_PROMPTS_SUMMARIZE = [
  {
    role: 'user' as const,
    content: '以下のテキストを要約してください:\n\nReact is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called components.'
  },
  {
    role: 'assistant' as const,
    content: `## 概要
ReactはユーザーインターフェースをつくるためのJavaScriptライブラリです。

## 主要ポイント
- JavaScriptライブラリである
- UIの構築に特化している
- コンポーネントという小さな部品を組み合わせて複雑なUIを作成する

## キーワード
React, JavaScript, ライブラリ, UI, コンポーネント`
  }
];

/**
 * ページテキストを要約
 */
export async function summarizeText(text: string): Promise<string> {
  const settings = await getSettings();

  // テキストが長すぎる場合は切り詰め
  const maxLength = 15000;
  const truncatedText = text.length > maxLength
    ? text.substring(0, maxLength) + '\n\n[...以下省略...]'
    : text;

  switch (settings.provider) {
    case 'chrome-ai':
      return summarizeWithChromeAI(truncatedText);
    case 'gemini':
      return summarizeWithGemini(truncatedText, settings.geminiApiKey);
    case 'openai':
      return summarizeWithOpenAI(truncatedText, settings.openaiApiKey);
    default:
      throw new Error('不明なプロバイダーです');
  }
}

/**
 * Chrome Built-in AI で要約（Chrome 140以降の最新API対応）
 *
 * 精度向上のための実装:
 * 1. 言語サポート（日本語出力を明示）
 * 2. initialPromptsによるFew-shot学習
 * 3. 適切なtemperature（0.3）で自然な要約
 */
async function summarizeWithChromeAI(text: string): Promise<string> {
  // @ts-expect-error - Chrome AI API
  if (!self.ai?.languageModel) {
    throw new Error('Chrome AIが利用できません');
  }

  // @ts-expect-error - Chrome AI API
  const languageModel = self.ai.languageModel;

  // セッション作成オプション
  const sessionOptions: Record<string, unknown> = {
    systemPrompt: SUMMARIZE_PROMPT,
    temperature: 0.3,
    topK: 5,
    // Few-shot学習: 具体例を提供
    initialPrompts: INITIAL_PROMPTS_SUMMARIZE,
  };

  // Chrome 140以降: 言語サポートを明示的に指定
  try {
    const availability = await languageModel.availability({
      expectedOutputLanguages: ['ja'],
    });
    if (availability === 'readily' || availability === 'ready') {
      sessionOptions.expectedOutputLanguages = ['ja'];
    }
  } catch {
    // 言語サポートチェック失敗は無視
  }

  const session = await languageModel.create(sessionOptions);

  try {
    const response = await session.prompt(`以下のテキストを要約してください:\n\n${text}`);
    return response;
  } finally {
    if (session.destroy) {
      session.destroy();
    }
  }
}

/**
 * Gemini API で要約
 */
async function summarizeWithGemini(text: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SUMMARIZE_PROMPT}\n\n以下のテキストを要約してください:\n\n${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API エラー: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '要約を生成できませんでした';
}

/**
 * OpenAI API で要約
 */
async function summarizeWithOpenAI(text: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SUMMARIZE_PROMPT },
        { role: 'user', content: `以下のテキストを要約してください:\n\n${text}` }
      ],
      temperature: 0.3,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API エラー: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '要約を生成できませんでした';
}
