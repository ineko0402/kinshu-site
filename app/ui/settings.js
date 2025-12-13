// app/ui/settings.js
// ==============================
// グローバル設定（ダークモードのみ）
// ==============================

export function bindSettingsEvents() {
  const btn = document.getElementById('settingsBtn');
  if (!btn) return;
  btn.addEventListener('click', openSettings);
}

export function openSettings() {
  if (document.getElementById('settings-box')) return;

  const tpl = document.getElementById('settingsTemplate');
  const overlay = tpl.content.cloneNode(true).querySelector('.modal-overlay');
  const box = overlay.querySelector('#settings-box');

  box.querySelector('#darkModeCheckbox').checked = document.body.classList.contains('dark');

  box.querySelector('#darkModeCheckbox').addEventListener('change', e => {
    const checked = e.target.checked;
    document.body.classList.toggle('dark', checked);
    localStorage.setItem('darkMode', checked);
  });

  // バックアップ機能のイベントハンドラ
  const exportBtn = box.querySelector('#exportBtn');
  const importBtn = box.querySelector('#importBtn');
  const importInput = box.querySelector('#importInput');

  // エクスポート処理
  exportBtn.addEventListener('click', () => {
    const data = localStorage.getItem('notes_data');
    if (!data) {
      alert('保存されたノートデータがありません。');
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinshu_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('ノートデータをエクスポートしました。');
  });

  // インポート処理
  importBtn.addEventListener('click', () => {
    importInput.click();
  });

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData.notes && Array.isArray(importedData.notes)) {
          if (confirm('現在のノートデータを上書きしてインポートしますか？')) {
            localStorage.setItem('notes_data', event.target.result);
            alert('ノートデータをインポートしました。ページをリロードします。');
            window.location.reload();
          }
        } else {
          alert('ファイル形式が正しくありません。');
        }
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。JSON形式を確認してください。');
        console.error(error);
      }
    };
    reader.readAsText(file);
  });

  overlay.querySelector('#closeSettingsBtn').addEventListener('click', closeOverlay);
  document.body.appendChild(overlay);

  // アニメーション開始
  requestAnimationFrame(() => {
    overlay.classList.add('show');
  });

  // 閉じる処理
  function closeOverlay() {
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay();
  });
}