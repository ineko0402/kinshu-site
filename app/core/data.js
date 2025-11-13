// app/core/data.js
// ==============================
// 通貨データ定義
// ==============================

export const jpyData = [
  { id: 'jpy-10000', kind: 10000, label: '一万円札' },
  { id: 'jpy-5000', kind: 5000, label: '五千円札' },
  { id: 'jpy-2000', kind: 2000, label: '二千円札' },
  { id: 'jpy-1000', kind: 1000, label: '千円札' },
  { id: 'jpy-500', kind: 500, label: '五百円玉', isCoin: true },
  { id: 'jpy-100', kind: 100, label: '百円玉', isCoin: true },
  { id: 'jpy-50', kind: 50, label: '五十円玉', isCoin: true },
  { id: 'jpy-10', kind: 10, label: '十円玉', isCoin: true },
  { id: 'jpy-5', kind: 5, label: '五円玉', isCoin: true },
  { id: 'jpy-1', kind: 1, label: '一円玉', isCoin: true }
];

export const cnyData = [
  { id: 'cny-100', kind: 100, label: '100元札' },
  { id: 'cny-50', kind: 50, label: '50元札' },
  { id: 'cny-20', kind: 20, label: '20元札' },
  { id: 'cny-10', kind: 10, label: '10元札' },
  { id: 'cny-5', kind: 5, label: '5元札' },
  { id: 'cny-1b', kind: 1, label: '1元札' },
  { id: 'cny-1c', kind: 1, label: '1元硬貨', isCoin: true },
  { id: 'cny-05', kind: 0.5, label: '5角硬貨', isCoin: true },
  { id: 'cny-01', kind: 0.1, label: '1角硬貨', isCoin: true }
];
