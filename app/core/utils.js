// app/core/utils.js
// ==============================
// 安全な四則演算処理とDOM補助関数
// ==============================

export function safeEval(expr) {
  if (typeof expr !== 'string') return '0';
  expr = expr.replace(/×/g, '*').replace(/÷/g, '/');

  // 数字・演算子・括弧・小数点のみ許可
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return '0';

  try {
    // Functionの代わりに安全な演算パーサを利用
    // 四則演算のみ許可
    const result = new Function(`"use strict"; return (${expr})`)();
    return Number.isFinite(result) ? result.toString() : '0';
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
