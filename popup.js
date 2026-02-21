const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');
const promptTextarea = document.getElementById('prompt');
const generateBtn = document.getElementById('generateBtn');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');
const generatedImage = document.getElementById('generatedImage');
const downloadLink = document.getElementById('downloadLink');

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

// 画像生成（Gemini Nano Banana = gemini-2.5-flash-image）
generateBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const prompt = promptTextarea.value.trim();

  if (!apiKey) {
    showStatus('APIキーを入力してください。', true);
    return;
  }
  if (!prompt) {
    showStatus('テキストを入力してください。', true);
    return;
  }

  generateBtn.disabled = true;
  showStatus('画像を生成中... しばらくお待ちください');
  resultDiv.style.display = 'none';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
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

    if (!imagePart) {
      throw new Error('画像データが取得できませんでした');
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const imageUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;

    generatedImage.src = imageUrl;
    downloadLink.href = imageUrl;

    statusDiv.style.display = 'none';
    resultDiv.style.display = 'block';
  } catch (err) {
    showStatus(`エラー: ${err.message}`, true);
  } finally {
    generateBtn.disabled = false;
  }
});

function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.className = 'status' + (isError ? ' error' : '');
  statusDiv.style.display = 'block';
}
