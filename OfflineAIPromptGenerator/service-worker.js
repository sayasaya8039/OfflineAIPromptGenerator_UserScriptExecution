let cachedSession = null;
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
async function checkAIAvailability() {
  var _a;
  try {
    if (typeof LanguageModel === "undefined") {
      if (typeof window !== "undefined" && ((_a = window.ai) == null ? void 0 : _a.languageModel)) {
        const availability2 = await window.ai.languageModel.availability();
        return mapAvailability(availability2);
      }
      return {
        status: "unavailable",
        message: "Chrome Built-in AI APIが利用できません。Chrome 138以上が必要です。"
      };
    }
    const availability = await LanguageModel.availability();
    return mapAvailability(availability);
  } catch (error) {
    console.error("AI availability check failed:", error);
    return {
      status: "error",
      message: `AIの確認中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
function mapAvailability(availability) {
  switch (availability.available) {
    case "readily":
      return { status: "ready", message: "AIは利用可能です" };
    case "after-download":
      return {
        status: "downloading",
        message: "AIモデルをダウンロード中です。初回のみ時間がかかります。"
      };
    case "no":
      return {
        status: "unavailable",
        message: "このデバイスではAIを利用できません。システム要件を確認してください。"
      };
    default:
      return { status: "error", message: "不明なステータスです" };
  }
}
async function getSession() {
  var _a;
  if (cachedSession) {
    return cachedSession;
  }
  let languageModel;
  if (typeof LanguageModel !== "undefined") {
    languageModel = LanguageModel;
  } else if (typeof window !== "undefined" && ((_a = window.ai) == null ? void 0 : _a.languageModel)) {
    languageModel = window.ai.languageModel;
  } else {
    throw new Error("LanguageModel APIが利用できません");
  }
  cachedSession = await languageModel.create({
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.3,
    // コード生成は低温度で安定性重視
    topK: 3
  });
  return cachedSession;
}
async function generateScript(userPrompt) {
  const session = await getSession();
  const fullPrompt = `以下の指示に従って、ウェブページで実行するJavaScriptコードを生成してください。

指示: ${userPrompt}

JavaScriptコードのみを出力してください:`;
  const response = await session.prompt(fullPrompt);
  const codeMatch = response.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }
  return response.trim();
}
function resetSession() {
  if (cachedSession) {
    cachedSession.destroy();
    cachedSession = null;
  }
}
function isScriptingAvailable() {
  return typeof chrome !== "undefined" && typeof chrome.scripting !== "undefined";
}
async function executeScript(tabId, code) {
  var _a;
  const startTime = Date.now();
  try {
    if (!isScriptingAvailable()) {
      throw new Error("chrome.scripting APIが利用できません");
    }
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (codeToExecute) => {
        try {
          const fn = new Function(codeToExecute);
          const result = fn();
          return { success: true, result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      },
      args: [code],
      world: "MAIN"
      // ページのコンテキストで実行
    });
    const executionResult = (_a = results[0]) == null ? void 0 : _a.result;
    if (!executionResult) {
      throw new Error("スクリプトの実行結果を取得できませんでした");
    }
    return {
      success: executionResult.success,
      result: executionResult.result,
      error: executionResult.error,
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
      const { status, message: statusMessage } = await checkAIAvailability();
      return { type: "AI_STATUS", status, message: statusMessage };
    }
    case "GENERATE_SCRIPT": {
      try {
        const code = await generateScript(message.prompt);
        return { type: "SCRIPT_GENERATED", code };
      } catch (error) {
        resetSession();
        throw error;
      }
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
    default:
      throw new Error("不明なメッセージタイプです");
  }
}
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Offline AI Script Generator がインストールされました");
  } else if (details.reason === "update") {
    console.log(`バージョン ${chrome.runtime.getManifest().version} に更新されました`);
  }
});
