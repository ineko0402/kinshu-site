// app/core/state.js
// ==============================
// アプリ全体の状態管理とlocalStorage同期
// ==============================

export const appState = {
  currentCurrency: 'JPY',
  currentInput: '',
  activeDisplay: null,
  isFirstInput: true,
  // --- ノート管理用プロパティ ---
  currentNoteId: null,
  notes: [] // { id, name, createdAt, updatedAt, currency, counts, settings } の配列
};

// UUID生成関数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ノートデータをlocalStorageに保存
function saveNotesData() {
  const dataToSave = {
    currentNoteId: appState.currentNoteId,
    notes: appState.notes
  };
  localStorage.setItem('notes_data', JSON.stringify(dataToSave));
}

// ノートの初期化とロード
export function initNotes() {
  const savedData = JSON.parse(localStorage.getItem('notes_data') || '{}');
  appState.notes = savedData.notes || [];

  // ノートが存在しない場合はデフォルトノートを作成
  if (appState.notes.length === 0) {
    const defaultNote = createNewNote('レジ', 'JPY', {
      hide2000: false,
      hideBills: false,
      hideCoins: false
    });
    appState.notes.push(defaultNote);
    appState.currentNoteId = defaultNote.id;
    saveNotesData();
  } else {
    appState.currentNoteId = savedData.currentNoteId || appState.notes[0].id;
  }

  // 現在のノートの通貨設定をappStateに反映
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (currentNote) {
    appState.currentCurrency = currentNote.currency;
  }
}

// 新しいノートを作成
export function createNewNote(name, currency, settings = {}) {
  const now = new Date().toISOString();
  const newNote = {
    id: generateUUID(),
    name: name,
    createdAt: now,
    updatedAt: now,
    currency: currency,
    counts: {},
    settings: {
      hide2000: settings.hide2000 || false,
      hideBills: settings.hideBills || false,
      hideCoins: settings.hideCoins || false
    }
  };
  appState.notes.push(newNote);
  saveNotesData();
  return newNote;
}

// ノートの設定を更新
export function updateNoteSettings(noteId, settings) {
  const note = appState.notes.find(n => n.id === noteId);
  if (!note) return false;

  note.settings = {
    ...note.settings,
    ...settings
  };
  note.updatedAt = new Date().toISOString();
  saveNotesData();
  return true;
}

// ノート名を更新
export function updateNoteName(noteId, newName) {
  const note = appState.notes.find(n => n.id === noteId);
  if (!note) return false;

  note.name = newName;
  note.updatedAt = new Date().toISOString();
  saveNotesData();
  return true;
}

// ノートを切り替える
export function switchNote(noteId) {
  const targetNote = appState.notes.find(n => n.id === noteId);
  if (!targetNote) return false;

  // 既存のノートのデータを保存
  saveCounts();

  appState.currentNoteId = noteId;
  appState.currentCurrency = targetNote.currency;

  // 新しいノートのデータをロード
  loadState();
  return true;
}

// ノートを削除する
export function deleteNote(noteId) {
  const index = appState.notes.findIndex(n => n.id === noteId);
  if (index === -1) return false;

  appState.notes.splice(index, 1);
  saveNotesData();

  // 削除したノートが現在アクティブなノートだった場合、最初のノートに切り替える
  if (appState.currentNoteId === noteId) {
    appState.currentNoteId = appState.notes.length > 0 ? appState.notes[0].id : null;
    if (appState.currentNoteId) {
      switchNote(appState.currentNoteId);
    } else {
      // 全てのノートが削除された場合、デフォルトノートを作成
      const defaultNote = createNewNote('レジ', 'JPY', {
        hide2000: false,
        hideBills: false,
        hideCoins: false
      });
      appState.currentNoteId = defaultNote.id;
      switchNote(defaultNote.id);
    }
  }
  return true;
}

// 既存のinitStateを改修
export function initState() {
  // ノートの初期化を先に行う
  initNotes();

  // グローバル設定（ダークモードのみ）
  document.body.classList.toggle('dark', localStorage.getItem('darkMode') === 'true');
}

// 既存のloadStateを改修
export function loadState() {
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (!currentNote) return;

  const saved = currentNote.counts || {};
  document.querySelectorAll('.cell').forEach(cell => {
    const id = cell.dataset.id;
    const val = saved[id] || '0';
    const el = cell.querySelector('.display');
    if (el) {
      el.dataset.value = val;
      el.textContent = val;
    }
  });
}

// 既存のsaveCountsを改修
export function saveCounts() {
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (!currentNote) return;

  const values = {};
  document.querySelectorAll('.cell').forEach(cell => {
    const id = cell.dataset.id;
    const val = cell.querySelector('.display').dataset.value || '0';
    values[id] = val;
  });
  
  currentNote.counts = values;
  currentNote.updatedAt = new Date().toISOString();
  saveNotesData();
}

// 現在のノートの設定を取得
export function getCurrentNoteSettings() {
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (!currentNote) return null;
  return currentNote.settings || {
    hide2000: false,
    hideBills: false,
    hideCoins: false
  };
}