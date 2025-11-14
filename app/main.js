// app/main.js
// ==============================
// アプリのエントリーポイント
// ==============================

import { initState, loadState } from './core/state.js';
import { renderCurrency } from './ui/renderer.js';
import { bindKeypadEvents } from './ui/keypad.js';
import { bindSettingsEvents } from './ui/settings.js';
import { bindExportEvents } from './export/imageExport.js';
import { resetAll } from './ui/renderer.js';
import { downloadImage } from './export/imageExport.js';
import { openSettings } from './ui/settings.js';

// DOM構築完了後に初期化
window.addEventListener('DOMContentLoaded', () => {
  // 状態初期化・読込
  initState();
  loadState();

  // 通貨レンダリング
  renderCurrency();

  // イベント登録
  bindKeypadEvents();
  bindSettingsEvents();
  bindExportEvents();

  document.getElementById('clearAllBtn').addEventListener('click', resetAll);
  document.getElementById('downloadBtn').addEventListener('click', downloadImage);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  console.log('[INIT] アプリが初期化されました。');
});
