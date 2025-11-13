// app/main.js
// ==============================
// アプリのエントリーポイント
// ==============================

import { initState, loadState } from './core/state.js';
import { renderCurrency } from './ui/renderer.js';
import { bindKeypadEvents } from './ui/keypad.js';
import { bindSettingsEvents } from './ui/settings.js';
import { bindExportEvents } from './export/imageExport.js';

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

  console.log('[INIT] アプリが初期化されました。');
});
