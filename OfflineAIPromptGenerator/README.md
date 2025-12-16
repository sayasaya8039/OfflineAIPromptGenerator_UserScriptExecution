# Offline AI Script Generator

オフラインAI（Gemini Nano）でJavaScriptコードを自動生成し、ウェブページに即実行できるChrome拡張機能

## 機能

- **オフラインAI生成**: Chrome内蔵のGemini Nanoを使用し、ネット接続なしでコード生成
- **自然言語からコード生成**: 「画像をグレー化」などの指示からJavaScriptコードを自動生成
- **ワンクリック実行**: 生成されたコードを現在のページに即座に適用
- **パステル水色デザイン**: ダークモード対応の可愛らしいUI

## 動作環境

| 項目 | 要件 |
|------|------|
| Chrome | バージョン 138 以上 |
| OS | Windows 10/11, macOS 13+, Linux |
| メモリ | 16GB以上推奨 |
| ストレージ | 22GB以上の空き容量（AIモデル用） |

## インストール方法

### 開発者モードでインストール

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `OfflineAIPromptGenerator` フォルダを選択

### AI機能の有効化

1. `chrome://flags/#prompt-api-for-gemini-nano` を開く
2. 「Prompt API for Gemini Nano」を **Enabled** に設定
3. `chrome://flags/#optimization-guide-on-device-model` を開く
4. 「Enables optimization guide on device」を **Enabled BypassPerfRequirement** に設定
5. Chromeを再起動

### User Scripts APIの有効化

1. 拡張機能の詳細ページを開く
2. 「ユーザースクリプトを許可」をONにする

## 使い方

1. 任意のウェブページを開く
2. 拡張機能アイコンをクリック
3. テキストボックスにやりたいことを入力
   - 例: 「このページの画像を全部グレー化する」
   - 例: 「ページの背景色を青にする」
   - 例: 「全てのリンクを太字にする」
4. 「生成 & 実行」ボタンをクリック
5. AIがコードを生成し、自動的にページに適用

## 使用例

| 指示 | 効果 |
|------|------|
| 「画像をグレー化」 | ページ内の全画像をモノクロに |
| 「広告っぽい要素を非表示」 | 広告要素を隠す |
| 「テキストを大きくする」 | フォントサイズを拡大 |
| 「コンソールにDOM構造を出力」 | デバッグ情報を表示 |

## 技術スタック

- **AI**: Chrome Built-in AI (Gemini Nano) - Prompt API
- **スクリプト実行**: chrome.scripting API
- **フロントエンド**: React 18 + TypeScript
- **ビルド**: Vite 6

## 注意事項

- AI機能は初回起動時にモデルをダウンロードします（約22GB）
- 一部のページ（chrome:// ページなど）ではスクリプト実行が制限されます
- 生成されたコードは自己責任で使用してください

## ライセンス

MIT License

## バージョン

v1.0.0
