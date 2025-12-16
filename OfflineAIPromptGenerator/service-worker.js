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
const INITIAL_PROMPTS_CODE = [
  {
    role: "user",
    content: "指示: ページの背景色を青にする\n\nJavaScriptコードのみを出力:"
  },
  {
    role: "assistant",
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
    role: "user",
    content: "指示: 全ての画像をグレースケールにする\n\nJavaScriptコードのみを出力:"
  },
  {
    role: "assistant",
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
    role: "user",
    content: "指示: ページ内のリンクを全て赤色にする\n\nJavaScriptコードのみを出力:"
  },
  {
    role: "assistant",
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
async function getSettings() {
  const result = await chrome.storage.local.get("settings");
  return result.settings || { provider: "gemini", geminiApiKey: "", openaiApiKey: "" };
}
async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}
async function checkAIAvailability() {
  const settings = await getSettings();
  switch (settings.provider) {
    case "chrome-ai":
      return checkChromeAI();
    case "gemini":
      return checkGeminiAPI(settings.geminiApiKey);
    case "openai":
      return checkOpenAIAPI(settings.openaiApiKey);
    default:
      return { status: "error", message: "不明なプロバイダーです" };
  }
}
async function checkChromeAI() {
  var _a;
  try {
    if (typeof self !== "undefined" && ((_a = self.ai) == null ? void 0 : _a.languageModel)) {
      const languageModel = self.ai.languageModel;
      let availability;
      if (typeof languageModel.availability === "function") {
        availability = await languageModel.availability();
      } else if (typeof languageModel.capabilities === "function") {
        const caps = await languageModel.capabilities();
        availability = caps.available;
      } else {
        return {
          status: "unavailable",
          message: "Chrome AI APIが見つかりません",
          provider: "chrome-ai"
        };
      }
      let paramsInfo = "";
      if (typeof languageModel.params === "function") {
        try {
          const params = await languageModel.params();
          paramsInfo = ` (topK: ${params.defaultTopK}, temp: ${params.defaultTemperature})`;
        } catch {
        }
      }
      switch (availability) {
        case "readily":
        case "ready":
          return {
            status: "ready",
            message: `Chrome AI準備完了${paramsInfo}`,
            provider: "chrome-ai"
          };
        case "after-download":
        case "downloadable":
          return {
            status: "downloading",
            message: "AIモデルのダウンロードが必要です",
            provider: "chrome-ai"
          };
        case "downloading":
          return {
            status: "downloading",
            message: "AIモデルをダウンロード中...",
            provider: "chrome-ai"
          };
        default:
          return {
            status: "unavailable",
            message: "Chrome AIが利用できません。Gemini APIまたはOpenAI APIを設定してください。",
            provider: "chrome-ai"
          };
      }
    }
    return {
      status: "unavailable",
      message: "Chrome AIが利用できません。Chromeフラグを有効化してください。",
      provider: "chrome-ai"
    };
  } catch (error) {
    return {
      status: "error",
      message: `Chrome AI エラー: ${error instanceof Error ? error.message : String(error)}`,
      provider: "chrome-ai"
    };
  }
}
function checkGeminiAPI(apiKey) {
  if (!apiKey) {
    return {
      status: "no-api-key",
      message: "Gemini APIキーが設定されていません。設定画面でAPIキーを入力してください。",
      provider: "gemini"
    };
  }
  return { status: "ready", message: "Gemini API準備完了", provider: "gemini" };
}
function checkOpenAIAPI(apiKey) {
  if (!apiKey) {
    return {
      status: "no-api-key",
      message: "OpenAI APIキーが設定されていません。設定画面でAPIキーを入力してください。",
      provider: "openai"
    };
  }
  return { status: "ready", message: "OpenAI API準備完了", provider: "openai" };
}
async function generateScript(userPrompt) {
  const settings = await getSettings();
  switch (settings.provider) {
    case "chrome-ai":
      return generateWithChromeAI(userPrompt);
    case "gemini":
      return generateWithGemini(userPrompt, settings.geminiApiKey);
    case "openai":
      return generateWithOpenAI(userPrompt, settings.openaiApiKey);
    default:
      throw new Error("不明なプロバイダーです");
  }
}
async function generateWithChromeAI(userPrompt) {
  var _a;
  if (!((_a = self.ai) == null ? void 0 : _a.languageModel)) {
    throw new Error("Chrome AIが利用できません");
  }
  const languageModel = self.ai.languageModel;
  const sessionOptions = {
    systemPrompt: SYSTEM_PROMPT,
    // 精度向上: より低いtemperatureで決定的な出力
    temperature: 0.1,
    topK: 3,
    // Few-shot学習: 具体例を提供してモデルの出力形式を誘導
    initialPrompts: INITIAL_PROMPTS_CODE
  };
  try {
    const availability = await languageModel.availability({
      expectedInputLanguages: ["ja"],
      expectedOutputLanguages: ["ja"]
    });
    if (availability === "readily" || availability === "ready") {
      sessionOptions.expectedInputLanguages = ["ja"];
      sessionOptions.expectedOutputLanguages = ["ja"];
    }
  } catch {
  }
  const session = await languageModel.create(sessionOptions);
  try {
    const fullPrompt = `指示: ${userPrompt}

JavaScriptコードのみを出力:`;
    const response = await session.prompt(fullPrompt);
    return extractCode(response);
  } finally {
    if (session.destroy) {
      session.destroy();
    }
  }
}
async function generateWithGemini(userPrompt, apiKey) {
  var _a, _b, _c, _d, _e, _f;
  if (!apiKey) {
    throw new Error("Gemini APIキーが設定されていません");
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}

指示: ${userPrompt}

JavaScriptコードのみを出力:`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API エラー: ${((_a = error.error) == null ? void 0 : _a.message) || response.statusText}`);
  }
  const data = await response.json();
  const text = ((_f = (_e = (_d = (_c = (_b = data.candidates) == null ? void 0 : _b[0]) == null ? void 0 : _c.content) == null ? void 0 : _d.parts) == null ? void 0 : _e[0]) == null ? void 0 : _f.text) || "";
  return extractCode(text);
}
async function generateWithOpenAI(userPrompt, apiKey) {
  var _a, _b, _c, _d;
  if (!apiKey) {
    throw new Error("OpenAI APIキーが設定されていません");
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `指示: ${userPrompt}

JavaScriptコードのみを出力:` }
      ],
      temperature: 0.3,
      max_tokens: 2048
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API エラー: ${((_a = error.error) == null ? void 0 : _a.message) || response.statusText}`);
  }
  const data = await response.json();
  const text = ((_d = (_c = (_b = data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content) || "";
  return extractCode(text);
}
function extractCode(response) {
  let code = response.trim();
  const codeBlockMatch = code.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    code = codeBlockMatch[1].trim();
  }
  code = code.replace(/^(はい|わかりました|承知しました|以下|コード)[、。：:\s]*/i, "");
  code = code.replace(/\n\n(このコード|上記|以上|これで)[^\n]*$/i, "");
  code = code.replace(/^>\s*/gm, "");
  if (!code || code.length < 5) {
    throw new Error("有効なコードを生成できませんでした");
  }
  return code;
}
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
const INITIAL_PROMPTS_SUMMARIZE = [
  {
    role: "user",
    content: "以下のテキストを要約してください:\n\nReact is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called components."
  },
  {
    role: "assistant",
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
async function summarizeText(text) {
  const settings = await getSettings();
  const maxLength = 15e3;
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "\n\n[...以下省略...]" : text;
  switch (settings.provider) {
    case "chrome-ai":
      return summarizeWithChromeAI(truncatedText);
    case "gemini":
      return summarizeWithGemini(truncatedText, settings.geminiApiKey);
    case "openai":
      return summarizeWithOpenAI(truncatedText, settings.openaiApiKey);
    default:
      throw new Error("不明なプロバイダーです");
  }
}
async function summarizeWithChromeAI(text) {
  var _a;
  if (!((_a = self.ai) == null ? void 0 : _a.languageModel)) {
    throw new Error("Chrome AIが利用できません");
  }
  const languageModel = self.ai.languageModel;
  const sessionOptions = {
    systemPrompt: SUMMARIZE_PROMPT,
    temperature: 0.3,
    topK: 5,
    // Few-shot学習: 具体例を提供
    initialPrompts: INITIAL_PROMPTS_SUMMARIZE
  };
  try {
    const availability = await languageModel.availability({
      expectedOutputLanguages: ["ja"]
    });
    if (availability === "readily" || availability === "ready") {
      sessionOptions.expectedOutputLanguages = ["ja"];
    }
  } catch {
  }
  const session = await languageModel.create(sessionOptions);
  try {
    const response = await session.prompt(`以下のテキストを要約してください:

