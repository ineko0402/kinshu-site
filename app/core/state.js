// app/core/state.js
// ==============================
// アプリ全体の状態管理とlocalStorage同期
// ==============================

// 定数定義
const MAX_SAVED_POINTS = 30; // 履歴保存上限
const DEFAULT_NOTE_SETTINGS = {
  hide2000: false,
  hideBills: false,
  hideCoins: false
};

// アプリケーション全体の状態
export const appState = {
  currentCurrency: 'JPY',
  currentInput: '',
  activeDisplay: null,
  isFirstInput: true,
  // --- ノート管理用プロパティ ---
  currentNoteId: null,
  notes: [] // { id, name, createdAt, updatedAt, currency, counts, settings, savedPoints } の配列
};

// UUID生成関数（RFC4122 version 4準拠）
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// デバウンス用のタイマー
let saveTimeout = null;

/**
 * ノートデータをlocalStorageに保存（デバウンス付き）
 * @param {boolean} immediate - 即座に保存する場合true（デフォルト: false）
 * @throws {Error} ストレージ容量不足などの場合
 */
function saveNotesData(immediate = false) {
  // 即座に保存する場合
  if (immediate) {
    clearTimeout(saveTimeout);
    performSave();
    return;
  }

  // デバウンス処理（100ms以内の連続呼び出しをまとめる）
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    performSave();
  }, 100);
}

/**
 * 実際の保存処理
 */
function performSave() {
  try {
    const dataToSave = {
      currentNoteId: appState.currentNoteId,
      notes: appState.notes
    };
    localStorage.setItem('notes_data', JSON.stringify(dataToSave));
  } catch (error) {
    console.error('ノートデータの保存に失敗:', error);
    alert('データの保存に失敗しました。ストレージの容量を確認してください。');
    throw error; // エラーを再スロー
  }
}

/**
 * ノートの初期化とロード
 * localStorageからノートデータを読み込み、存在しない場合はデフォルトノートを作成
 */
export function initNotes() {
  try {
    const savedData = JSON.parse(localStorage.getItem('notes_data') || '{}');
    appState.notes = savedData.notes || [];

    // ノートが存在しない場合はデフォルトノートを作成
    if (appState.notes.length === 0) {
      const defaultNote = createNewNote('新規ノート 1', 'JPY', DEFAULT_NOTE_SETTINGS);
      // createNewNote内でpushとsaveが実行されるので、ここでは不要
      appState.currentNoteId = defaultNote.id;
    } else {
      appState.currentNoteId = savedData.currentNoteId || appState.notes[0].id;
    }

    // 現在のノートの通貨設定をappStateに反映
    const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
    if (currentNote) {
      appState.currentCurrency = currentNote.currency;
    }
  } catch (error) {
    console.error('ノートデータの読み込みに失敗:', error);
    // エラー時はデフォルトノートを作成
    appState.notes = [];
    const defaultNote = createNewNote('新規ノート 1', 'JPY', DEFAULT_NOTE_SETTINGS);
    appState.currentNoteId = defaultNote.id;
    appState.currentCurrency = defaultNote.currency;
  }
}

/**
 * 新しいノートを作成
 * @param {string} name - ノート名
 * @param {string} currency - 通貨（'JPY' or 'CNY'）
 * @param {Object} settings - 金種制限設定（オプション）
 * @returns {Object} 作成されたノートオブジェクト
 */
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
      ...DEFAULT_NOTE_SETTINGS,
      ...settings
    },
    savedPoints: []
  };
  appState.notes.push(newNote);
  saveNotesData();
  return newNote;
}

/**
 * ノートの設定を更新
 * @param {string} noteId - ノートID
 * @param {Object} settings - 更新する設定
 * @returns {boolean} 成功した場合true
 */
export function updateNoteSettings(noteId, settings) {
  const note = appState.notes.find(n => n.id === noteId);
  if (!note) return false;

  note.settings = {
    ...DEFAULT_NOTE_SETTINGS,
    ...(note.settings || {}),
    ...settings
  };
  note.updatedAt = new Date().toISOString();
  saveNotesData();
  return true;
}

/**
 * ノート名を更新
 * @param {string} noteId - ノートID
 * @param {string} newName - 新しいノート名
 * @returns {boolean} 成功した場合true
 */
