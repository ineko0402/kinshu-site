// app/main.js
import { initState, appState } from "./core/state.js";
import {
  renderCurrency,
  resetAll,
  updateSummary,
  setSaveNotesDataFn,
} from "./ui/renderer.js";
import { loadStateToUI } from "./ui/stateSync.js";
import { bindKeypadEvents } from "./ui/keypad.js";

// 分割したUIモジュールをインポート
import {
  applyNoteColor,
  updateNoteDisplay,
  renderSidebarNoteList,
  openNoteSwitchModal,
  openNoteCreateModal,
} from "./ui/noteUI.js";
import {
  renderSidebarHistoryList,
  openSavePointModal,
  openHistoryModal,
  showHistoryDetail,
} from "./ui/historyUI.js";
import { bindSettingsEvents, openSettings } from "./ui/settingsUI.js";

// DOM構築完了後に初期化
window.addEventListener("DOMContentLoaded", () => {
  // 状態初期化・読込
  initState();

  // saveNotesData関数をrenderer.jsに提供（循環参照を避けるため）
  // state.jsから直接importしてもよいが、将来storage.jsに分離する場合に備える
  import("./core/state.js").then(({ saveNotesData }) => {
    function saveNotesDataWrapper() {
      saveNotesData();
    }
    setSaveNotesDataFn(saveNotesDataWrapper);
  });

  // UIへの状態反映
  loadStateToUI();

  // 現在のノートの設定を反映
  const currentNote = appState.notes.find(
    (n) => n.id === appState.currentNoteId,
  );
  if (currentNote) {
    applyNoteColor();
  }

  // 各種レンダリング
  renderCurrency();
  updateNoteDisplay();
  renderSidebarNoteList();
  renderSidebarHistoryList();

  // イベントバインド
  bindKeypadEvents();
  bindSettingsEvents();

  // グローバルなボタンイベント
  document.getElementById("clearAllBtn")?.addEventListener("click", resetAll);
  document
    .getElementById("pc-clearAllBtn")
    ?.addEventListener("click", resetAll);
  document
    .getElementById("saveBtn")
    ?.addEventListener("click", openSavePointModal);
  document.getElementById("detailBtn")?.addEventListener("click", async () => {
    const currentNote = appState.notes.find(
      (n) => n.id === appState.currentNoteId,
    );
    if (!currentNote) return;

    const data =
      currentNote.currency === "JPY"
        ? (await import("./core/data.js")).jpyData
        : (await import("./core/data.js")).cnyData;
    const counts = {};
    let total = 0;
    let bills = 0;
    let coins = 0;

    document.querySelectorAll(".cell").forEach((cell) => {
      const val = parseFloat(
        cell.querySelector(".display").dataset.value || "0",
      );
      const id = cell.dataset.id;
      const item = data.find((d) => d.id === id);
      if (!item) return;

      counts[id] = val;
      total += item.kind * val;
      if (item.isCoin || item.kind < 1) coins += val;
      else bills += val;
    });

    showHistoryDetail({
      memo: "詳細",
      counts,
      total,
      timestamp: Date.now(),
    });
  });
  document
    .getElementById("pc-saveBtn")
    ?.addEventListener("click", openSavePointModal);
  document
    .getElementById("historyBtn")
    ?.addEventListener("click", openHistoryModal);
  document
    .getElementById("settingsBtn")
    ?.addEventListener("click", openSettings);
  document
    .getElementById("headerSettingsBtn")
    ?.addEventListener("click", openSettings);
  document
    .getElementById("noteSwitchBtn")
    ?.addEventListener("click", openNoteSwitchModal);

  // PC用サイドバー限定のイベント
  document.getElementById("pc-newNoteBtn")?.addEventListener("click", () => {
    openNoteCreateModal(() => {
      renderSidebarNoteList();
    });
  });

  console.log("[INIT] アプリがリファクタリング後の構成で初期化されました。");
});

// ノート切り替え時の連動（必要に応じて）
document.addEventListener("noteSwitched", () => {
  renderSidebarHistoryList();
});