${text}`);
    return response;
  } finally {
    if (session.destroy) {
      session.destroy();
    }
  }
}
async function summarizeWithGemini(text, apiKey) {
  var _a, _b, _c, _d, _e, _f;
  if (!apiKey) {
    throw new Error("Gemini APIキーが設定されていません");
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SUMMARIZE_PROMPT}

以下のテキストを要約してください:

${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API エラー: ${((_a = error.error) == null ? void 0 : _a.message) || response.statusText}`);
  }
  const data = await response.json();
  return ((_f = (_e = (_d = (_c = (_b = data.candidates) == null ? void 0 : _b[0]) == null ? void 0 : _c.content) == null ? void 0 : _d.parts) == null ? void 0 : _e[0]) == null ? void 0 : _f.text) || "要約を生成できませんでした";
}
async function summarizeWithOpenAI(text, apiKey) {
  var _a, _b, _c, _d;
  if (!apiKey) {
    throw new Error("OpenAI APIキーが設定されていません");
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SUMMARIZE_PROMPT },
        { role: "user", content: `以下のテキストを要約してください:

${text}` }
      ],
      temperature: 0.3,
      max_tokens: 2048
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API エラー: ${((_a = error.error) == null ? void 0 : _a.message) || response.statusText}`);
  }
  const data = await response.json();
  return ((_d = (_c = (_b = data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content) || "要約を生成できませんでした";
}
let scriptCounter = 0;
async function executeScript(tabId, code) {
  const startTime = Date.now();
  const scriptId = `ai-script-${++scriptCounter}`;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) {
      throw new Error("タブのURLを取得できません");
    }
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
      throw new Error("このページではスクリプトを実行できません");
    }
    try {
      const existingScripts = await chrome.userScripts.getScripts();
      if (existingScripts.length > 0) {
        await chrome.userScripts.unregister({ ids: existingScripts.map((s) => s.id) });
      }
    } catch {
    }
    const url = new URL(tab.url);
    const matchPattern = `${url.protocol}//${url.host}/*`;
    await chrome.userScripts.register([{
      id: scriptId,
      matches: [matchPattern],
      js: [{ code: wrapCode(code) }],
      runAt: "document_end",
      world: "MAIN"
    }]);
    await chrome.tabs.reload(tabId);
    setTimeout(async () => {
      try {
        await chrome.userScripts.unregister({ ids: [scriptId] });
      } catch {
      }
    }, 3e3);
    return {
      success: true,
      result: "スクリプトを実行しました",
      executedAt: startTime
    };
  } catch (error) {
    console.error("Script execution failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executedAt: startTime
    };
  }
}
function wrapCode(code) {
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
async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if ((tab == null ? void 0 : tab.id) && tab.url) {
      return { tabId: tab.id, url: tab.url };
    }
    return null;
  } catch (error) {
    console.error("Failed to get current tab:", error);
    return null;
  }
}
async function extractPageText(tabId) {
  var _a;
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const excludeSelectors = ["script", "style", "noscript", "nav", "header", "footer", "aside", "iframe"];
      const clone = document.body.cloneNode(true);
      excludeSelectors.forEach((selector) => {
        clone.querySelectorAll(selector).forEach((el) => el.remove());
      });
      const text = clone.innerText || clone.textContent || "";
      return text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0).join("\n");
    }
  });
  return ((_a = results[0]) == null ? void 0 : _a.result) || "";
}
async function showSummaryOverlay(tabId, summary) {
  await chrome.scripting.executeScript({
    target: { tabId },
    args: [summary],
    func: (summaryText) => {
      const existingOverlay = document.getElementById("ai-summary-overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }
      const overlay = document.createElement("div");
      overlay.id = "ai-summary-overlay";
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
      const contentEl = overlay.querySelector(".summary-content");
      const htmlContent = summaryText.replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/^\* (.+)$/gm, "<li>$1</li>").replace(/^- (.+)$/gm, "<li>$1</li>").replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
      contentEl.innerHTML = `<p>${htmlContent}</p>`;
      const closeBtn = overlay.querySelector(".close-btn");
      closeBtn == null ? void 0 : closeBtn.addEventListener("click", () => overlay.remove());
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });
      const escHandler = (e) => {
        if (e.key === "Escape") {
          overlay.remove();
          document.removeEventListener("keydown", escHandler);
        }
      };
      document.addEventListener("keydown", escHandler);
    }
  });
}
chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    handleMessage(message).then(sendResponse).catch((error) => {
      console.error("Message handling error:", error);
      sendResponse({
        type: "ERROR",
        message: error instanceof Error ? error.message : String(error)
      });
    });
    return true;
  }
);
async function handleMessage(message) {
  switch (message.type) {
    case "CHECK_AI_STATUS": {
      const { status, message: statusMessage, provider } = await checkAIAvailability();
      return { type: "AI_STATUS", status, message: statusMessage, provider };
    }
    case "GENERATE_SCRIPT": {
      const code = await generateScript(message.prompt);
      return { type: "SCRIPT_GENERATED", code };
    }
    case "EXECUTE_SCRIPT": {
      const result = await executeScript(message.tabId, message.code);
      return { type: "SCRIPT_EXECUTED", result };
    }
    case "GET_CURRENT_TAB": {
      const tab = await getCurrentTab();
      if (tab) {
        return { type: "CURRENT_TAB", tabId: tab.tabId, url: tab.url };
      }
      throw new Error("アクティブなタブが見つかりません");
    }
    case "GET_SETTINGS": {
      const settings = await getSettings();
      return { type: "SETTINGS", settings };
    }
    case "SAVE_SETTINGS": {
      await saveSettings(message.settings);
      return { type: "SETTINGS_SAVED" };
    }
    case "SUMMARIZE_PAGE": {
      const pageText = await extractPageText(message.tabId);
      if (!pageText || pageText.length < 100) {
        throw new Error("ページからテキストを抽出できませんでした");
      }
      const summary = await summarizeText(pageText);
      await showSummaryOverlay(message.tabId, summary);
      return { type: "SUMMARIZE_RESULT", success: true, summary };
    }
    default:
      throw new Error("不明なメッセージタイプです");
  }
}
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Offline AI Script Generator がインストールされました");
    chrome.runtime.openOptionsPage();
  } else if (details.reason === "update") {
    console.log(`バージョン ${chrome.runtime.getManifest().version} に更新されました`);
  }
});
