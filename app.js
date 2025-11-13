const appState = {
  currentCurrency: 'JPY',
  hide2000: false,
  hideBills: false,
  hideCoins: false,
  currentInput: '',
  activeDisplay: null,
  isFirstInput: true,
  touchStartY: 0,
  touchEndY: 0,
  startY: 0,
  currentY: 0,
  isDragging: false
};

const jpyData = [
  { id: 'jpy-10000', kind: 10000, label: '一万円札' },
  { id: 'jpy-5000', kind: 5000, label: '五千円札' },
  { id: 'jpy-2000', kind: 2000, label: '二千円札' },
  { id: 'jpy-1000', kind: 1000, label: '千円札' },
  { id: 'jpy-500', kind: 500, label: '五百円玉', isCoin: true },
  { id: 'jpy-100', kind: 100, label: '百円玉', isCoin: true },
  { id: 'jpy-50', kind: 50, label: '五十円玉', isCoin: true },
  { id: 'jpy-10', kind: 10, label: '十円玉', isCoin: true },
  { id: 'jpy-5', kind: 5, label: '五円玉', isCoin: true },
  { id: 'jpy-1', kind: 1, label: '一円玉', isCoin: true },
];

const cnyData = [
  { id: 'cny-100', kind: 100, label: '100元札' },
  { id: 'cny-50', kind: 50, label: '50元札' },
  { id: 'cny-20', kind: 20, label: '20元札' },
  { id: 'cny-10', kind: 10, label: '10元札' },
  { id: 'cny-5', kind: 5, label: '5元札' },
  { id: 'cny-1b', kind: 1, label: '1元札' },
  { id: 'cny-1c', kind: 1, label: '1元硬貨', isCoin: true },
  { id: 'cny-05', kind: 0.5, label: '5角硬貨', isCoin: true },
  { id: 'cny-01', kind: 0.1, label: '1角硬貨', isCoin: true },
];

function safeEval(expr) {
  // 演算子置換（×や÷→JavaScript演算子）
  expr = expr.replace(/×/g, '*').replace(/÷/g, '/');

  // 数字と演算子以外を除外（安全性確保）
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return '0';

  try {
    // Functionで簡易的に評価
    const f = new Function(`return (${expr})`);
    return f().toString();
  } catch {
    return '0';
  }
}

function renderCurrency() {
  const container = document.querySelector('.container');
  container.querySelector('.bills').innerHTML = '';
  container.querySelector('.coins').innerHTML = '';

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

    cell.addEventListener('click', () => showKeypad(cell));
    const target = coin ? '.coins' : '.bills';
    container.querySelector(target).appendChild(cell);
  });

  // ✅ 枚数復元
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

function showKeypad(cell) {
  if (!cell || !cell.querySelector('.display')) return;

  // 🧹 強制初期化
  appState.isDragging = false;
  appState.touchStartY = 0;
  appState.touchEndY = 0;

  appState.activeDisplay = cell.querySelector('.display');
  appState.currentInput = appState.activeDisplay.dataset.value || '0';

  const kind = parseFloat(cell.dataset.kind);
  const count = parseFloat(appState.activeDisplay.dataset.value || '0');
  const currencyUnit = appState.currentCurrency === 'JPY' ? '円' : '元';
  const total = kind * count;

  // 金種名をデータから取得（ラベルに余計な枚数が含まれない）
  const data = appState.currentCurrency === 'JPY' ? jpyData : cnyData;
  const item = data.find(d => d.kind === kind);
  const label = item ? item.label : `${kind}${currencyUnit}`;

  const displayLabel = `${label} ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}${currencyUnit}（${count}枚）`;
  document.getElementById('keypadLabel').textContent = displayLabel;

  document.getElementById('keypadInput').value = appState.currentInput;
  document.getElementById('overlay').classList.add('show');
  appState.isFirstInput = true; // ← 初回入力と判定する
}

function hideKeypad() {
  document.getElementById('overlay').classList.remove('show');
  appState.activeDisplay = null;
  appState.currentInput = '';
  appState.isDragging = false; // ← スワイプ中状態を解除
  appState.touchStartY = 0;
  appState.touchEndY = 0;
}

const overlay = document.getElementById('overlay');

overlay.addEventListener('click', (e) => {
  // クリック（またはタップ）したのが keypadPanel でないなら閉じる
  if (!panel.contains(e.target)) {
    hideKeypad();
  }
});

const DRAG_CLOSE_THRESHOLD  = 100; // 閉じる距離
const panel = document.getElementById('keypadPanel');

document.getElementById('keypadPanel').addEventListener('click', (e) => {
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
  }

  inputEl.value = appState.currentInput;
});

function updateSummary() {
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

  // ✅ 保存
  const values = {};
  document.querySelectorAll('.cell').forEach(cell => {
    const id = cell.dataset.id;
    const val = cell.querySelector('.display').dataset.value || '0';
    values[id] = val;
  });
  localStorage.setItem(`counts_${appState.currentCurrency}`, JSON.stringify(values));
}


function resetAll() {
  document.querySelectorAll('.display').forEach(d => {
    d.dataset.value = '0';
    d.textContent = '0';
  });
  updateSummary();
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark);
}

function toggleCurrency() {
  appState.currentCurrency = appState.currentCurrency === 'JPY' ? 'CNY' : 'JPY';
  localStorage.setItem('currency', appState.currentCurrency);
  renderCurrency();
}

