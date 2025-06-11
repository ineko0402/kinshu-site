let currentCurrency = 'JPY';
let hide2000 = false;
let hideBills = false;
let hideCoins = false;
let currentInput = '';
let activeDisplay = null;

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

function renderCurrency() {
  const container = document.querySelector('.container');
  container.querySelector('.bills').innerHTML = '';
  container.querySelector('.coins').innerHTML = '';

  const data = currentCurrency === 'JPY' ? jpyData : cnyData;
  document.body.classList.toggle('layout-cny', currentCurrency === 'CNY');

  data.forEach(({ id, kind, label, isCoin }) => {
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
  const saved = JSON.parse(localStorage.getItem(`counts_${currentCurrency}`) || '{}');
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
  const data = currentCurrency === 'JPY' ? jpyData : cnyData;
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

  const unit = currentCurrency === 'JPY' ? '円' : '元';
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
  localStorage.setItem(`counts_${currentCurrency}`, JSON.stringify(values));
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
  // ✅ 設定画面が既に存在する場合は何もしない
  if (document.getElementById('settings-box')) return;

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

  // ✅ 設定ウィンドウ本体を作成
  const box = document.createElement('div');
  box.id = 'settings-box';  // ← 識別用IDで複数生成を防ぐ
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

  // ✅ 内容と閉じるボタンを設定
  box.innerHTML = html + '<br><button onclick="document.getElementById(\'settings-box\').remove()">閉じる</button>';

  // ✅ 追加
  document.body.appendChild(box);
}

function downloadImage() {
  const area = document.getElementById('download-area');
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const datetime = `${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const ymdhm = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
  const currencyUnit = currentCurrency === 'JPY' ? '円' : '元';
  const currencyCode = currentCurrency;

  const data = currentCurrency === 'JPY' ? jpyData : cnyData;
  const rows = [];
  let total = 0, bills = 0, coins = 0;

  // 金種ごとに集計（枚数0でも表示、hide設定のみ除外）
  data.forEach(({ id, kind, label, isCoin }) => {
    // hide設定による除外判定を最初に実行
    if (currentCurrency === 'JPY') {
      if (hide2000 && kind === 2000) return;
      if (hideBills && !isCoin && kind >= 1) return;
      if (hideCoins && (isCoin || kind < 1)) return;
    }

    const cell = document.querySelector(`.cell[data-id="${id}"]`);
    if (!cell) return;

    const display = cell.querySelector('.display');
    let val = parseFloat(display.dataset.value || '0');
    
    // NaN処理を改善（0に置換）
    if (isNaN(val)) val = 0;

    const amt = val * kind;
    
    // 紙幣・硬貨の分類を統一（枚数が0より大きい場合のみカウント）
    const isCoinType = isCoin || kind < 1;
    if (val > 0) {
      if (isCoinType) {
        coins += val;
      } else {
        bills += val;
      }
      total += amt;
    }

    // 小数点を含む金額の適切な表示
    const formattedAmount = currentCurrency === 'CNY' && kind < 1 
      ? amt.toFixed(1) // 0.5元、0.1元など小数を正確に表示
      : amt.toLocaleString();

    // 枚数が0でも行を追加
    rows.push(`
      <tr>
        <td class="denomination">${label}</td>
        <td class="count">${val}</td>
        <td class="amount">${formattedAmount} ${currencyUnit}</td>
      </tr>
    `);
  });

  // テーブルの構築（枚数0の行も含めて表示）
  const tableContent = rows.join('');

  // ダウンロードエリア構築（HTMLの構造を改善）
  area.innerHTML = `
    <div class="download-header">
      <div class="datetime"><strong>現在日時：</strong>${datetime}</div>
      <div class="total-amount"><strong>合計：</strong>${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currencyUnit}</div>
    </div>
    
    <table class="summary-table">
      <thead>
        <tr>
          <th class="denomination-header">金種</th>
          <th class="count-header">枚数</th>
          <th class="amount-header">金額</th>
        </tr>
      </thead>
      <tbody>
        ${tableContent}
      </tbody>
    </table>
    
    <div class="download-footer">
      紙幣：${bills}枚　硬貨：${coins}枚（合計：${bills + coins}枚）
    </div>
  `;

  // スタイル適用（一時的な設定）
  area.style.display = 'block';
  area.style.width = '360px';
  area.style.height = '640px';
  area.style.padding = '20px';
  area.style.boxSizing = 'border-box';

  // スクリーンショット出力
  html2canvas(area, {
    width: 360,
    height: 640,
    backgroundColor: '#fff',
    scale: 2, // 高解像度化
    useCORS: true // 外部リソース対応
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `kinshu-site_${ymdhm}_${currencyCode}.jpeg`;
    link.href = canvas.toDataURL("image/jpeg", 0.85);
    link.click();

    // 後処理：非表示とスタイルリセット
    area.style.display = 'none';
    area.style.width = '';
    area.style.height = '';
    area.style.padding = '';
  }).catch(error => {
    console.error('スクリーンショット生成エラー:', error);
    alert('画像の生成に失敗しました。');
    
    // エラー時も後処理を実行
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

