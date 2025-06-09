let currentCurrency = 'JPY';
let hide2000 = false;
let hideBills = false;
let hideCoins = false;
let currentInput = '';
let activeDisplay = null;

const jpyData = [
  { kind: 10000, label: '一万円札' },
  { kind: 5000, label: '五千円札' },
  { kind: 2000, label: '二千円札' },
  { kind: 1000, label: '千円札' },
  { kind: 500, label: '五百円玉' , isCoin: true },
  { kind: 100, label: '百円玉' , isCoin: true },
  { kind: 50, label: '五十円玉' , isCoin: true },
  { kind: 10, label: '十円玉' , isCoin: true },
  { kind: 5, label: '五円玉' , isCoin: true },
  { kind: 1, label: '一円玉' , isCoin: true },
];

const cnyData = [
  { kind: 100, label: '100元札' },
  { kind: 50, label: '50元札' },
  { kind: 20, label: '20元札' },
  { kind: 10, label: '10元札' },
  { kind: 5, label: '5元札' },
  { kind: 1, label: '1元札' },
  { kind: 1, label: '1元硬貨', isCoin: true },
  { kind: 0.5, label: '5角硬貨', isCoin: true },
  { kind: 0.1, label: '1角硬貨', isCoin: true }
];

function renderCurrency() {
  const container = document.querySelector('.container');
  container.querySelector('.bills').innerHTML = '';
  container.querySelector('.coins').innerHTML = '';

  const data = currentCurrency === 'JPY' ? jpyData : cnyData;

  // CNY用レイアウト切替
  document.body.classList.toggle('layout-cny', currentCurrency === 'CNY');

  data.forEach(({ kind, label, isCoin }) => {
  const coin = !!isCoin || kind < 1;
  const bill = !coin;
  const is2000 = kind === 2000;

  let disabled = false;
  if (currentCurrency === 'JPY') {
    if (is2000 && hide2000) disabled = true;
    if (bill && hideBills) disabled = true;
    if (coin && hideCoins) disabled = true;
  }

  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.kind = kind;
  cell.dataset.label = label;
  cell.dataset.key = `${kind}_${label}`; // ← 一意識別キー

  cell.innerHTML = `${label}<div class="display" data-value="0">0</div>`;

  if (disabled) {
    cell.classList.add('disabled');
    cell.style.opacity = '0.4';
    cell.style.pointerEvents = 'none';
    const disp = cell.querySelector('.display');
    disp.dataset.value = '0';
    disp.textContent = '0';
  }

  cell.addEventListener('click', () => showKeypad(cell));
  const target = coin ? '.coins' : '.bills';
  container.querySelector(target).appendChild(cell);
});

  updateSummary();
}

function showKeypad(cell) {
  activeDisplay = cell.querySelector('.display');
  currentInput = activeDisplay.dataset.value || '0';

  const kind = parseFloat(cell.dataset.kind);
  const count = parseFloat(activeDisplay.dataset.value || '0');
  const currencyUnit = currentCurrency === 'JPY' ? '円' : '元';
  const total = kind * count;

  // 金種名をデータから取得（ラベルに余計な枚数が含まれない）
  const data = currentCurrency === 'JPY' ? jpyData : cnyData;
  const item = data.find(d => d.kind === kind);
  const label = item ? item.label : `${kind}${currencyUnit}`;

  const displayLabel = `${label} ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}${currencyUnit}（${count}枚）`;
  document.getElementById('keypadLabel').textContent = displayLabel;

  document.getElementById('keypadInput').value = currentInput;
  document.getElementById('overlay').classList.add('show');
}



function hideKeypad() {
  document.getElementById('overlay').classList.remove('show');
  activeDisplay = null;
}

document.querySelectorAll('#keypadPanel button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!activeDisplay) return;
    const key = btn.textContent;
    const inputEl = document.getElementById('keypadInput');

    if (key === 'AC') {
      currentInput = '0';
    } else if (key === '⇐') {
      currentInput = currentInput.slice(0, -1) || '0';
    } else if (key === '=') {
      try {
        currentInput = eval(currentInput.replace(/×/g, '*').replace(/÷/g, '/')).toString();
      } catch { currentInput = '0'; }
    } else if (key === 'Enter') {
      try {
        currentInput = eval(currentInput.replace(/×/g, '*').replace(/÷/g, '/')).toString();
      } catch { currentInput = '0'; }
      activeDisplay.dataset.value = currentInput;
      activeDisplay.textContent = currentInput;
      updateSummary();
      hideKeypad();
      return;
    } else {
      if (currentInput === '0') currentInput = '';
      currentInput += key;
    }

    inputEl.value = currentInput;
  });
});

