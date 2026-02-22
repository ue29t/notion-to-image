const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');
const promptTextarea = document.getElementById('prompt');
const generateBtn = document.getElementById('generateBtn');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');
const generatedImage = document.getElementById('generatedImage');
const downloadLink = document.getElementById('downloadLink');
const copyBtn = document.getElementById('copyBtn');

// 保存済みAPIキーを読み込む
chrome.storage.local.get(['apiKey'], (result) => {
  if (result.apiKey) {
    apiKeyInput.value = result.apiKey;
  }
});

// APIキーを保存する
saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key) return;
  chrome.storage.local.set({ apiKey: key }, () => {
    saveKeyBtn.textContent = '保存済み ✓';
    setTimeout(() => { saveKeyBtn.textContent = '保存'; }, 2000);
  });
});

// Notionで選択中のテキストを取得する
function getSelectedTextFromNotion() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url || !tab.url.includes('notion.so')) {
        resolve('');
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          resolve('');
        } else {
          resolve(response.text || '');
        }
      });
    });
  });
}

// 起動時にNotionの選択テキストをセット
(async () => {
  const text = await getSelectedTextFromNotion();
  if (text) {
    promptTextarea.value = text;
  }
})();

// グラレコ風プロンプトを生成
function buildGrarecoPrompt(userText) {
  return `以下の内容を、グラフィックレコーディングスタイルで視覚化してください。
スタイルの特徴：
- 手書き風のイラストとテキストを組み合わせる
- キーワードを吹き出しや囲みで強調する
- アイコンや矢印、シンプルな人物イラストを使う
- カラフルで見やすいレイアウト
- 全体的にスケッチ風・ホワイトボード風の雰囲気

注意事項：
- 画像内に「グラレコ」「グラフィックレコーディング」「グラフィックレコード」などのスタイル名の文字は含めないこと
- 指示文や説明文を画像に描き込まないこと
- コンテンツの内容だけを視覚化すること

内容：
${userText}`;
}

// 画像生成（Gemini Nano Banana Pro = gemini-3-pro-image-preview）
generateBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const userText = promptTextarea.value.trim();

  if (!apiKey) {
    showStatus('APIキーを入力してください。', true);
    return;
  }
  if (!userText) {
    showStatus('テキストを入力してください。', true);
    return;
  }

  generateBtn.disabled = true;
  showStatus('Nano Banana Pro でグラレコ風画像を生成中...');
  resultDiv.style.display = 'none';

  try {
    const prompt = buildGrarecoPrompt(userText);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `APIエラー: ${response.status}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);
    const textPart = parts.find(p => p.text);

    if (imagePart) {
      const mimeType = imagePart.inlineData.mimeType || 'image/png';
      const imageUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
      generatedImage.src = imageUrl;
      downloadLink.href = imageUrl;
      statusDiv.style.display = 'none';
      resultDiv.style.display = 'block';
    } else if (textPart) {
      throw new Error(`画像を生成できませんでした: ${textPart.text.substring(0, 100)}`);
    } else {
      throw new Error(`画像データなし: ${JSON.stringify(data).substring(0, 200)}`);
    }
  } catch (err) {
    showStatus(`エラー: ${err.message}`, true);
  } finally {
    generateBtn.disabled = false;
  }
});

// 画像をクリップボードにコピーする（canvas経由でPNG blobに変換）
copyBtn.addEventListener('click', () => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = generatedImage.naturalWidth || generatedImage.width;
    canvas.height = generatedImage.naturalHeight || generatedImage.height;
    ctx.drawImage(generatedImage, 0, 0);
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        copyBtn.textContent = 'コピー済み ✓';
        setTimeout(() => { copyBtn.textContent = 'コピー'; }, 2000);
      } catch (err) {
        showStatus(`コピーに失敗しました: ${err.message}`, true);
      }
    }, 'image/png');
  } catch (err) {
    showStatus(`コピーに失敗しました: ${err.message}`, true);
  }
});

function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.className = 'status' + (isError ? ' error' : '');
  statusDiv.style.display = 'block';
}
