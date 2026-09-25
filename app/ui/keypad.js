// app/ui/keypad.js
// ==============================
// 入力UI制御（テンキー、入力、更新）
// ==============================

import { appState } from '../core/state.js';
import { safeEval } from '../core/utils.js';
import { updateSummary } from './renderer.js';
import { bindBackdropDismiss } from './backdropDismiss.js';

export function bindKeypadEvents() {
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('keypadPanel');

  if (!overlay || !panel) return;

  bindBackdropDismiss(overlay, hideKeypad);

  panel.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') handleKeypadKey(e.target.textContent);
  });

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('show') || !appState.activeDisplay ||
        e.isComposing || e.ctrlKey || e.altKey || e.metaKey) return;

    const key = e.key === '*' ? '×' : e.key === '/' ? '÷' :
      e.key === 'Backspace' ? '⇐' : e.key === 'Delete' ? 'AC' : e.key;
    if (!/^[0-9.+\-×÷]$/.test(key) && !['Enter', '⇐', 'AC', 'Escape'].includes(key)) return;

    e.preventDefault();
    if (key === 'Escape') hideKeypad();
    else handleKeypadKey(key);
  });

  // 各セルクリックでキーパッド表示
  document.addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (cell) showKeypad(cell);
  });
}

function handleKeypadKey(key) {
  if (!appState.activeDisplay) return;
  const isNumber = /^[0-9]$/.test(key) || key === '00';
  const isOperator = /^[+\-×÷]$/.test(key);

  switch (key) {
    case 'AC':
      appState.currentInput = '0';
      appState.isFirstInput = true;
      break;
    case '⇐':
      appState.currentInput = appState.currentInput.slice(0, -1) || '0';
      if (appState.currentInput === '0') appState.isFirstInput = true;
      break;
    case '=':
    case 'Enter':
      appState.currentInput = safeEval(appState.currentInput);
      if (key === 'Enter') {
        const display = appState.activeDisplay;
        display.dataset.value = appState.currentInput;
        display.textContent = appState.currentInput;
        display.closest('.cell')?.classList.toggle('has-value', Number(appState.currentInput) !== 0);
        updateSummary();
        hideKeypad();
        return;
      }
      appState.isFirstInput = true;
      break;
    default: {
      const current = appState.currentInput;

      if (appState.isFirstInput && isNumber) {
        appState.currentInput = key === '00' ? '0' : key;
        appState.isFirstInput = false;
      } else if (isNumber) {
        if (current === '0' && key !== '0' && key !== '00') {
          appState.currentInput = key;
        } else if (current !== '0') {
          appState.currentInput += key;
        }
      } else if (isOperator) {
        const lastChar = current.slice(-1);
        appState.currentInput = /[+\-×÷.]$/.test(lastChar)
          ? current.slice(0, -1) + key : current + key;
        appState.isFirstInput = false;
      } else if (key === '.') {
        const segments = current.split(/[+\-×÷]/);
        if (!segments[segments.length - 1].includes('.')) {
          appState.currentInput += key;
          appState.isFirstInput = false;
        }
      }
    }
  }

  document.getElementById('keypadInput').value = appState.currentInput;
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
  document.body.classList.add('modal-open');
  appState.isFirstInput = true;

  // モバイル最適化: bodyのスクロールを無効化 (現在はクラスで制御)
}

function hideKeypad() {
  document.getElementById('overlay').classList.remove('show');
  document.body.classList.remove('modal-open');
  appState.activeDisplay = null;
  appState.currentInput = '';

  // モバイル最適化: bodyのスクロールを復元 (現在はクラスで制御)
}

// モバイルデバイス判定
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
}

