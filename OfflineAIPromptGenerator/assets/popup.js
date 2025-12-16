import { r as reactExports, j as jsxRuntimeExports, c as clientExports } from "./client-DYnfPcRQ.js";
const VERSION = "1.1.0";
const PROVIDER_NAMES = {
  "chrome-ai": "Chrome AI",
  "gemini": "Gemini",
  "openai": "OpenAI"
};
function Popup() {
  const [prompt, setPrompt] = reactExports.useState("");
  const [generatedCode, setGeneratedCode] = reactExports.useState("");
  const [aiStatus, setAiStatus] = reactExports.useState("checking");
  const [statusMessage, setStatusMessage] = reactExports.useState("AIの状態を確認中...");
  const [currentProvider, setCurrentProvider] = reactExports.useState("gemini");
  const [isGenerating, setIsGenerating] = reactExports.useState(false);
  const [isExecuting, setIsExecuting] = reactExports.useState(false);
  const [executionResult, setExecutionResult] = reactExports.useState(null);
  const [currentTabId, setCurrentTabId] = reactExports.useState(null);
  const [currentUrl, setCurrentUrl] = reactExports.useState("");
  reactExports.useEffect(() => {
    chrome.runtime.sendMessage({ type: "CHECK_AI_STATUS" }, (response) => {
      if ((response == null ? void 0 : response.type) === "AI_STATUS") {
        setAiStatus(response.status);
        setStatusMessage(response.message || "");
        if (response.provider) {
          setCurrentProvider(response.provider);
        }
      }
    });
    chrome.runtime.sendMessage({ type: "GET_CURRENT_TAB" }, (response) => {
      if ((response == null ? void 0 : response.type) === "CURRENT_TAB") {
        setCurrentTabId(response.tabId);
        setCurrentUrl(response.url);
      }
    });
  }, []);
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };
  const handleGenerate = reactExports.useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setExecutionResult(null);
    setGeneratedCode("");
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GENERATE_SCRIPT",
        prompt: prompt.trim()
      });
      if (response.type === "SCRIPT_GENERATED") {
        setGeneratedCode(response.code);
      } else if (response.type === "ERROR") {
        setStatusMessage(`エラー: ${response.message}`);
        setAiStatus("error");
      }
    } catch (error) {
      setStatusMessage(`生成エラー: ${error instanceof Error ? error.message : String(error)}`);
      setAiStatus("error");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating]);
  const handleExecute = reactExports.useCallback(async () => {
    if (!generatedCode || !currentTabId || isExecuting) return;
    setIsExecuting(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: "EXECUTE_SCRIPT",
        code: generatedCode,
        tabId: currentTabId
      });
      if (response.type === "SCRIPT_EXECUTED") {
        setExecutionResult(response.result);
      } else if (response.type === "ERROR") {
        setExecutionResult({
          success: false,
          error: response.message,
          executedAt: Date.now()
        });
      }
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executedAt: Date.now()
      });
    } finally {
      setIsExecuting(false);
    }
  }, [generatedCode, currentTabId, isExecuting]);
  const handleGenerateAndExecute = reactExports.useCallback(async () => {
    if (!prompt.trim() || isGenerating || isExecuting) return;
    setIsGenerating(true);
    setExecutionResult(null);
    setGeneratedCode("");
    try {
      const genResponse = await chrome.runtime.sendMessage({
        type: "GENERATE_SCRIPT",
        prompt: prompt.trim()
      });
      if (genResponse.type !== "SCRIPT_GENERATED") {
        throw new Error(genResponse.type === "ERROR" ? genResponse.message : "生成に失敗しました");
      }
      setGeneratedCode(genResponse.code);
      setIsGenerating(false);
      if (currentTabId) {
        setIsExecuting(true);
        const execResponse = await chrome.runtime.sendMessage({
          type: "EXECUTE_SCRIPT",
          code: genResponse.code,
          tabId: currentTabId
        });
        if (execResponse.type === "SCRIPT_EXECUTED") {
          setExecutionResult(execResponse.result);
        }
      }
    } catch (error) {
      setStatusMessage(`エラー: ${error instanceof Error ? error.message : String(error)}`);
      setAiStatus("error");
    } finally {
      setIsGenerating(false);
      setIsExecuting(false);
    }
  }, [prompt, currentTabId, isGenerating, isExecuting]);
  const getStatusBadge = () => {
    const badges = {
      checking: { class: "badge-checking", text: "確認中..." },
      ready: { class: "badge-ready", text: `${PROVIDER_NAMES[currentProvider]} 準備完了` },
      downloading: { class: "badge-downloading", text: "ダウンロード中" },
      unavailable: { class: "badge-unavailable", text: "利用不可" },
      "no-api-key": { class: "badge-warning", text: "APIキー未設定" },
      error: { class: "badge-error", text: "エラー" }
    };
    const badge = badges[aiStatus];
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `status-badge ${badge.class}`, children: badge.text });
  };
  const isReady = aiStatus === "ready";
  const needsSetup = aiStatus === "no-api-key" || aiStatus === "unavailable";
  const canExecute = !!generatedCode && !!currentTabId;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "popup-container", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "title", children: "Offline AI Script Generator" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "header-info", children: [
        getStatusBadge(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "version", children: [
          "v",
          VERSION
        ] })
      ] })
    ] }),
    statusMessage && !isReady && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `status-message status-${aiStatus}`, children: [
      statusMessage,
      needsSetup && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-link", onClick: openOptions, children: "設定を開く" })
    ] }),
    currentUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "current-page", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "対象ページ:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "url", title: currentUrl, children: currentUrl.length > 40 ? currentUrl.substring(0, 40) + "..." : currentUrl })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "input-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "prompt", className: "input-label", children: "やりたいこと:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          id: "prompt",
          className: "prompt-input",
          placeholder: "例: このページの画像を全部グレー化する",
          value: prompt,
          onChange: (e) => setPrompt(e.target.value),
          disabled: !isReady || isGenerating,
          rows: 3
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-buttons", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "btn btn-primary",
          onClick: handleGenerateAndExecute,
          disabled: !isReady || !prompt.trim() || isGenerating || isExecuting || !currentTabId,
          children: isGenerating ? "生成中..." : isExecuting ? "実行中..." : "生成 & 実行"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "btn btn-secondary",
          onClick: handleGenerate,
          disabled: !isReady || !prompt.trim() || isGenerating,
          children: "生成のみ"
        }
      )
    ] }),
    generatedCode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "code-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "section-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "section-title", children: "生成されたコード:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "btn btn-small btn-execute",
            onClick: handleExecute,
            disabled: !canExecute || isExecuting,
            children: isExecuting ? "実行中..." : "実行"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "code-block", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: generatedCode }) })
    ] }),
    executionResult && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `result-section ${executionResult.success ? "success" : "error"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "result-header", children: executionResult.success ? "✓ 実行完了" : "✗ 実行エラー" }),
      executionResult.error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "result-error", children: executionResult.error }),
      executionResult.result !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "result-value", children: [
        "結果: ",
        JSON.stringify(executionResult.result, null, 2)
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "footer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Powered by ",
        PROVIDER_NAMES[currentProvider]
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-settings", onClick: openOptions, title: "設定", children: "⚙️" })
    ] })
  ] });
}
const root = document.getElementById("root");
if (root) {
  clientExports.createRoot(root).render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Popup, {}) })
  );
}
