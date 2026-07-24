// app/ui/noteUI.js
import {
  appState,
  switchNote,
  createNewNote,
  updateNoteName,
  updateNoteSettings,
  deleteNote,
} from "../core/state.js";
import { renderCurrency, updateSummary } from "./renderer.js";
import { saveCountsFromUI, loadStateToUI } from "./stateSync.js";

// saveNotesData を呼び出すためのヘルパー（循環参照を避けるため）
let saveNotesDataFn = null;
async function initSaveNotesDataFn() {
  if (!saveNotesDataFn) {
    const { saveNotesData } = await import("../core/state.js");
    saveNotesDataFn = () => saveNotesData();
  }
}

/**
 * ノートの色をCSS変数に適用する
 */
export function applyNoteColor() {
  const root = document.documentElement;
  const isDark = document.body.classList.contains("dark");
  root.style.setProperty(
    "--accent-color-raw",
    isDark ? "255, 255, 255" : "52, 58, 64",
  );
}

/**
 * ノート表示（ヘッダー等のノート名）を更新
 */
export function updateNoteDisplay() {
  const currentNote = appState.notes.find(
    (n) => n.id === appState.currentNoteId,
  );
  const noteNameEl = document.getElementById("currentNoteName");
  if (noteNameEl && currentNote) {
    noteNameEl.textContent = `${currentNote.name} (${currentNote.currency})`;
  }

  // PC用の表示も更新
  const pcNoteNameEl = document.getElementById("pc-currentNoteName");
  if (pcNoteNameEl && currentNote) {
    pcNoteNameEl.textContent = `${currentNote.name} (${currentNote.currency})`;
  }
}

/**
 * PCサイドバー用のノート一覧描画
 */
export function renderSidebarNoteList() {
  const container = document.getElementById("pc-sidebar-note-list");
  if (!container) return;

  container.innerHTML = "";
  appState.notes.forEach((note) => {
    const div = document.createElement("div");
    div.className = "note-item";
    div.dataset.id = note.id;
    if (note.id === appState.currentNoteId) {
      div.classList.add("active");
      div.style.borderLeft = "4px solid var(--accent)";
    } else {
      div.style.borderLeft = "4px solid transparent";
    }

    div.innerHTML = `
      <div class="note-name ${note.id === appState.currentNoteId ? "active" : ""}" style="flex: 1; padding: 5px;">
        ${note.name} <br>
        <small style="color: var(--text-secondary)">${note.currency}</small>
      </div>
      <div class="note-actions" style="display: flex; gap: 4px;">
        <button class="edit-note-btn" title="編集"><span class="material-symbols-outlined" style="font-size: 18px;">edit</span></button>
        <button class="delete-note-btn" title="削除"><span class="material-symbols-outlined" style="font-size: 18px;">delete</span></button>
      </div>
    `;

    div.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (target?.classList.contains("edit-note-btn")) {
        openNoteEditModal(note.id, () => {
          renderSidebarNoteList();
          updateNoteDisplay();
        });
        return;
      }

      if (target?.classList.contains("delete-note-btn")) {
        if (appState.notes.length <= 1) {
          alert("最後のノートは削除できません。");
          return;
        }
        if (confirm(`ノート「${note.name}」を削除しますか？`)) {
          deleteNote(note.id);
          renderSidebarNoteList();
          renderCurrency();
          updateSummary();
          updateNoteDisplay();
        }
        return;
      }

      if (note.id !== appState.currentNoteId) {
        handleNoteSwitch(note.id);
      }
    });

    container.appendChild(div);
  });
}

/**
 * ノートの切り替え共通処理
 */
export async function handleNoteSwitch(noteId) {
  // saveNotesData関数を準備
  await initSaveNotesDataFn();

  // 現在のノートの状態を保存
  saveCountsFromUI(saveNotesDataFn);

  // ノートを切り替え
  const success = switchNote(noteId);
  if (success) {
    const note = appState.notes.find((n) => n.id === noteId);

    // 新しいノートのデータをUIに反映
    loadStateToUI();
    applyNoteColor();
    renderCurrency();
    updateSummary();
    updateNoteDisplay();
    renderSidebarNoteList();

    // 履歴サイドバーがある場合はそれも更新（循環参照を避けるため dispatchEvent 等を検討するか、main側で行う）
    document.dispatchEvent(
      new CustomEvent("noteSwitched", { detail: { noteId } }),
    );
  }
}

/**
 * モーダル共通のクローズ処理
 */
function closeOverlay(overlay) {
  overlay.classList.remove("show");
  document.body.classList.remove("modal-open");
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }, 300);
}

/**
 * ノート編集モーダルを開く
 */
