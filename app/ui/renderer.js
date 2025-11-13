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

  billsEl.innerHTML = '';
  coinsEl.innerHTML = '';

  const data = appState.currentCurrency === 'JPY' ? jpyData : cnyData;
  document.body.classList.toggle('layout-cny', appState.currentCurrency === 'CNY');

  data.forEach(({ id, kind, label, isCoin }) => {
    const coin = !!isCoin || kind < 1;
    const bill = !coin;
    const is2000 = kind === 2000;

    let disabled = false;
    if (appState.currentCurrency === 'JPY') {
      if (is2000 && appState.hide2000) disabled = true;
      if (bill && appState.hideBills) disabled = true;
      if (coin && appState.hideCoins) disabled = true;
    }

    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.id = id;
    cell.dataset.kind = kind;
    cell.dataset.label = label;
    cell.innerHTML = `${label}<div class="display" data-value="0">0</div>`;

    if (disabled) {
      cell.classList.add('disabled');
      cell.style.opacity = '0.4';
      cell.style.pointerEvents = 'none';
    }

    const target = coin ? coinsEl : billsEl;
    target.appendChild(cell);
  });

  // 保存値を復元
  const saved = JSON.parse(localStorage.getItem(`counts_${appState.currentCurrency}`) || '{}');
  document.querySelectorAll('.cell').forEach(cell => {
    const id = cell.dataset.id;
    const val = saved[id];
    if (val !== undefined) {
      const d = cell.querySelector('.display');
      d.dataset.value = val;
      d.textContent = val;
    }
  });

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
