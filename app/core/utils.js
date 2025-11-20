// app/core/utils.js
// ==============================
// 安全な四則演算処理とDOM補助関数
// ==============================

export function safeEval(expr) {
  if (typeof expr !== 'string') return '0';

  // ×÷ を標準演算子へ
  expr = expr.replace(/×/g, '*').replace(/÷/g, '/');

  // 許可文字は数字 + +-*/ のみ
  if (!/^[0-9+\-*/\s]+$/.test(expr)) return '0';

  try {
    const result = new Function(`"use strict"; return (${expr})`)();
    if (!Number.isFinite(result)) return '0';
    return String(result);
  } catch {
    return '0';
  }
}


export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

export function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

/**
 * 式の中にあるすべての数字ブロックから先頭ゼロを取り除く
 * 純粋関数
 */
export function normalizeLeadingZeros(expr) {
  if (typeof expr !== 'string') return expr;

  return expr.replace(/\d+/g, (num) => {
    if (num === '0') return '0';
    return String(Number(num));
  });
}

/**
 * 今回の入力キーで数字ブロックが区切られるかを判定する
 * 純粋関数
 */
export function shouldNormalize(prevKey, currentKey) {
  const prevIsNum = /\d/.test(prevKey);
  const nowIsNum = /\d/.test(currentKey);

  // 「直前が数字」かつ「今回が数字以外」の場合に整形を行う
  return prevIsNum && !nowIsNum;
}
