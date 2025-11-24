// app/main.js
// ==============================
// アプリのエントリーポイント
// ==============================

import { initState, loadState, appState, switchNote, createNewNote, deleteNote, updateNoteSettings, updateNoteName } from './core/state.js';
import { renderCurrency } from './ui/renderer.js';
import { bindKeypadEvents } from './ui/keypad.js';
import { bindSettingsEvents, openSettings } from './ui/settings.js';
import { bindExportEvents, downloadImage } from './export/imageExport.js';
import { resetAll, updateSummary } from './ui/renderer.js';

// ノート切り替えUIの表示/非表示を制御する関数
export function updateNoteDisplay() {
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  const noteNameEl = document.getElementById('currentNoteName');
  if (noteNameEl && currentNote) {
    noteNameEl.textContent = `${currentNote.name} (${currentNote.currency})`;
  }
}

// ノート編集モーダルを開く
export function openNoteEditModal(noteId) {
  const note = appState.notes.find(n => n.id === noteId);
  if (!note) return;

  const template = document.getElementById('noteEditTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('note-edit-overlay');
  const closeBtn = document.getElementById('closeNoteEditBtn');
  const saveBtn = document.getElementById('saveNoteEditBtn');
  const noteNameInput = document.getElementById('noteNameInput');
  const currencyDisplay = document.getElementById('currencyDisplay');

  // 現在の値を設定
  noteNameInput.value = note.name;
  currencyDisplay.textContent = note.currency;

  // JPYの場合のみ金種制限設定を表示
  const settingsSection = overlay.querySelector('.note-settings-section');
  if (note.currency === 'JPY') {
    settingsSection.style.display = 'block';
    const settings = note.settings || {};
    overlay.querySelector('#noteHide2000').checked = settings.hide2000 || false;
    overlay.querySelector('#noteHideBills').checked = settings.hideBills || false;
    overlay.querySelector('#noteHideCoins').checked = settings.hideCoins || false;
  } else {
    settingsSection.style.display = 'none';
  }

  // 保存処理
  saveBtn.addEventListener('click', () => {
    const newName = noteNameInput.value.trim();
    if (!newName) {
      alert('ノート名を入力してください。');
      return;
    }

    // ノート名を更新
    updateNoteName(noteId, newName);

    // JPYの場合は設定も更新
    if (note.currency === 'JPY') {
      updateNoteSettings(noteId, {
        hide2000: overlay.querySelector('#noteHide2000').checked,
        hideBills: overlay.querySelector('#noteHideBills').checked,
        hideCoins: overlay.querySelector('#noteHideCoins').checked
      });
    }

    // 現在アクティブなノートの場合は再描画
    if (noteId === appState.currentNoteId) {
      renderCurrency();
      updateSummary();
      updateNoteDisplay();
    }

    document.body.removeChild(overlay);
  });

  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

// 新規ノート作成モーダルを開く
export function openNoteCreateModal() {
  const template = document.getElementById('noteCreateTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('note-create-overlay');
  const closeBtn = document.getElementById('closeNoteCreateBtn');
  const createBtn = document.getElementById('createNoteBtn');
  const noteNameInput = document.getElementById('newNoteNameInput');
  const currencySelect = document.getElementById('newNoteCurrencySelect');

  // デフォルトのノート名を設定
  noteNameInput.value = `新規ノート ${appState.notes.length + 1}`;

  // 通貨選択時に金種制限設定の表示/非表示を切り替え
  const settingsSection = overlay.querySelector('.note-settings-section');
  currencySelect.addEventListener('change', (e) => {
    if (e.target.value === 'JPY') {
      settingsSection.style.display = 'block';
    } else {
      settingsSection.style.display = 'none';
    }
  });

  // 作成処理
  createBtn.addEventListener('click', () => {
    const name = noteNameInput.value.trim();
    if (!name) {
      alert('ノート名を入力してください。');
      return;
    }

    const currency = currencySelect.value;
    const settings = {
      hide2000: false,
      hideBills: false,
      hideCoins: false
    };

    // JPYの場合は設定を取得
    if (currency === 'JPY') {
      settings.hide2000 = overlay.querySelector('#newNoteHide2000').checked;
      settings.hideBills = overlay.querySelector('#newNoteHideBills').checked;
      settings.hideCoins = overlay.querySelector('#newNoteHideCoins').checked;
    }

    const newNote = createNewNote(name, currency, settings);
    switchNote(newNote.id);
    renderCurrency();
    updateSummary();
    updateNoteDisplay();

    document.body.removeChild(overlay);
  });

  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

// ノートモーダルを開く
export function openNoteSwitchModal() {
  const template = document.getElementById('noteSwitchTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('note-overlay');
  const closeBtn = document.getElementById('closeNoteBtn');
  const noteListEl = document.getElementById('noteList');
  const newNoteBtn = document.getElementById('newNoteBtn');

  // ノート一覧の描画
  function renderNoteList() {
    noteListEl.innerHTML = '';
    appState.notes.forEach(note => {
      const li = document.createElement('li');
      li.className = 'note-item';
      li.dataset.id = note.id;
      li.innerHTML = `
        <span class="note-name ${note.id === appState.currentNoteId ? 'active' : ''}">${note.name} (${note.currency})</span>
        <div class="note-actions">
          <button class="edit-note-btn">編集</button>
          <button class="delete-note-btn">削除</button>
        </div>
      `;
      noteListEl.appendChild(li);
    });
  }

  renderNoteList();

  // ノート切り替え・編集・削除処理
  noteListEl.addEventListener('click', (e) => {
    const li = e.target.closest('.note-item');
    if (!li) return;

    const noteId = li.dataset.id;

    if (e.target.classList.contains('delete-note-btn')) {
      // 削除ボタン
      if (appState.notes.length <= 1) {
        alert('最後のノートは削除できません。');
        return;
      }
      if (confirm(`ノート「${appState.notes.find(n => n.id === noteId).name}」を削除しますか？`)) {
        deleteNote(noteId);
        renderNoteList();
        renderCurrency();
        updateSummary();
        updateNoteDisplay();
      }
    } else if (e.target.classList.contains('edit-note-btn')) {
      // 編集ボタン
      openNoteEditModal(noteId);
    } else {
      // ノート切り替え
      if (noteId !== appState.currentNoteId) {
        switchNote(noteId);
        renderCurrency();
        updateSummary();
        updateNoteDisplay();
        // アクティブなノートを更新
        document.querySelectorAll('.note-name').forEach(el => el.classList.remove('active'));
        li.querySelector('.note-name').classList.add('active');
      }
    }
  });

  // 新規ノート作成処理
  newNoteBtn.addEventListener('click', () => {
    openNoteCreateModal();
  });

  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

// バックアップモーダルを開く
export function openBackupModal() {
  const template = document.getElementById('backupTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('backup-overlay');
  const closeBtn = document.getElementById('closeBackupBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');
  const importBtn = document.getElementById('importBtn');

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

  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

// DOM構築完了後に初期化
window.addEventListener('DOMContentLoaded', () => {
  // 状態初期化・読込
  initState();
  loadState();

  // 通貨レンダリング
  renderCurrency();
  updateNoteDisplay();

  // イベント登録
  bindKeypadEvents();
  bindSettingsEvents();
  bindExportEvents();

  document.getElementById('clearAllBtn').addEventListener('click', resetAll);
  document.getElementById('downloadBtn').addEventListener('click', downloadImage);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('noteSwitchBtn').addEventListener('click', openNoteSwitchModal);
  document.getElementById('backupBtn').addEventListener('click', openBackupModal);
  console.log('[INIT] アプリが初期化されました。');
});