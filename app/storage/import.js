/**
 * バックアップJSON文字列をパースしてバリデーションする
 * @param {string} text
 * @returns {Object}
 * @throws {Error}
 */
export function parseBackupJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error("JSONのパースに失敗しました。");
  }

  if (!data || typeof data !== "object") {
    throw new Error("データ形式が不正です。");
  }
  if (!Array.isArray(data.notes)) {
    throw new Error("notesプロパティが配列ではありません。");
  }
  if (typeof data.currentNoteId !== "string") {
    throw new Error("currentNoteIdが文字列ではありません。");
  }

  data.notes.forEach((note, index) => {
    if (!note || typeof note !== "object") {
      throw new Error(`notes[${index}]がオブジェクトではありません。`);
    }
    if (typeof note.id !== "string") {
      throw new Error(`notes[${index}].idが文字列ではありません。`);
    }
    if (!Array.isArray(note.savedPoints)) {
      throw new Error(`notes[${index}].savedPointsが配列ではありません。`);
    }
  });

  return data;
}