function updateSummary() {
  const displays = document.querySelectorAll('.display');
  let total = 0, bills = 0, coins = 0;
  const data = currentCurrency === 'JPY' ? jpyData : cnyData;

  displays.forEach(d => {
    const val = parseFloat(d.dataset.value || '0');
    const cell = d.closest('.cell');
    const kind = parseFloat(cell.dataset.kind);
    if (isNaN(val)) return;

    const item = data.find(entry => entry.kind === kind && cell.textContent.includes(entry.label));
    const isCoin = item?.isCoin || kind < 1;

    if (isCoin) coins += val;
    else bills += val;

    total += kind * val;
  });

  const unit = currentCurrency === 'JPY' ? '円' : '元';
  document.getElementById('total').textContent = `${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
  document.getElementById('billCount').textContent = bills;
  document.getElementById('coinCount').textContent = coins;
  document.getElementById('totalCount').textContent = bills + coins;
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
  currentCurrency = currentCurrency === 'JPY' ? 'CNY' : 'JPY';
  localStorage.setItem('currency', currentCurrency);
  renderCurrency();
}

function openSettings() {
  const html = `
    <h3>⚙️ 設定</h3>
    <label>
      <input type="checkbox" ${document.body.classList.contains('dark') ? 'checked' : ''} 
        onchange="toggleDarkMode(); localStorage.setItem('darkMode', document.body.classList.contains('dark'));">
      ダークモード
    </label><br>

    <label>
      <input type="checkbox" ${currentCurrency === 'CNY' ? 'checked' : ''} 
        onchange="toggleCurrency(); localStorage.setItem('currency', currentCurrency);">
      通貨をCNYに切り替える
    </label><br><hr>

    <strong>使用金種の制限（JPYのみ）</strong><br>

    <label>
      <input type="checkbox" ${hide2000 ? 'checked' : ''} 
        onchange="hide2000 = this.checked; localStorage.setItem('hide2000', hide2000); renderCurrency();">
      2千円を使わない
    </label><br>

    <label>
      <input type="checkbox" ${hideBills ? 'checked' : ''} 
        onchange="hideBills = this.checked; localStorage.setItem('hideBills', hideBills); renderCurrency();">
      お札を使わない
    </label><br>

    <label>
      <input type="checkbox" ${hideCoins ? 'checked' : ''} 
        onchange="hideCoins = this.checked; localStorage.setItem('hideCoins', hideCoins); renderCurrency();">
      小銭を使わない
    </label><br>
  `;

  const box = document.createElement('div');
  box.style.position = 'fixed';
  box.style.top = '20px';
  box.style.left = '20px';
  box.style.right = '20px';
  box.style.margin = 'auto';
  box.style.maxWidth = '300px';
  box.style.background = '#fff';
  box.style.color = '#000';
  box.style.padding = '20px';
  box.style.borderRadius = '12px';
  box.style.zIndex = 9999;
  box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  box.innerHTML = html + '<br><button onclick="this.parentElement.remove()">閉じる</button>';

  document.body.appendChild(box);
}

function downloadImage() {
  const area = document.getElementById('download-area');
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const datetime = `${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const currencyUnit = currentCurrency === 'JPY' ? '円' : '元';

  // データ集計
  const rows = [];
  let total = 0, bills = 0, coins = 0;
  const data = currentCurrency === 'JPY' ? jpyData : cnyData;
  const map = new Map();

  data.forEach(({ kind, label, isCoin }) => {
  const key = `${kind}_${label}`;
  const cell = document.querySelector(`.cell[data-key="${key}"]`);
  if (!cell) return;

  const display = cell.querySelector('.display');
  const val = parseFloat(display.dataset.value || '0');
  if (isNaN(val)) return;

  const amt = val * kind;

  if (!map.has(key)) {
    map.set(key, { label, kind, val: 0, amt: 0, isCoin });
  }
  const entry = map.get(key);
  entry.val += val;
  entry.amt += amt;

  if (entry.isCoin || kind < 1 || label.includes('硬貨')) coins += val;
  else bills += val;

  total += amt;
});

  map.forEach(entry => {
    rows.push(`<tr><td>${entry.label}</td><td>${entry.val}</td><td>${entry.amt.toLocaleString()} ${currencyUnit}</td></tr>`);
  });

  // HTML構築
  area.innerHTML = `
    <div><strong>現在日時：</strong>${datetime}</div>
    <div><strong>合計：</strong>${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currencyUnit}</div>
    <table>
      <tr><th>金種</th><th>枚数</th><th>金額</th></tr>
      ${rows.join('')}
    </table>
    <div>紙幣：${bills}枚　硬貨：${coins}枚（合計：${bills + coins}枚）</div>
  `;

  // 📏 軽量化用に一時的に縦長＆縮小サイズに設定
  area.style.display = 'block';
  area.style.width = '360px';
  area.style.height = '640px';
  area.style.padding = '20px';
  area.style.boxSizing = 'border-box';

  // 📷 JPEGで出力（85%品質）
  html2canvas(area, {
    width: 360,
    height: 640,
    backgroundColor: '#fff'
  }).then(canvas => {
    const link = document.createElement('a');
  
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const ymdhm = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
    const currencyCode = currentCurrency;
  
    link.download = `kinshu-site_${ymdhm}_${currencyCode}.jpeg`;
    link.href = canvas.toDataURL("image/jpeg", 0.85);
    link.click();
  
    area.style.display = 'none';
    area.style.width = '';
    area.style.height = '';
    area.style.padding = '';
  });
}

window.onload = () => {
  // 保存された設定を読み込み
  hide2000 = localStorage.getItem('hide2000') === 'true';
  hideBills = localStorage.getItem('hideBills') === 'true';
  hideCoins = localStorage.getItem('hideCoins') === 'true';
  currentCurrency = localStorage.getItem('currency') || 'JPY';
  const isDark = localStorage.getItem('darkMode') === 'true';

  document.body.classList.toggle('dark', isDark);
  renderCurrency();
};