export function openNoteEditModal(noteId, onUpdate = null) {
  const note = appState.notes.find((n) => n.id === noteId);
  if (!note) return;

  const template = document.getElementById("noteEditTemplate");
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById("note-edit-overlay");
  const closeBtn = document.getElementById("closeNoteEditBtn");
  const saveBtn = document.getElementById("saveNoteEditBtn");
  const noteNameInput = document.getElementById("noteNameInput");
  const currencyDisplay = document.getElementById("currencyDisplay");
  const messageBar = document.getElementById("noteEditMessage");

  requestAnimationFrame(() => {
    overlay.classList.add("show");
    document.body.classList.add("modal-open");

    // モバイルでの視認性改善: 入力フィールドにフォーカスしてスクロール
    setTimeout(() => {
      noteNameInput.focus();
      noteNameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  });

  noteNameInput.value = note.name;
  currencyDisplay.textContent = note.currency;

  if (note.currency === "JPY") {
    overlay.querySelector(".note-settings-section").classList.add("visible");
    const settings = note.settings || {};
    overlay.querySelector("#noteHide2000").checked = settings.hide2000 || false;
    overlay.querySelector("#noteHideBills").checked =
      settings.hideBills || false;
    overlay.querySelector("#noteHideCoins").checked =
      settings.hideCoins || false;
  }

  saveBtn.addEventListener("click", () => {
    const newName = noteNameInput.value.trim();
    if (!newName) return;

    updateNoteName(noteId, newName);

    if (note.currency === "JPY") {
      updateNoteSettings(noteId, {
        hide2000: overlay.querySelector("#noteHide2000").checked,
        hideBills: overlay.querySelector("#noteHideBills").checked,
        hideCoins: overlay.querySelector("#noteHideCoins").checked,
      });
    }

    if (noteId === appState.currentNoteId) {
      applyNoteColor();
      renderCurrency();
      updateSummary();
      updateNoteDisplay();
    }

    if (onUpdate) onUpdate();
    renderSidebarNoteList();
    closeOverlay(overlay);
  });

  closeBtn.addEventListener("click", () => closeOverlay(overlay));
}

/**
 * ノート作成モーダルを開く
 */
export function openNoteCreateModal(onUpdate = null) {
  const template = document.getElementById("noteCreateTemplate");
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById("note-create-overlay");
  const closeBtn = document.getElementById("closeNoteCreateBtn");
  const createBtn = document.getElementById("createNoteBtn");
  const noteNameInput = document.getElementById("newNoteNameInput");
  const currencySelect = document.getElementById("newNoteCurrencySelect");

  noteNameInput.value = `新規ノート ${appState.notes.length + 1}`;

  requestAnimationFrame(() => {
    overlay.classList.add("show");
    document.body.classList.add("modal-open");

    // モバイルでの視認性改善: 入力フィールドにフォーカスしてスクロール
    setTimeout(() => {
      noteNameInput.focus();
      noteNameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  });

  createBtn.addEventListener("click", () => {
    const name = noteNameInput.value.trim();
    if (!name) return;

    const currency = currencySelect.value;
    const settings = {
      hide2000:
        currency === "JPY" && overlay.querySelector("#newNoteHide2000").checked,
      hideBills:
        currency === "JPY" &&
        overlay.querySelector("#newNoteHideBills").checked,
      hideCoins:
        currency === "JPY" &&
        overlay.querySelector("#newNoteHideCoins").checked,
    };

    const newNote = createNewNote(name, currency, settings);
    handleNoteSwitch(newNote.id);

    if (onUpdate) onUpdate();
    closeOverlay(overlay);
  });

  closeBtn.addEventListener("click", () => closeOverlay(overlay));
}

/**
 * ノート切り替えモーダル
 */
export function openNoteSwitchModal() {
  const template = document.getElementById("noteSwitchTemplate");
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById("note-overlay");
  const closeBtn = document.getElementById("closeNoteBtn");
  const noteListEl = document.getElementById("noteList");
  const newNoteBtn = document.getElementById("newNoteBtn");

  const renderNoteList = () => {
    noteListEl.innerHTML = "";
    appState.notes.forEach((note) => {
      const li = document.createElement("li");
      li.className = "note-item";
      li.dataset.id = note.id;
      li.innerHTML = `
        <span class="note-name ${note.id === appState.currentNoteId ? "active" : ""}">${note.name} (${note.currency})</span>
        <div class="note-actions">
          <button class="edit-note-btn" title="編集"><span class="material-symbols-outlined">edit</span></button>
          <button class="delete-note-btn" title="削除"><span class="material-symbols-outlined">delete</span></button>
        </div>
      `;
      noteListEl.appendChild(li);
    });
  };

  renderNoteList();

  noteListEl.addEventListener("click", (e) => {
    const li = e.target.closest(".note-item");
    if (!li) return;
    const noteId = li.dataset.id;
    const button = e.target.closest("button");

    if (button?.classList.contains("delete-note-btn")) {
      if (appState.notes.length <= 1)
        return alert("最後のノートは削除できません。");
      if (confirm("このノートを削除しますか？")) {
        deleteNote(noteId);
        renderNoteList();
        updateNoteDisplay();
        renderSidebarNoteList();
      }
    } else if (button?.classList.contains("edit-note-btn")) {
      openNoteEditModal(noteId, renderNoteList);
    } else {
      handleNoteSwitch(noteId);
      closeOverlay(overlay);
    }
  });

  newNoteBtn.addEventListener("click", () => {
    openNoteCreateModal(() => {
      renderNoteList();
      renderSidebarNoteList();
    });
  });

  requestAnimationFrame(() => {
    overlay.classList.add("show");
    document.body.classList.add("modal-open");
  });

  closeBtn.addEventListener("click", () => closeOverlay(overlay));
}
