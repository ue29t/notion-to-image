# Notion to Image

Notionで選択したテキストをGemini APIで画像生成するChrome拡張機能。

## 使い方

1. このリポジトリをダウンロード（Code → Download ZIP）
2. Chromeで `chrome://extensions` を開く
3. 「デベロッパーモード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」でダウンロードしたフォルダを選択
5. Notionを開いてテキストを選択
6. 拡張機能アイコンをクリック
7. 初回のみGemini APIキーを入力して保存
8. 「画像を生成する」をクリック

## Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com) を開く
2. 「Get API key」→「Create API key」
3. 取得したキーを拡張機能に入力

## ファイル構成

```
├── manifest.json   # 拡張機能の設定
├── content.js      # Notionのテキスト取得
├── popup.html      # UI
└── popup.js        # Gemini API連携
```
