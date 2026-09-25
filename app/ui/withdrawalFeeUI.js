import { appState } from '../core/state.js';
import { jpyData } from '../core/data.js';
import { estimateUnspecifiedCount, getHandlingCount } from '../core/withdrawalFee.js?v=20260925.5';

const SOURCES = {
  difference: 'https://www.fukuokabank.co.jp/price/commissions/ryougae/',
  excludeTenThousand: 'https://www.resonabank.co.jp/kojin/kinri_kawase/tesuryo/',
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
  const source = overlay.querySelector('#withdrawalFeeSource');
  const explanation = overlay.querySelector('#withdrawalFeeExplanation');
  const trigger = document.getElementById('countCalculatorBtn');

  overlay.querySelector('#withdrawalSpecifiedCount').textContent = `${values.count.toLocaleString()}枚`;
  overlay.querySelector('#withdrawalTenThousandCount').textContent = `${values.tenThousand.toLocaleString()}枚`;
  baseline.value = estimateUnspecifiedCount(values.amount);
  method.value = localStorage.getItem('withdrawal_count_method') === 'excludeTenThousand'
    ? 'excludeTenThousand' : 'difference';

  const update = () => {
    const isDifference = method.value === 'difference';
    overlay.querySelector('#withdrawalBaselineRow').hidden = !isDifference;
    overlay.querySelector('#withdrawalTenThousandRow').hidden = isDifference;
    const enteredBaseline = baseline.value.trim() === '' ? NaN : Number(baseline.value);
    const handling = getHandlingCount(method.value, values.count, values.tenThousand, enteredBaseline);
    result.textContent = handling === null ? '枚数を確認' : `${handling.toLocaleString()}枚`;
    source.href = SOURCES[method.value];
    explanation.textContent = isDifference
      ? 'A − B。Bは窓口の実際の払出金種で変わります。'
      : 'A − 一万円札の枚数。新券指定には対応していません。';
  };
  method.addEventListener('change', () => {
    localStorage.setItem('withdrawal_count_method', method.value);
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
