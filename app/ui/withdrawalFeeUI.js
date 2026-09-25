import { appState } from '../core/state.js';
import { jpyData } from '../core/data.js';
import { estimateUnspecifiedCount, getHandlingCount, estimateFee } from '../core/withdrawalFee.js';

const SOURCES = {
  shinwa: 'https://www.18shinwabank.co.jp/price/commissions/ryougae/',
  ryoshin: 'https://www.ryo-sin.co.jp/rate/fee.html#exchange',
};

function getSpecifiedCounts() {
  let amount = 0;
  let count = 0;
  let tenThousand = 0;
  for (const item of jpyData) {
    const cell = document.querySelector(`.cell[data-id="${item.id}"]`);
    const quantity = Number(cell?.querySelector('.display')?.dataset.value ?? 0);
    if (!Number.isSafeInteger(quantity) || quantity < 0) return null;
    amount += item.kind * quantity;
    count += quantity;
    if (item.kind === 10000) tenThousand = quantity;
  }
  if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(count)) return null;
  return { amount, count, tenThousand };
}

export function openWithdrawalFeeModal() {
  if (appState.currentCurrency !== 'JPY') return;
  const values = getSpecifiedCounts();
  if (!values) {
    alert('枚数または金額が正しくありません。金種の入力値を確認してください。');
    return;
  }

  const overlay = document.getElementById('withdrawalFeeTemplate').content.firstElementChild.cloneNode(true);
  const method = overlay.querySelector('#withdrawalFeeMethod');
  const baseline = overlay.querySelector('#withdrawalBaselineCount');
  const result = overlay.querySelector('#withdrawalHandlingCount');
  const fee = overlay.querySelector('#withdrawalFeeAmount');
  const source = overlay.querySelector('#withdrawalFeeSource');
  const explanation = overlay.querySelector('#withdrawalFeeExplanation');
  const trigger = document.getElementById('countCalculatorBtn');

  overlay.querySelector('#withdrawalSpecifiedCount').textContent = `${values.count.toLocaleString()}枚`;
  overlay.querySelector('#withdrawalTenThousandCount').textContent = `${values.tenThousand.toLocaleString()}枚`;
  baseline.value = estimateUnspecifiedCount(values.amount);
  method.value = localStorage.getItem('withdrawal_fee_method') === 'ryoshin' ? 'ryoshin' : 'shinwa';

  const update = () => {
    const isShinwa = method.value === 'shinwa';
    overlay.querySelector('#withdrawalBaselineRow').hidden = !isShinwa;
    overlay.querySelector('#withdrawalTenThousandRow').hidden = isShinwa;
    const enteredBaseline = baseline.value.trim() === '' ? NaN : Number(baseline.value);
    const handling = getHandlingCount(method.value, values.count, values.tenThousand, enteredBaseline);
    result.textContent = handling === null ? '枚数を確認' : `${handling.toLocaleString()}枚`;
    const estimatedFee = handling === null ? null : estimateFee(method.value, handling);
    fee.textContent = estimatedFee === null ? '—' : `${estimatedFee.toLocaleString()}円`;
    source.href = SOURCES[method.value];
    source.textContent = isShinwa ? '手数料表：十八親和銀行' : '手数料表：長崎三菱信用組合';
    explanation.textContent = isShinwa
      ? 'A − B。Bは窓口の実際の払出金種で変わります。手数料は現在の公表額による目安です。'
      : 'A − 一万円札の枚数。手数料は現在の公表額による目安です。';
  };
  method.addEventListener('change', () => {
    localStorage.setItem('withdrawal_fee_method', method.value);
    update();
  });
  baseline.addEventListener('input', update);
  update();

  const close = () => {
    if (overlay.classList.contains('closing')) return;
    document.removeEventListener('keydown', onKeydown);
    overlay.classList.remove('show');
    overlay.classList.add('closing');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      overlay.remove();
      trigger?.focus();
    }, 260);
  };
  const onKeydown = (event) => {
    if (event.key === 'Escape') close();
  };
  overlay.querySelector('#closeWithdrawalFeeBtn').addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', onKeydown);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
    method.focus();
  });
}
