# Offline AI Script Generator

オフラインAI（Gemini Nano）でJavaScriptコードを自動生成し、ウェブページに即実行できるChrome拡張機能

## 開発環境セットアップ

```bash
# 依存関係インストール
npm install

# ビルド
npm run build

# 開発モード（ファイル変更を監視）
npm run dev
```

## プロジェクト構成

```
OfflineAIPromptGenerator_UserScriptExecution/
├── src/
│   ├── popup/           # ポップアップUI（React）
│   │   ├── Popup.tsx
│   │   ├── index.tsx
│   │   └── styles/
│   ├── background/      # Service Worker
│   │   └── service-worker.ts
│   ├── lib/             # ユーティリティ
│   │   ├── ai.ts        # Prompt API連携
│   │   └── userScripts.ts
│   └── types/           # 型定義
├── public/
│   ├── manifest.json
│   ├── popup.html
│   └── icons/
├── OfflineAIPromptGenerator/  # ビルド出力
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 機能概要

```
┌─────────────────────────────────────────────────────────┐
│  OfflineAIPromptGenerator + UserScript実行              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ① ユーザー入力                                         │
│     「このページの画像を全部グレー化せよ」              │
│              ↓                                          │
│  ② Gemini Nano (オフラインAI)                          │
│     自然言語 → JavaScriptコード生成                    │
│              ↓                                          │
│  ③ chrome.scripting API                                │
│     生成コードをページに注入・実行                      │
│              ↓                                          │
│  ④ 結果表示                                            │
│     ページが変わる！                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 動作環境

| 項目 | 要件 |
|------|------|
| Chrome | バージョン 138 以上 |
| OS | Windows 10/11, macOS 13+, Linux |
| メモリ | 16GB以上推奨 |
| ストレージ | 22GB以上の空き容量 |

## Chromeフラグ設定

AI機能を使用するには以下のフラグを有効化：

1. `chrome://flags/#prompt-api-for-gemini-nano` → **Enabled**
2. `chrome://flags/#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

## 技術スタック

- Chrome Built-in AI (Gemini Nano) - Prompt API
- chrome.scripting API
- React 18 + TypeScript
- Vite 6

## ライセンス

MIT License
