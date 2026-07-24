import { appState } from "../core/state.js";

/**
 * バックアップ用ペイロードを生成する
 */
export function createBackupPayload() {
  return {
    schemaVersion: "1",
    exportedAt: new Date().toISOString(),
    currentNoteId: appState.currentNoteId,
    notes: appState.notes,
  };
}

/**
 * JSON Blob を生成する
 */
export function createBackupBlob() {
  const payload = createBackupPayload();
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
}
