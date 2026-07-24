// app/ui/settingsUI.js
import { downloadBackup, importBackupFromFile } from "../storage/backup.js";

/**
 * 設定モーダルを開く
 */
export function openSettings() {
  const template = document.getElementById("settingsTemplate");
  const clone = template.content.cloneNode(true);
  const overlay = clone.querySelector(".modal-overlay");
  const box = overlay.querySelector("#settings-box");

  box.querySelector("#darkModeCheckbox").checked =
    document.body.classList.contains("dark");

  box.querySelector("#darkModeCheckbox").addEventListener("change", (e) => {
    const checked = e.target.checked;
    document.body.classList.toggle("dark", checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
  });

  const exportBtn = box.querySelector("#exportBtn");
  const importBtn = box.querySelector("#importBtn");
  const importInput = box.querySelector("#importInput");

  exportBtn.addEventListener("click", () => {
    try {
      downloadBackup();
      alert("ノートデータをエクスポートしました。");
    } catch (error) {
      console.error(error);
      alert("エクスポートに失敗しました。");
    }
  });

  importBtn.addEventListener("click", () => {
    importInput.value = "";
    importInput.click();
  });

  importInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm("現在のノートデータを上書きしてインポートしますか？")) {
      return;
    }

    try {
      await importBackupFromFile(file);
      alert("ノートデータをインポートしました。ページをリロードします。");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "ファイルの読み込みに失敗しました。JSON形式を確認してください。",
      );
    }
  });

  const closeBtn = box.querySelector("#closeSettingsBtn");
  closeBtn.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add("show");
    document.body.classList.add("modal-open");
  });

  function closeOverlay() {
    overlay.classList.remove("show");
    document.body.classList.remove("modal-open");
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }
}

/**
 * 設定関連のイベントをバインド
 */
export function bindSettingsEvents() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
}
