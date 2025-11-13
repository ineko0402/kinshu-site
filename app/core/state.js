// app/core/state.js
// ==============================
// アプリ全体の状態管理とlocalStorage同期
// ==============================

export const appState = {
  currentCurrency: 'JPY',
  hide2000: false,
  hideBills: false,
  hideCoins: false,
  currentInput: '',
  activeDisplay: null,
  isFirstInput: true
};

export function initState() {
  appState.hide2000 = localStorage.getItem('hide2000') === 'true';
  appState.hideBills = localStorage.getItem('hideBills') === 'true';
  appState.hideCoins = localStorage.getItem('hideCoins') === 'true';
  appState.currentCurrency = localStorage.getItem('currency') || 'JPY';
  document.body.classList.toggle('dark', localStorage.getItem('darkMode') === 'true');
}

export function loadState() {
  const saved = JSON.parse(localStorage.getItem(`counts_${appState.currentCurrency}`) || '{}');
  Object.keys(saved).forEach(k => {
    const el = document.querySelector(`.cell[data-id="${k}"] .display`);
    if (el) {
      el.dataset.value = saved[k];
      el.textContent = saved[k];
    }
  });
}

export function saveCounts() {
  const values = {};
  document.querySelectorAll('.cell').forEach(cell => {
    const id = cell.dataset.id;
    const val = cell.querySelector('.display').dataset.value || '0';
    values[id] = val;
  });
  localStorage.setItem(`counts_${appState.currentCurrency}`, JSON.stringify(values));
}

export function syncSettings() {
  localStorage.setItem('hide2000', appState.hide2000);
  localStorage.setItem('hideBills', appState.hideBills);
  localStorage.setItem('hideCoins', appState.hideCoins);
  localStorage.setItem('currency', appState.currentCurrency);
}
