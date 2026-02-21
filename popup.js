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

// Step1: GeminiでテキストをAI画像用の英語プロンプトに変換
async function convertToImagePrompt(apiKey, text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `以下のテキストを、AI画像生成に最適な英語のプロンプトに変換してください。
情景や雰囲気が視覚的に伝わるよう、具体的で描写的な英語にしてください。
プロンプトのみ出力し、説明文は不要です。

テキスト：
${text}`
          }]
        }]
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `Gemini APIエラー: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
}

// Step2: Pollinations.aiで画像生成
function generateImageUrl(prompt) {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
}

// 画像生成メイン処理
generateBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const text = promptTextarea.value.trim();

  if (!apiKey) {
    showStatus('APIキーを入力してください。', true);
    return;
  }
  if (!text) {
    showStatus('テキストを入力してください。', true);
    return;
  }

  generateBtn.disabled = true;
  resultDiv.style.display = 'none';

  try {
    // Step1: プロンプト変換
    showStatus('① テキストを画像プロンプトに変換中...');
    const imagePrompt = await convertToImagePrompt(apiKey, text);

    // Step2: 画像生成
    showStatus('② 画像を生成中... (10〜20秒かかります)');
    const imageUrl = generateImageUrl(imagePrompt);

    // 画像を読み込む
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = imageUrl;
    });

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
