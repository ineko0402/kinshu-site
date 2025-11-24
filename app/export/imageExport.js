// app/export/imageExport.js
// ==============================
// 画面キャプチャ生成とダウンロード処理
// ==============================


// import { appState } from '../core/state.js';
// import { jpyData, cnyData } from '../core/data.js';

export function bindExportEvents() {
  const btn = document.getElementById('downloadBtn');
  if (!btn) return;
  btn.addEventListener('click', downloadImage);
}

export async function downloadImage() {
  const area = document.getElementById('download-area');
  if (!area) return;

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
    if (isNaN(val) || val <= 0) return;

    const amt = val * kind;
    const isCoinType = isCoin || kind < 1;
    if (isCoinType) coins += val;
    else bills += val;
    total += amt;

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
      <thead><tr><th>金種</th><th>枚数</th><th>金額</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>
    <div class="download-footer">
      紙幣：${bills}枚　硬貨：${coins}枚（計：${bills + coins}枚）
    </div>
  `;

  area.classList.add('download-capture');

  try {
    // レンダリングを保証（2フレーム待機）
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(area, {
      width: 360,
      height: 640,
      backgroundColor: '#fff',
      scale: 1.5,
      useCORS: true
    });

    const link = document.createElement('a');
    link.download = `${ymdhm}_${currencyCode}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.85);
    link.click();

    console.log(`[EXPORT] ${link.download} を生成しました。`);
  } catch (err) {
    console.error('スクリーンショット生成エラー:', err);
    alert('画像の生成に失敗しました。');
  } finally {
    area.classList.remove('download-capture');
    area.innerHTML = '';
  }
}
