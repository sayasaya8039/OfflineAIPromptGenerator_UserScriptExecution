/**
 * マルチプロバイダーAI連携モジュール
 * Chrome Built-in AI / Gemini API / OpenAI API 対応
 */

import type { AIStatus, AIProvider, Settings } from '../types';

// システムプロンプト（コード生成用）
const SYSTEM_PROMPT = `あなたはJavaScriptコード生成の専門家です。
ユーザーの指示に基づいて、ウェブページで実行可能なJavaScriptコードを生成してください。

ルール:
1. 純粋なJavaScriptコードのみを出力（説明文やマークダウンは不要）
2. コードは即時実行可能な形式で
3. document や window などのブラウザAPIを活用
4. エラーハンドリングを含める
5. 結果を console.log で出力するか、ページに視覚的に反映させる
6. コードブロック(\`\`\`)で囲まない、純粋なJSコードのみ

例:
指示: 「ページの背景色を青にする」
出力:
document.body.style.backgroundColor = '#0066cc';
console.log('背景色を青に変更しました');`;

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
 * Chrome Built-in AI チェック
 */
async function checkChromeAI(): Promise<{ status: AIStatus; message?: string; provider: AIProvider }> {
  try {
    // @ts-expect-error - Chrome AI API
    if (typeof self !== 'undefined' && self.ai?.languageModel) {
      // @ts-expect-error - Chrome AI API
      const capabilities = await self.ai.languageModel.capabilities();
      if (capabilities.available === 'readily') {
        return { status: 'ready', message: 'Chrome AI準備完了', provider: 'chrome-ai' };
      } else if (capabilities.available === 'after-download') {
        return { status: 'downloading', message: 'AIモデルをダウンロード中', provider: 'chrome-ai' };
      }
    }
    return {
      status: 'unavailable',
      message: 'Chrome AIが利用できません。Gemini APIまたはOpenAI APIを設定してください。',
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
 * Chrome Built-in AI で生成
 */
async function generateWithChromeAI(userPrompt: string): Promise<string> {
  // @ts-expect-error - Chrome AI API
  if (!self.ai?.languageModel) {
    throw new Error('Chrome AIが利用できません');
  }

  // @ts-expect-error - Chrome AI API
  const session = await self.ai.languageModel.create({
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.3,
    topK: 3,
  });

  const fullPrompt = `指示: ${userPrompt}\n\nJavaScriptコードのみを出力:`;
  const response = await session.prompt(fullPrompt);
  session.destroy();

  return extractCode(response);
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
 * レスポンスからコードを抽出
 */
function extractCode(response: string): string {
  // コードブロックが含まれている場合は抽出
  const codeMatch = response.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }
  return response.trim();
}

// 要約用システムプロンプト
const SUMMARIZE_PROMPT = `あなたは文章要約の専門家です。
与えられたウェブページのテキストを要約してください。

【重要】元の言語に関係なく、必ず日本語で要約を出力してください。
英語、中国語、韓国語など、どの言語のページでも日本語に翻訳して要約します。

ルール:
1. 必ず日本語で出力する（翻訳＋要約）
2. 重要なポイントを箇条書きで3-5点にまとめる
3. 最初に1-2文で全体の概要を述べる
4. 専門用語があれば簡単に説明を加える
5. マークダウン形式で出力（見出し、箇条書きを使用）
6. 元の文章にない情報は追加しない`;

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
 * Chrome Built-in AI で要約
 */
async function summarizeWithChromeAI(text: string): Promise<string> {
  // @ts-expect-error - Chrome AI API
  if (!self.ai?.languageModel) {
    throw new Error('Chrome AIが利用できません');
  }

  // @ts-expect-error - Chrome AI API
  const session = await self.ai.languageModel.create({
    systemPrompt: SUMMARIZE_PROMPT,
    temperature: 0.3,
    topK: 3,
  });

  const response = await session.prompt(`以下のテキストを要約してください:\n\n${text}`);
  session.destroy();

  return response;
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
