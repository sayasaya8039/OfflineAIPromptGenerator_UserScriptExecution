/**
 * Chrome Built-in AI (Gemini Nano) 連携モジュール
 * オフラインでJavaScriptコードを生成する
 */

import type { AIStatus } from '../types';

// AIセッションのキャッシュ
let cachedSession: AILanguageModelSession | null = null;

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

// 型定義（Chrome AI API）
interface AILanguageModel {
  availability(): Promise<string>;
  capabilities(): Promise<AILanguageModelCapabilities>;
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModelSession>;
}

interface AILanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

interface AILanguageModelCreateOptions {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
}

interface AILanguageModelSession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
}

interface AI {
  languageModel?: AILanguageModel;
}

// グローバルスコープの拡張
declare const self: {
  ai?: AI;
} & typeof globalThis;

/**
 * AI APIを取得
 */
function getAI(): AILanguageModel | null {
  // Service Worker環境: self.ai
  if (typeof self !== 'undefined' && self.ai?.languageModel) {
    return self.ai.languageModel;
  }
  return null;
}

/**
 * AI利用可能状態をチェック
 */
export async function checkAIAvailability(): Promise<{ status: AIStatus; message?: string }> {
  try {
    const ai = getAI();

    if (!ai) {
      return {
        status: 'unavailable',
        message: 'Chrome Built-in AI APIが利用できません。Chrome 138以上が必要で、chrome://flags でPrompt APIを有効にしてください。',
      };
    }

    // capabilities() を使用（より詳細な情報が取得できる）
    try {
      const capabilities = await ai.capabilities();
      return mapAvailability(capabilities.available);
    } catch {
      // capabilities()が失敗した場合はavailability()を試す
      const availability = await ai.availability();
      return mapAvailability(availability);
    }
  } catch (error) {
    console.error('AI availability check failed:', error);
    return {
      status: 'error',
      message: `AIの確認中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * 利用可能性をステータスにマッピング
 */
function mapAvailability(available: string): { status: AIStatus; message?: string } {
  switch (available) {
    case 'readily':
      return { status: 'ready', message: 'AIは利用可能です' };
    case 'after-download':
      return {
        status: 'downloading',
        message: 'AIモデルをダウンロード中です。初回のみ時間がかかります。',
      };
    case 'no':
      return {
        status: 'unavailable',
        message: 'このデバイスではAIを利用できません。システム要件を確認してください。',
      };
    default:
      return {
        status: 'error',
        message: `不明なステータスです: ${available}。chrome://flags でPrompt APIを有効にしてください。`
      };
  }
}

/**
 * AIセッションを取得（キャッシュ利用）
 */
async function getSession(): Promise<AILanguageModelSession> {
  if (cachedSession) {
    return cachedSession;
  }

  const ai = getAI();
  if (!ai) {
    throw new Error('LanguageModel APIが利用できません。chrome://flags でPrompt APIを有効にしてください。');
  }

  cachedSession = await ai.create({
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.3,
    topK: 3,
  });

  return cachedSession;
}

/**
 * プロンプトからJavaScriptコードを生成
 */
export async function generateScript(userPrompt: string): Promise<string> {
  const session = await getSession();

  const fullPrompt = `以下の指示に従って、ウェブページで実行するJavaScriptコードを生成してください。

指示: ${userPrompt}

JavaScriptコードのみを出力してください:`;

  const response = await session.prompt(fullPrompt);

  // コードブロックが含まれている場合は抽出
  const codeMatch = response.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }

  return response.trim();
}

/**
 * セッションをリセット
 */
export function resetSession(): void {
  if (cachedSession) {
    cachedSession.destroy();
    cachedSession = null;
  }
}
