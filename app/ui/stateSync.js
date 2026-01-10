// app/ui/stateSync.js
// ==============================
// 状態とUIの同期処理
// DOM操作を含む関数を集約
// ==============================

import { appState } from '../core/state.js';

/**
 * 現在のノートのデータをUIから読み込み
 * state.jsのDOM依存を排除するため、UI層に移動
 */
export function loadStateToUI() {
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
 * 現在のノートの金種データをUIから保存
 * UIの値を読み取り、ノートに保存
 * @param {Function} saveCallback - 保存処理を実行するコールバック（app/core/storage.jsから提供）
 */
export function saveCountsFromUI(saveCallback) {
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

    // 保存処理を実行（state.jsのsaveNotesDataを呼び出す）
    if (saveCallback) {
        saveCallback();
    }
}
