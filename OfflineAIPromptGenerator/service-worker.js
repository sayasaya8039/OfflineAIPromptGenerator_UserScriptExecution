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
      const capabilities = await self.ai.languageModel.capabilities();
      if (capabilities.available === "readily") {
        return { status: "ready", message: "Chrome AI準備完了", provider: "chrome-ai" };
      } else if (capabilities.available === "after-download") {
        return { status: "downloading", message: "AIモデルをダウンロード中", provider: "chrome-ai" };
      }
    }
    return {
      status: "unavailable",
      message: "Chrome AIが利用できません。Gemini APIまたはOpenAI APIを設定してください。",
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
  const session = await self.ai.languageModel.create({
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.3,
    topK: 3
  });
  const fullPrompt = `指示: ${userPrompt}

JavaScriptコードのみを出力:`;
  const response = await session.prompt(fullPrompt);
  session.destroy();
  return extractCode(response);
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
  const codeMatch = response.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }
  return response.trim();
}
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
  const session = await self.ai.languageModel.create({
    systemPrompt: SUMMARIZE_PROMPT,
    temperature: 0.3,
    topK: 3
  });
  const response = await session.prompt(`以下のテキストを要約してください:

${text}`);
  session.destroy();
  return response;
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
              color: #FFFFFF;
            }
            #ai-summary-overlay .summary-content {
              color: #F1F5F9;
            }
            #ai-summary-overlay .summary-content h1,
            #ai-summary-overlay .summary-content h2,
            #ai-summary-overlay .summary-content h3 {
              color: #7DD3FC;
            }
            #ai-summary-overlay .summary-content strong {
              color: #FFFFFF;
            }
            #ai-summary-overlay .summary-content li {
              color: #F1F5F9;
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