export function updateNoteName(noteId, newName) {
  const note = appState.notes.find(n => n.id === noteId);
  if (!note) return false;

  note.name = newName;
  note.updatedAt = new Date().toISOString();
  saveNotesData();
  return true;
}

/**
 * ノートを切り替える
 * 現在のノートのデータを保存し、指定されたノートをロード
 * @param {string} noteId - 切り替え先のノートID
 * @returns {boolean} 成功した場合true
 */
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

/**
 * ノートを削除する
 * 最後のノートの場合は削除せずにデフォルトノートを作成
 * @param {string} noteId - 削除するノートID
 * @returns {boolean} 成功した場合true
 */
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
      const defaultNote = createNewNote('新規ノート 1', 'JPY', DEFAULT_NOTE_SETTINGS);
      // createNewNote内でpushとsaveが実行されるので、ここでは不要
      appState.currentNoteId = defaultNote.id;
      switchNote(defaultNote.id);
    }
  }
  return true;
}

/**
 * アプリケーション状態を初期化
 * ノートとグローバル設定（ダークモード）を読み込み
 */
export function initState() {
  // ノートの初期化を先に行う
  initNotes();

  // グローバル設定（ダークモードのみ）
  document.body.classList.toggle('dark', localStorage.getItem('darkMode') === 'true');
}

/**
 * 現在のノートのデータをUIから読み込み
 */
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

/**
 * 現在のノートの金種データを保存
 * UIから値を読み取り、ノートに保存
 */
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

/**
 * 現在のノートの設定を取得
 * @returns {Object} ノートの設定オブジェクト（デフォルト値を含む）
 */
export function getCurrentNoteSettings() {
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (!currentNote) return { ...DEFAULT_NOTE_SETTINGS };

  return {
    ...DEFAULT_NOTE_SETTINGS,
    ...(currentNote.settings || {})
  };
}

/**
 * 保存ポイントを追加（最新30件まで保持）
 * @param {string} noteId - ノートID
 * @param {string} memo - メモ
 * @param {Object} countsData - 金種データ
 * @param {number} total - 合計金額
 * @param {number} billCount - 紙幣枚数
 * @param {number} coinCount - 硬貨枚数
 * @returns {Object|boolean} 保存ポイントオブジェクト、失敗時false
 */
export function addSavedPoint(noteId, memo, countsData, total, billCount, coinCount) {
  const note = appState.notes.find(n => n.id === noteId);
  if (!note) return false;

  const savedPoint = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    memo: memo,
    counts: { ...countsData },
    total: total,
    billCount: billCount,
    coinCount: coinCount
  };

  if (!note.savedPoints) {
    note.savedPoints = [];
  }

  // 先頭に追加（新しいものが上）
  note.savedPoints.unshift(savedPoint);

  // MAX_SAVED_POINTSを超えたら古いものを削除
  if (note.savedPoints.length > MAX_SAVED_POINTS) {
    note.savedPoints = note.savedPoints.slice(0, MAX_SAVED_POINTS);
  }

  note.updatedAt = new Date().toISOString();
  saveNotesData(true); // 即座に保存
  return savedPoint;
}

/**
 * 保存ポイントを削除
 * @param {string} noteId - ノートID
 * @param {string} savedPointId - 保存ポイントID
 * @returns {boolean} 成功した場合true
 */
export function deleteSavedPoint(noteId, savedPointId) {
  const note = appState.notes.find(n => n.id === noteId);
  if (!note || !note.savedPoints) return false;

  const index = note.savedPoints.findIndex(sp => sp.id === savedPointId);
  if (index === -1) return false;

  note.savedPoints.splice(index, 1);
  note.updatedAt = new Date().toISOString();
  saveNotesData();
  return true;
}

/**
 * ノートの金種データを復元（上書き）
 * @param {string} noteId - ノートID
 * @param {Object} counts - 復元する金種データ
 * @returns {boolean} 成功した場合true
 */
export function restoreCounts(noteId, counts) {
  const note = appState.notes.find(n => n.id === noteId);
  if (!note) return false;

  note.counts = { ...counts };
  note.updatedAt = new Date().toISOString();
  saveNotesData(true); // 即座に保存
  return true;
}
