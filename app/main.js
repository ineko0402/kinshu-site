// app/main.js
// ==============================
// アプリのエントリーポイント
// ==============================

import { initState, loadState, appState, switchNote, createNewNote, deleteNote } from './core/state.js';
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
        <button class="delete-note-btn">削除</button>
      `;
      noteListEl.appendChild(li);
    });
  }

  renderNoteList();

  // ノート切り替え処理
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
    const name = prompt('新しいノートの名前を入力してください:', `新規ノート ${appState.notes.length + 1}`);
    if (!name) return;

    const currency = confirm('このノートの通貨をCNYにしますか？\n(「キャンセル」でJPYになります)') ? 'CNY' : 'JPY';

    const newNote = createNewNote(name, currency);
    switchNote(newNote.id);
    renderNoteList();
    renderCurrency();
    updateSummary();
    updateNoteDisplay();
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
  updateNoteDisplay(); // ノート名表示の初期化

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