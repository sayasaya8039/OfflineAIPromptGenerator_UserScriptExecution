import { r as reactExports, j as jsxRuntimeExports, c as clientExports } from "./client-DYnfPcRQ.js";
const VERSION = "1.3.0";
const CHROME_FLAGS = [
  {
    id: "prompt-api",
    url: "chrome://flags/#prompt-api-for-gemini-nano",
    name: "Prompt API for Gemini Nano",
    value: "Enabled",
    description: "Gemini Nano AIモデルを有効化"
  },
  {
    id: "optimization-guide",
    url: "chrome://flags/#optimization-guide-on-device-model",
    name: "Enables optimization guide on device",
    value: "Enabled BypassPerfRequirement",
    description: "オンデバイスモデルを有効化（性能要件をバイパス）"
  }
];
function Options() {
  const [settings, setSettings] = reactExports.useState({
    provider: "gemini",
    geminiApiKey: "",
    openaiApiKey: ""
  });
  const [saved, setSaved] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  const [chromeAIStatus, setChromeAIStatus] = reactExports.useState("checking");
  const [chromeAIMessage, setChromeAIMessage] = reactExports.useState("");
  const [copiedFlag, setCopiedFlag] = reactExports.useState(null);
  const checkChromeAI = reactExports.useCallback(async () => {
    var _a;
    setChromeAIStatus("checking");
    setChromeAIMessage("Chrome AIの状態を確認中...");
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
          setChromeAIStatus("not-available");
          setChromeAIMessage("Chrome AI APIが見つかりません");
          return;
        }
        switch (availability) {
          case "readily":
          case "ready":
            setChromeAIStatus("ready");
            setChromeAIMessage("Chrome AI準備完了！すぐに使用できます");
            break;
          case "after-download":
          case "downloadable":
            setChromeAIStatus("downloading");
            setChromeAIMessage("AIモデルのダウンロードが必要です。Chromeが自動でダウンロードを開始します");
            break;
          case "downloading":
            setChromeAIStatus("downloading");
            setChromeAIMessage("AIモデルをダウンロード中...しばらくお待ちください");
            break;
          default:
            setChromeAIStatus("not-available");
            setChromeAIMessage("Chrome AIが利用できません。以下の手順で設定してください");
        }
      } else {
        setChromeAIStatus("not-available");
        setChromeAIMessage("Chrome AIが利用できません。以下の手順で設定してください");
      }
    } catch (error) {
      setChromeAIStatus("error");
      setChromeAIMessage(`エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);
  reactExports.useEffect(() => {
    chrome.storage.local.get("settings", (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
      setLoading(false);
    });
  }, []);
  reactExports.useEffect(() => {
    if (settings.provider === "chrome-ai") {
      checkChromeAI();
    }
  }, [settings.provider, checkChromeAI]);
  const copyToClipboard = async (text, flagId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFlag(flagId);
      setTimeout(() => setCopiedFlag(null), 2e3);
    } catch (error) {
      console.error("コピーに失敗しました:", error);
    }
  };
  const handleSave = async () => {
    await chrome.storage.local.set({ settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2e3);
  };
  const handleProviderChange = (provider) => {
    setSettings({ ...settings, provider });
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "options-container", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "読み込み中..." }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "options-container", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "Offline AI Script Generator" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "version", children: [
        "v",
        VERSION
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "main", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "AIプロバイダー設定" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "description", children: "使用するAIサービスを選択してください。" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "provider-list", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `provider-card ${settings.provider === "gemini" ? "selected" : ""}`,
              onClick: () => handleProviderChange("gemini"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "provider-header", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "radio",
                      name: "provider",
                      checked: settings.provider === "gemini",
                      onChange: () => handleProviderChange("gemini")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "provider-name", children: "Gemini API" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "provider-badge free", children: "無料枠あり" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "provider-description", children: "Google AI Studioで無料のAPIキーを取得できます。" }),
                settings.provider === "gemini" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "api-key-input", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "APIキー:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "password",
                      placeholder: "AIza...",
                      value: settings.geminiApiKey,
                      onChange: (e) => setSettings({ ...settings, geminiApiKey: e.target.value }),
                      onClick: (e) => e.stopPropagation()
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "a",
                    {
                      href: "https://aistudio.google.com/apikey",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "get-key-link",
                      children: "APIキーを取得"
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `provider-card ${settings.provider === "openai" ? "selected" : ""}`,
              onClick: () => handleProviderChange("openai"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "provider-header", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "radio",
                      name: "provider",
                      checked: settings.provider === "openai",
                      onChange: () => handleProviderChange("openai")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "provider-name", children: "OpenAI API" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "provider-badge paid", children: "有料" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "provider-description", children: "GPT-4o-miniを使用。高品質なコード生成が可能です。" }),
                settings.provider === "openai" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "api-key-input", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "APIキー:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "password",
                      placeholder: "sk-...",
                      value: settings.openaiApiKey,
                      onChange: (e) => setSettings({ ...settings, openaiApiKey: e.target.value }),
                      onClick: (e) => e.stopPropagation()
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "a",
                    {
                      href: "https://platform.openai.com/api-keys",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "get-key-link",
                      children: "APIキーを取得"
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `provider-card ${settings.provider === "chrome-ai" ? "selected" : ""}`,
              onClick: () => handleProviderChange("chrome-ai"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "provider-header", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "radio",
                      name: "provider",
                      checked: settings.provider === "chrome-ai",
                      onChange: () => handleProviderChange("chrome-ai")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "provider-name", children: "Chrome Built-in AI" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "provider-badge experimental", children: "実験的" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "provider-description", children: "Gemini Nano搭載。オフラインで動作、APIキー不要、完全無料。" }),
                settings.provider === "chrome-ai" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chrome-ai-setup", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `chrome-ai-status status-${chromeAIStatus}`, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "status-icon", children: [
                      chromeAIStatus === "checking" && "🔄",
                      chromeAIStatus === "ready" && "✅",
                      chromeAIStatus === "downloading" && "⏳",
                      chromeAIStatus === "not-available" && "⚠️",
                      chromeAIStatus === "error" && "❌"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-text", children: chromeAIMessage }),
                    chromeAIStatus !== "checking" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        className: "btn-refresh",
                        onClick: checkChromeAI,
                        title: "再チェック",
                        children: "🔄"
                      }
                    )
                  ] }),
                  chromeAIStatus === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chrome-ai-ready", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Chrome AIはすぐに使用できます。設定を保存して使い始めましょう！" }) }),
                  chromeAIStatus === "downloading" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chrome-ai-downloading", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "download-info", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "モデルサイズ: 約1.7GB" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "バックグラウンドでダウンロードされます。完了後に再度確認してください。" })
                  ] }) }),
                  (chromeAIStatus === "not-available" || chromeAIStatus === "error") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chrome-ai-guide", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "セットアップガイド" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "requirements", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { children: "📋 動作要件" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Chrome バージョン 138 以上（推奨: 140以上）" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "メモリ: 16GB以上推奨" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "ストレージ: 22GB以上の空き容量" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "GPU: 4GB VRAM以上、またはCPU: 4コア以上" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "setup-steps", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { children: "🔧 設定手順" }),
                      CHROME_FLAGS.map((flag, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "setup-step", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step-number", children: [
                          "Step ",
                          index + 1
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step-content", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "step-description", children: flag.description }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flag-url-container", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "flag-url", children: flag.url }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "button",
                              {
                                className: `btn-copy ${copiedFlag === flag.id ? "copied" : ""}`,
                                onClick: () => copyToClipboard(flag.url, flag.id),
                                children: copiedFlag === flag.id ? "✓ コピー済み" : "📋 コピー"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "step-value", children: [
                            "設定値: ",
                            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: flag.value })
                          ] })
                        ] })
                      ] }, flag.id)),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "setup-step", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "step-number", children: "Step 3" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step-content", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "step-description", children: "Chromeを再起動" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "step-hint", children: "設定変更後、Chromeを完全に終了して再起動してください。" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "setup-step", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "step-number", children: "Step 4" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "step-content", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "step-description", children: "モデルのダウンロードを待つ" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "step-hint", children: "初回は約1.7GBのモデルがダウンロードされます。 バックグラウンドで行われるため、しばらくお待ちください。" })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reference-links", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { children: "📚 参考リンク" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "a",
                        {
                          href: "https://developer.chrome.com/docs/ai/get-started",
                          target: "_blank",
                          rel: "noopener noreferrer",
                          children: "Chrome AI 公式ドキュメント"
                        }
                      )
                    ] })
                  ] })
                ] })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-primary", onClick: handleSave, children: "設定を保存" }),
        saved && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "saved-message", children: "保存しました！" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "footer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "APIキーはローカルに保存され、外部に送信されることはありません。" }) })
  ] });
}
const root = document.getElementById("root");
if (root) {
  clientExports.createRoot(root).render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Options, {}) })
  );
}
