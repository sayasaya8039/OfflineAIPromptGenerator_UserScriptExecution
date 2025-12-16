import { r as reactExports, j as jsxRuntimeExports, c as clientExports } from "./client-DYnfPcRQ.js";
const VERSION = "1.1.0";
function Options() {
  const [settings, setSettings] = reactExports.useState({
    provider: "gemini",
    geminiApiKey: "",
    openaiApiKey: ""
  });
  const [saved, setSaved] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    chrome.storage.local.get("settings", (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
      setLoading(false);
    });
  }, []);
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
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "provider-description", children: "オフラインで動作。Chrome 138+とフラグ設定が必要です。" }),
                settings.provider === "chrome-ai" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chrome-ai-info", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "必要な設定:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "chrome://flags/#prompt-api-for-gemini-nano" }),
                      " → Enabled"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "chrome://flags/#optimization-guide-on-device-model" }),
                      " → Enabled BypassPerfRequirement"
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
