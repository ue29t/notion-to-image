# Notion to Image

Notionで選択したテキストを、**Gemini Nano Banana Pro**（gemini-3-pro-image-preview）で**グラフィックレコーディング（グラレコ）風の画像**に変換するChrome拡張機能。

---

## できること

- Notionのページ上でテキストを選択するだけで画像生成できる
- グラレコ風（手書き・ホワイトボード・スケッチ）スタイルで自動生成
- 生成した画像をワンクリックでダウンロード

---

## インストール方法

1. このリポジトリをダウンロード（緑の「Code」ボタン →「Download ZIP」）
2. ZIPを解凍する
3. Chromeで `chrome://extensions` を開く
4. 右上の「デベロッパーモード」をオンにする
5. 「パッケージ化されていない拡張機能を読み込む」をクリックして解凍したフォルダを選択

---

## 使い方

1. Notionを開いてテキストを選択する
2. 右上の拡張機能アイコン（パズルのピース）をクリックしてNotion to Imageを選ぶ
3. 初回のみ：Gemini APIキーを入力して「保存」をクリック
4. 「画像を生成する」ボタンをクリック
5. 画像が生成されたら「画像を保存」でダウンロード

---

## Gemini APIキーの取得方法

1. [Google AI Studio](https://aistudio.google.com) を開く
2. 「Get API key」→「Create API key」をクリック
3. 取得したキーを拡張機能に貼り付けて保存

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| AIモデル | Gemini Nano Banana Pro（gemini-3-pro-image-preview） |
| API | Google Generative Language API |
| 対応サイト | Notion（https://www.notion.so） |
| 拡張機能仕様 | Chrome Manifest V3 |

---

## ファイル構成

```
notion-to-image/
├── manifest.json   # 拡張機能の設定
├── content.js      # Notionからテキストを取得するスクリプト
├── popup.html      # 拡張機能のUI
└── popup.js        # Gemini API連携・画像生成ロジック
```

---

## 注意事項

- Gemini APIの利用には Google AI Studioのアカウントと課金設定が必要な場合があります
- APIキーはブラウザのローカルストレージに保存されます（外部には送信されません）
