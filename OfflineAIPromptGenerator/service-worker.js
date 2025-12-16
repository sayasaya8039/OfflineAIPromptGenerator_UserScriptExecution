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
async function executeScript(tabId, code) {
  var _a;
  const startTime = Date.now();
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: executeUserCode,
      args: [code],
      world: "ISOLATED"
      // 拡張機能の分離環境で実行
    });
    const result = (_a = results[0]) == null ? void 0 : _a.result;
    if (result && typeof result === "object" && "success" in result) {
      return {
        success: result.success,
        result: result.result,
        error: result.error,
        executedAt: startTime
      };
    }
    return {
      success: true,
      result,
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
function executeUserCode(code) {
  try {
    const fn = new Function(code);
    const result = fn();
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
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
