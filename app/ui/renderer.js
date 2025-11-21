// app/ui/renderer.js
// ==============================
// 通貨リスト描画と集計更新
// ==============================

import { appState, saveCounts } from '../core/state.js';
import { jpyData, cnyData } from '../core/data.js';

export function renderCurrency() {
  const container = document.querySelector('.container');
  if (!container) return;

  const billsEl = container.querySelector('.bills');
  const coinsEl = container.querySelector('.coins');
  if (!billsEl || !coinsEl) return;

  // JPYとCNYのセルコンテナの表示/非表示を切り替える
  const isJPY = appState.currentCurrency === 'JPY';
  document.querySelectorAll('.container > .bills:not(.cny-cells), .container > .coins:not(.cny-cells)').forEach(el => {
    el.style.display = isJPY ? 'grid' : 'none';
  });
  document.querySelectorAll('.cny-cells').forEach(el => {
    el.style.display = isJPY ? 'none' : 'grid';
  });

  // 通貨切り替え時のクラス設定とデータ取得
  document.body.classList.toggle('layout-cny', appState.currentCurrency === 'CNY');
  const data = isJPY ? jpyData : cnyData;

  // JPYの場合のみ、設定に基づいて無効化
  if (isJPY) {
    // JPYのセルのみを対象とする
    document.querySelectorAll('.container > .bills:not(.cny-cells) .cell, .container > .coins:not(.cny-cells) .cell').forEach(cell => {
      cell.classList.remove('disabled');
      cell.style.opacity = '';
      cell.style.pointerEvents = '';

      const id = cell.dataset.id;
      const item = data.find(d => d.id === id);
      if (!item) return;

      const { kind, isCoin } = item;
      const bill = !isCoin && kind >= 1;
      const coin = !!isCoin || kind < 1;
      const is2000 = kind === 2000;

      let disabled = false;
      if (is2000 && appState.hide2000) disabled = true;
      if (bill && appState.hideBills) disabled = true;
      if (coin && appState.hideCoins) disabled = true;

      if (disabled) {
        cell.classList.add('disabled');
        cell.style.opacity = '0.4';
        cell.style.pointerEvents = 'none';
      }
    });
  } else {
    // CNYの場合は無効化設定がないため、全てのセルを有効化
    document.querySelectorAll('.cny-cells .cell').forEach(cell => {
      cell.classList.remove('disabled');
      cell.style.opacity = '';
      cell.style.pointerEvents = '';
    });
  }

  // 保存値を復元
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (currentNote) {
    const saved = currentNote.counts || {};
    document.querySelectorAll('.cell').forEach(cell => {
      const id = cell.dataset.id;
      const val = saved[id];
      const d = cell.querySelector('.display');
      if (val !== undefined) {
        d.dataset.value = val;
        d.textContent = val;
      } else {
        d.dataset.value = '0';
        d.textContent = '0';
      }
    });
  }

  updateSummary();
}

export function updateSummary() {
  const data = appState.currentCurrency === 'JPY' ? jpyData : cnyData;
  let total = 0, bills = 0, coins = 0;

  document.querySelectorAll('.cell').forEach(cell => {
    const val = parseFloat(cell.querySelector('.display').dataset.value || '0');
    if (isNaN(val)) return;

    const id = cell.dataset.id;
    const item = data.find(d => d.id === id);
    if (!item) return;

    const amt = item.kind * val;
    if (item.isCoin || item.kind < 1) coins += val;
    else bills += val;
    total += amt;
  });

  const unit = appState.currentCurrency === 'JPY' ? '円' : '元';
  document.getElementById('total').textContent = `${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
  document.getElementById('billCount').textContent = bills;
  document.getElementById('coinCount').textContent = coins;
  document.getElementById('totalCount').textContent = bills + coins;

  saveCounts();
}

export function resetAll() {
  document.querySelectorAll('.display').forEach(d => {
    d.dataset.value = '0';
    d.textContent = '0';
  });
  updateSummary();
}