function openSettings() {
  if (document.getElementById('settings-box')) return;

  const tpl = document.getElementById('settingsTemplate');
  const overlay = tpl.content.cloneNode(true).querySelector('.modal-overlay');
  const box = overlay.querySelector('#settings-box');
  
  // 各チェックボックスの状態を設定
  box.querySelector('#darkModeCheckbox').checked = document.body.classList.contains('dark');
  box.querySelector('#currencyToggleCheckbox').checked = appState.currentCurrency === 'CNY';
  box.querySelector('#hide2000Checkbox').checked = appState.hide2000;
  box.querySelector('#hideBillsCheckbox').checked = appState.hideBills;
  box.querySelector('#hideCoinsCheckbox').checked = appState.hideCoins;

  // イベントリスナーを追加
  box.querySelector('#darkModeCheckbox').addEventListener('change', e => {
    document.body.classList.toggle('dark', e.target.checked);
    localStorage.setItem('darkMode', e.target.checked);
  });

  box.querySelector('#currencyToggleCheckbox').addEventListener('change', e => {
    appState.currentCurrency = e.target.checked ? 'CNY' : 'JPY';
    localStorage.setItem('currency', appState.currentCurrency);
    renderCurrency();
  });

  box.querySelector('#hide2000Checkbox').addEventListener('change', e => {
    appState.hide2000 = e.target.checked;
    localStorage.setItem('hide2000', appState.hide2000);
    renderCurrency();
  });

  box.querySelector('#hideBillsCheckbox').addEventListener('change', e => {
    appState.hideBills = e.target.checked;
    localStorage.setItem('hideBills', appState.hideBills);
    renderCurrency();
  });

  box.querySelector('#hideCoinsCheckbox').addEventListener('change', e => {
    appState.hideCoins = e.target.checked;
    localStorage.setItem('hideCoins', appState.hideCoins);
    renderCurrency();
  });

  box.querySelector('#closeSettingsBtn').addEventListener('click', () => {
    box.remove();
  });

  overlay.querySelector('#closeSettingsBtn').addEventListener('click', () => {
    overlay.remove();
  });

  // オーバーレイ外をクリックで閉じる（任意）
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}
async function downloadImage() {
  const area = document.getElementById('download-area');
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const datetime = `${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const ymdhm = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
  const currencyUnit = appState.currentCurrency === 'JPY' ? '円' : '元';
  const currencyCode = appState.currentCurrency;

  const data = appState.currentCurrency === 'JPY' ? jpyData : cnyData;
  const rows = [];
  let total = 0, bills = 0, coins = 0;

  data.forEach(({ id, kind, label, isCoin }) => {
    if (appState.currentCurrency === 'JPY') {
      if (appState.hide2000 && kind === 2000) return;
      if (appState.hideBills && !isCoin && kind >= 1) return;
      if (appState.hideCoins && (isCoin || kind < 1)) return;
    }

    const cell = document.querySelector(`.cell[data-id="${id}"]`);
    if (!cell) return;

    const display = cell.querySelector('.display');
    let val = parseFloat(display.dataset.value || '0');
    if (isNaN(val)) val = 0;

    const amt = val * kind;
    const isCoinType = isCoin || kind < 1;
    if (val > 0) {
      if (isCoinType) coins += val;
      else bills += val;
      total += amt;
    }

    const formattedAmount = appState.currentCurrency === 'CNY' && kind < 1
      ? amt.toFixed(1)
      : amt.toLocaleString();

    rows.push(`
      <tr>
        <td class="denomination">${label}</td>
        <td class="count">${val}</td>
        <td class="amount">${formattedAmount} ${currencyUnit}</td>
      </tr>
    `);
  });

  area.innerHTML = `
    <div class="download-header">
      <div class="datetime"><strong>現在日時：</strong>${datetime}</div>
      <div class="total-amount"><strong>合計：</strong>${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currencyUnit}</div>
    </div>
    <table class="summary-table">
      <thead>
        <tr><th>金種</th><th>枚数</th><th>金額</th></tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
    <div class="download-footer">
      紙幣：${bills}枚　硬貨：${coins}枚（計：${bills + coins}枚）
    </div>
  `;

  area.classList.add('download-capture');

  // ✅ レンダリングを保証（2フレーム待機）
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  html2canvas(area, {
    width: 360,
    height: 640,
    backgroundColor: '#fff',
    scale: 1.5,
    useCORS: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `${ymdhm}_${currencyCode}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.85);
    link.click();
  }).catch(error => {
    console.error('スクリーンショット生成エラー:', error);
    alert('画像の生成に失敗しました。');
  }).finally(() => {
    area.classList.remove('download-capture');
    area.innerHTML = '';
  });
}


window.onload = () => {
  // 保存された設定を読み込み
  appState.hide2000 = localStorage.getItem('appState.hide2000') === 'true';
  appState.hideBills = localStorage.getItem('appState.hideBills') === 'true';
  appState.hideCoins = localStorage.getItem('appState.hideCoins') === 'true';
  appState.currentCurrency = localStorage.getItem('currency') || 'JPY';
  const isDark = localStorage.getItem('darkMode') === 'true';

  document.body.classList.toggle('dark', isDark);

  renderCurrency();
};

