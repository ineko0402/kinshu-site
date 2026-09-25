// app/ui/noteUI.js
import {
  appState,
  switchNote,
  createNewNote,
  updateNoteName,
  updateNoteSettings,
  deleteNote,
  saveNotesData,
} from "../core/state.js";
import { renderCurrency, updateSummary } from "./renderer.js";
import { saveCountsFromUI, loadStateToUI } from "./stateSync.js";

// saveNotesData を呼び出すためのヘルパー（循環参照を避けるため）
let saveNotesDataFn = null;

// notes 配列の順番が手動順。旧データに pinned がない場合も通常ノートとして扱う。
function getOrderedNotes() {
  return [
    ...appState.notes.filter((note) => note.pinned),
    ...appState.notes.filter((note) => !note.pinned),
  ];
}

function setNotePinned(noteId, pinned) {
  const note = appState.notes.find((item) => item.id === noteId);
  if (!note) return false;
  note.pinned = pinned;
  saveNotesData(true);
  return true;
}

function moveNote(noteId, direction) {
  const note = appState.notes.find((item) => item.id === noteId);
  if (!note || (direction !== -1 && direction !== 1)) return false;
  const peers = appState.notes.filter((item) => Boolean(item.pinned) === Boolean(note.pinned));
  const index = peers.findIndex((item) => item.id === noteId);
  const neighbor = peers[index + direction];
  if (!neighbor) return false;
  const from = appState.notes.indexOf(note);
  const to = appState.notes.indexOf(neighbor);
  [appState.notes[from], appState.notes[to]] = [appState.notes[to], appState.notes[from]];
  saveNotesData(true);
  return true;
}

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
    const currencyLabel = currentNote.currency === "JPY" ? "円" : "元";
    noteNameEl.textContent = `${currentNote.name} · ${currencyLabel}`;
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
  getOrderedNotes().forEach((note) => {
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
        ${note.pinned ? '<span class="material-symbols-outlined sidebar-pin" title="ピン留め">push_pin</span>' : ''}<span class="note-title"></span><br>
        <small style="color: var(--text-secondary)">${note.currency}</small>
      </div>
      <div class="note-actions" style="display: flex; gap: 4px;">
        <button class="edit-note-btn" title="編集"><span class="material-symbols-outlined" style="font-size: 18px;">edit</span></button>
        <button class="delete-note-btn" title="削除"><span class="material-symbols-outlined" style="font-size: 18px;">delete</span></button>
      </div>
    `;
    div.querySelector(".note-title").textContent = note.name;

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
function closeOverlay(overlay, escapeHandler = null) {
  if (
    !overlay ||
    (!overlay.classList.contains("show") &&
      !overlay.classList.contains("closing"))
  )
    return;

  if (escapeHandler) {
    document.removeEventListener("keydown", escapeHandler);
  }

  overlay.classList.remove("show");
  overlay.classList.add("closing");
  document.body.classList.remove("modal-open");

  setTimeout(() => {
    overlay.classList.remove("closing");
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }, 260);
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

  const overlay =
    clone.querySelector(".modal-overlay") ||
    document.getElementById("note-edit-overlay");
  const closeBtn = overlay.querySelector("#closeNoteEditBtn");
  const saveBtn = overlay.querySelector("#saveNoteEditBtn");
  const noteNameInput = overlay.querySelector("#noteNameInput");
  const handleEscape = (e) => {
    if (e.key === "Escape") closeOverlay(overlay, handleEscape);
  };
  document.addEventListener("keydown", handleEscape);
  const currencyDisplay = overlay.querySelector("#currencyDisplay");
  const messageBar = overlay.querySelector("#noteEditMessage");

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
    closeOverlay(overlay, handleEscape);
  });

  closeBtn.addEventListener("click", () => closeOverlay(overlay, handleEscape));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay(overlay, handleEscape);
  });
}

/**
 * ノート作成モーダルを開く
 */
export function openNoteCreateModal(onUpdate = null) {
  const template = document.getElementById("noteCreateTemplate");
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay =
    clone.querySelector(".modal-overlay") ||
    document.getElementById("note-create-overlay");
  const closeBtn = overlay.querySelector("#closeNoteCreateBtn");
  const createBtn = overlay.querySelector("#createNoteBtn");
  const noteNameInput = overlay.querySelector("#newNoteNameInput");
  const handleEscape = (e) => {
    if (e.key === "Escape") closeOverlay(overlay, handleEscape);
  };
  document.addEventListener("keydown", handleEscape);
  const currencySelect = overlay.querySelector("#newNoteCurrencySelect");

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
    closeOverlay(overlay, handleEscape);
  });

  closeBtn.addEventListener("click", () => closeOverlay(overlay, handleEscape));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay(overlay, handleEscape);
  });
}

/**
 * ノート切り替えモーダル
 */
export function openNoteSwitchModal() {
  const template = document.getElementById("noteSwitchTemplate");
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay =
    clone.querySelector(".modal-overlay") ||
    document.getElementById("note-overlay");
  const closeBtn = overlay.querySelector("#closeNoteBtn");
  const noteListEl = overlay.querySelector("#noteList");
  const newNoteBtn = overlay.querySelector("#newNoteBtn");
  const manageBtn = overlay.querySelector("#manageNotesBtn");
  const actions = overlay.querySelector("#noteManageActions");
  const moveUpBtn = overlay.querySelector("#moveNoteUpBtn");
  const moveDownBtn = overlay.querySelector("#moveNoteDownBtn");
  const editBtn = overlay.querySelector("#editSelectedNoteBtn");
  const deleteBtn = overlay.querySelector("#deleteSelectedNotesBtn");
  const selected = new Set();
  let managing = false;
  const handleEscape = (e) => {
    if (e.key === "Escape") closeOverlay(overlay, handleEscape);
  };
  document.addEventListener("keydown", handleEscape);

  const updateActions = () => {
    const label = managing ? "整理を完了" : "ノートを整理";
    manageBtn.querySelector(".material-symbols-outlined").textContent = managing ? "check" : "checklist";
    manageBtn.setAttribute("aria-label", label);
    manageBtn.title = label;
    manageBtn.setAttribute("aria-pressed", String(managing));
    actions.hidden = !managing;
    const onlyId = selected.size === 1 ? [...selected][0] : null;
    const note = appState.notes.find((item) => item.id === onlyId);
    const peers = note ? getOrderedNotes().filter((item) => Boolean(item.pinned) === Boolean(note.pinned)) : [];
    const index = peers.findIndex((item) => item.id === onlyId);
    moveUpBtn.disabled = index <= 0;
    moveDownBtn.disabled = index < 0 || index === peers.length - 1;
    editBtn.disabled = !onlyId;
    deleteBtn.disabled = selected.size === 0 || selected.size === appState.notes.length;
  };

  const renderNoteList = () => {
    noteListEl.replaceChildren();
    for (const note of getOrderedNotes()) {
      const li = document.createElement("li");
      li.className = "note-item note-switch-item";
      li.dataset.id = note.id;
      const name = `${note.name} (${note.currency})`;

      if (managing) {
        const label = document.createElement("label");
        label.className = "note-check-label";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selected.has(note.id);
        checkbox.setAttribute("aria-label", `選択: ${name}`);
        const text = document.createElement("span");
        text.className = "note-name";
        text.textContent = name;
        label.append(checkbox, text);
        li.appendChild(label);
      } else {
        const switchBtn = document.createElement("button");
        switchBtn.type = "button";
        switchBtn.className = "note-select-btn";
        switchBtn.textContent = name;
        if (note.id === appState.currentNoteId) switchBtn.setAttribute("aria-current", "true");
        li.appendChild(switchBtn);
      }

      const pinBtn = document.createElement("button");
      pinBtn.type = "button";
      pinBtn.className = `note-pin-btn${note.pinned ? " is-pinned" : ""}`;
      pinBtn.title = note.pinned ? "ピンを外す" : "ピン留め";
      pinBtn.setAttribute("aria-label", pinBtn.title);
      pinBtn.setAttribute("aria-pressed", String(Boolean(note.pinned)));
      pinBtn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">push_pin</span>';
      li.appendChild(pinBtn);
      noteListEl.appendChild(li);
    }
    updateActions();
  };

  manageBtn.addEventListener("click", () => {
    managing = !managing;
    selected.clear();
    renderNoteList();
  });

  noteListEl.addEventListener("change", (event) => {
    if (event.target.type !== "checkbox") return;
    const id = event.target.closest(".note-item")?.dataset.id;
    if (!id) return;
    if (event.target.checked) selected.add(id);
    else selected.delete(id);
    updateActions();
  });

  noteListEl.addEventListener("click", (event) => {
    const li = event.target.closest(".note-item");
    if (!li) return;
    const noteId = li.dataset.id;
    if (event.target.closest(".note-pin-btn")) {
      const note = appState.notes.find((item) => item.id === noteId);
      if (note && setNotePinned(noteId, !note.pinned)) {
        renderNoteList();
        renderSidebarNoteList();
      }
    } else if (event.target.closest(".note-select-btn")) {
      handleNoteSwitch(noteId);
      closeOverlay(overlay, handleEscape);
    }
  });

  for (const [button, direction] of [[moveUpBtn, -1], [moveDownBtn, 1]]) {
    button.addEventListener("click", () => {
      if (selected.size !== 1) return;
      if (moveNote([...selected][0], direction)) {
        renderNoteList();
        renderSidebarNoteList();
      }
    });
  }

  editBtn.addEventListener("click", () => {
    if (selected.size === 1) openNoteEditModal([...selected][0], renderNoteList);
  });

  deleteBtn.addEventListener("click", () => {
    const ids = [...selected];
    if (ids.length === 0 || ids.length >= appState.notes.length) return;
    if (!confirm(`選択した${ids.length}件のノートを削除しますか？`)) return;
    const activeDeleted = ids.includes(appState.currentNoteId);
    ids.forEach((id) => deleteNote(id));
    selected.clear();
    if (activeDeleted) {
      switchNote(getOrderedNotes()[0].id);
      loadStateToUI();
      renderCurrency();
      updateSummary();
      document.dispatchEvent(new CustomEvent("noteSwitched", { detail: { noteId: appState.currentNoteId } }));
    }
    updateNoteDisplay();
    renderNoteList();
    renderSidebarNoteList();
  });

  renderNoteList();

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

  closeBtn.addEventListener("click", () => closeOverlay(overlay, handleEscape));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay(overlay, handleEscape);
  });
}
