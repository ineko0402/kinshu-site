import { createBackupBlob } from "./export.js";
import { parseBackupJson } from "./import.js";
import { applyImportedBackup } from "../core/state.js";

const BACKUP_FILENAME_PREFIX = "kinshu_backup_";

export function downloadBackup() {
  const blob = createBackupBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${BACKUP_FILENAME_PREFIX}${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackupFromFile(file) {
  const text = await file.text();
  const payload = parseBackupJson(text);
  applyImportedBackup(payload);
}
