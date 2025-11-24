// app/ui/settings.js
// ==============================
// 設定モーダルおよびUIトグル制御
// ==============================

import { appState, syncSettings } from '../core/state.js';
import { renderCurrency } from './renderer.js';

export function bindSettingsEvents() {
  const btn = document.getElementById('settingsBtn');
  if (!btn) return;
  btn.addEventListener('click', openSettings);
}

export function openSettings() {
  if (document.getElementById('settings-box')) return;

  const tpl = document.getElementById('settingsTemplate');
  const overlay = tpl.content.cloneNode(true).querySelector('.modal-overlay');
  const box = overlay.querySelector('#settings-box');

  box.querySelector('#darkModeCheckbox').checked = document.body.classList.contains('dark');
  box.querySelector('#currencyToggleCheckbox').checked = appState.currentCurrency === 'CNY';
  box.querySelector('#hide2000Checkbox').checked = appState.hide2000;
  box.querySelector('#hideBillsCheckbox').checked = appState.hideBills;
  box.querySelector('#hideCoinsCheckbox').checked = appState.hideCoins;

  box.querySelectorAll('input[type="checkbox"]').forEach(chk => {
    chk.addEventListener('change', e => {
      const id = e.target.id;
      const checked = e.target.checked;

      switch (id) {
        case 'darkModeCheckbox':
          document.body.classList.toggle('dark', checked);
          localStorage.setItem('darkMode', checked);
          break;
        case 'currencyToggleCheckbox':
          // ノート管理に移行したため、このUIからの直接の通貨変更は行わない
          alert('通貨の切り替えは、ノートの作成・切り替え時に行われます。');
          e.target.checked = appState.currentCurrency === 'CNY'; // 状態を元に戻す
          break;
        case 'hide2000Checkbox':
          appState.hide2000 = checked;
          break;
        case 'hideBillsCheckbox':
          appState.hideBills = checked;
          break;
        case 'hideCoinsCheckbox':
          appState.hideCoins = checked;
          break;
      }

      syncSettings();
      renderCurrency();
    });
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector('#closeSettingsBtn').addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}
