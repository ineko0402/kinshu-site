// app/ui/keypad.js
// ==============================
// 入力UI制御（テンキー、入力、更新）
// ==============================

import { appState } from '../core/state.js';
import { safeEval } from '../core/utils.js';
import { updateSummary } from './renderer.js';
import { normalizeLeadingZeros, shouldNormalize } from '../core/utils.js';
import { applyHighlight } from './effects.js';

let prevKey = null;

export function bindKeypadEvents() {
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('keypadPanel');

  if (!overlay || !panel) return;

  overlay.addEventListener('click', e => {
    if (!panel.contains(e.target)) hideKeypad();
  });

  panel.addEventListener('click', e => {
    if (e.target.tagName !== 'BUTTON' || !appState.activeDisplay) return;

    const key = e.target.textContent;
    const inputEl = document.getElementById('keypadInput');
    const isNumber = /^[0-9]$/.test(key);

    switch (key) {
      case 'AC':
        appState.currentInput = '0';
        appState.isFirstInput = true;
        break;
      case '⇐':
        appState.currentInput = appState.currentInput.slice(0, -1) || '0';
        break;
      case '=':
      case 'Enter':
        appState.currentInput = safeEval(appState.currentInput);
        if (key === 'Enter') {
          const display = appState.activeDisplay;
          if (display) {
            display.dataset.value = appState.currentInput;
            display.textContent = appState.currentInput;
          }
          updateSummary();
          hideKeypad();
          return;
        }
        break;
      default:
        if (appState.isFirstInput && isNumber) {
          appState.currentInput = key;
        } else {
          if (appState.currentInput === '0' && !isNumber) appState.currentInput = '';
          appState.currentInput += key;
        }
        appState.isFirstInput = false;
        
        if (shouldNormalize(prevKey, key)) {
          const before = appState.currentInput;
          const after = normalizeLeadingZeros(before);

          if (before !== after) {
            appState.currentInput = after;
            applyHighlight(inputEl);
          }
        }

        prevKey = key;
    }

    inputEl.value = appState.currentInput;
  });

  // 各セルクリックでキーパッド表示
  document.addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (cell) showKeypad(cell);
  });
}

function showKeypad(cell) {
  if (!cell || !cell.querySelector('.display')) return;
  appState.activeDisplay = cell.querySelector('.display');
  appState.currentInput = appState.activeDisplay.dataset.value || '0';

  const kind = parseFloat(cell.dataset.kind);
  const count = parseFloat(appState.activeDisplay.dataset.value || '0');
  const currencyUnit = appState.currentCurrency === 'JPY' ? '円' : '元';
  const total = kind * count;
  const label = `${cell.dataset.label} ${total.toLocaleString()}${currencyUnit}（${count}枚）`;

  document.getElementById('keypadLabel').textContent = label;
  document.getElementById('keypadInput').value = appState.currentInput;
  document.getElementById('overlay').classList.add('show');
  appState.isFirstInput = true;
}

function hideKeypad() {
  document.getElementById('overlay').classList.remove('show');
  appState.activeDisplay = null;
  appState.currentInput = '';
}
