// app/main.js
import { initState, appState } from './core/state.js';
import { renderCurrency, resetAll, updateSummary, setSaveNotesDataFn } from './ui/renderer.js';
import { loadStateToUI } from './ui/stateSync.js';
import { bindKeypadEvents } from './ui/keypad.js';
import { bindExportEvents } from './export/imageExport.js';

// 分割したUIモジュールをインポート
import { applyNoteColor, updateNoteDisplay, renderSidebarNoteList, openNoteSwitchModal, openNoteCreateModal } from './ui/noteUI.js';
import { renderSidebarHistoryList, openSavePointModal, openHistoryModal } from './ui/historyUI.js';
import { bindSettingsEvents, openSettings } from './ui/settingsUI.js';

// DOM構築完了後に初期化
window.addEventListener('DOMContentLoaded', () => {
  // 状態初期化・読込
  initState();

  // saveNotesData関数をrenderer.jsに提供（循環参照を避けるため）
  // state.jsから直接importしてもよいが、将来storage.jsに分離する場合に備える
  import('./core/state.js').then(({ saveNotesData }) => {
    function saveNotesDataWrapper() {
      saveNotesData();
    }
    setSaveNotesDataFn(saveNotesDataWrapper);
  });

  // UIへの状態反映
  loadStateToUI();

  // 現在のノートの設定を反映
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (currentNote) {
    applyNoteColor(currentNote.color);
  }

  // 各種レンダリング
  renderCurrency();
  updateNoteDisplay();
  renderSidebarNoteList();
  renderSidebarHistoryList();

  // イベントバインド
  bindKeypadEvents();
  bindSettingsEvents();
  bindExportEvents();

  // グローバルなボタンイベント
  document.getElementById('clearAllBtn')?.addEventListener('click', resetAll);
  document.getElementById('pc-clearAllBtn')?.addEventListener('click', resetAll);
  document.getElementById('saveBtn')?.addEventListener('click', openSavePointModal);
  document.getElementById('pc-saveBtn')?.addEventListener('click', openSavePointModal);
  document.getElementById('historyBtn')?.addEventListener('click', openHistoryModal);
  document.getElementById('settingsBtn')?.addEventListener('click', openSettings);
  document.getElementById('headerSettingsBtn')?.addEventListener('click', openSettings);
  document.getElementById('noteSwitchBtn')?.addEventListener('click', openNoteSwitchModal);

  // PC用サイドバー限定のイベント
  document.getElementById('pc-newNoteBtn')?.addEventListener('click', () => {
    openNoteCreateModal(() => {
      renderSidebarNoteList();
    });
  });

  console.log('[INIT] アプリがリファクタリング後の構成で初期化されました。');
});

// ノート切り替え時の連動（必要に応じて）
document.addEventListener('noteSwitched', () => {
  renderSidebarHistoryList();
});

/**
 * バックアップ・インポートのエクスポート（他から呼ばれる可能性があるため）
 */
export function openBackupModal() {
  const template = document.getElementById('backupTemplate');
  if (!template) return;
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('backup-overlay');
  const closeBtn = document.getElementById('closeBackupBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');
  const importBtn = document.getElementById('importBtn');

  exportBtn.onclick = () => {
    const data = localStorage.getItem('notes_data');
    if (!data) return alert('データがありません');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinshu_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  importBtn.onclick = () => importInput.click();
  importInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.notes) {
          localStorage.setItem('notes_data', event.target.result);
          alert('インポート成功。リロードします。');
          window.location.reload();
        }
      } catch (err) { alert('読み込み失敗'); }
    };
    reader.readAsText(file);
  };

  const close = () => {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => { if (document.body.contains(overlay)) document.body.removeChild(overlay); }, 300);
  };
  closeBtn.onclick = close;
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
  });
}