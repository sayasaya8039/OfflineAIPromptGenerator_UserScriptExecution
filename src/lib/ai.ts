/**
 * Chrome Built-in AI (Gemini Nano) 連携モジュール
 * オフラインでJavaScriptコードを生成する
 */

import type { AIStatus } from '../types';
import '../types/chrome-ai.d.ts';

// AIセッションのキャッシュ
let cachedSession: LanguageModelSession | null = null;

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
 * AI利用可能状態をチェック
 */
export async function checkAIAvailability(): Promise<{ status: AIStatus; message?: string }> {
  try {
    // LanguageModel APIが存在するか確認
    if (typeof LanguageModel === 'undefined') {
      // フォールバック: window.ai を確認
      if (typeof window !== 'undefined' && window.ai?.languageModel) {
        const availability = await window.ai.languageModel.availability();
        return mapAvailability(availability);
      }
      return {
        status: 'unavailable',
        message: 'Chrome Built-in AI APIが利用できません。Chrome 138以上が必要です。',
      };
    }

    const availability = await LanguageModel.availability();
    return mapAvailability(availability);
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
function mapAvailability(availability: LanguageModelAvailability): { status: AIStatus; message?: string } {
  switch (availability.available) {
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
      return { status: 'error', message: '不明なステータスです' };
  }
}

/**
 * AIセッションを取得（キャッシュ利用）
 */
async function getSession(): Promise<LanguageModelSession> {
  if (cachedSession) {
    return cachedSession;
  }

  let languageModel: LanguageModel;

  if (typeof LanguageModel !== 'undefined') {
    languageModel = LanguageModel;
  } else if (typeof window !== 'undefined' && window.ai?.languageModel) {
    languageModel = window.ai.languageModel;
  } else {
    throw new Error('LanguageModel APIが利用できません');
  }

  cachedSession = await languageModel.create({
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.3, // コード生成は低温度で安定性重視
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

  // そのまま返す
  return response.trim();
}

/**
 * ストリーミングでコード生成
 */
export async function generateScriptStreaming(
  userPrompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const session = await getSession();

  const fullPrompt = `以下の指示に従って、ウェブページで実行するJavaScriptコードを生成してください。

指示: ${userPrompt}

JavaScriptコードのみを出力してください:`;

  const stream = session.promptStreaming(fullPrompt);
  const reader = stream.getReader();
  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullResponse += value;
      onChunk(value);
    }
  } finally {
    reader.releaseLock();
  }

  // コードブロックが含まれている場合は抽出
  const codeMatch = fullResponse.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }

  return fullResponse.trim();
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
