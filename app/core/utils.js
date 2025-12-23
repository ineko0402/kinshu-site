// app/core/utils.js
// ==============================
// 安全な四則演算処理とDOM補助関数
// ==============================

export function safeEval(expr) {
  if (typeof expr !== 'string' || !expr.trim()) return '0';

  // 表示用演算子を評価用演算子に変換
  let cleanedExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');

  // 末尾が演算子（+ - * / .）で終わっている場合、評価可能な部分まで切り詰める
  cleanedExpr = cleanedExpr.replace(/[+\-*/.]+$/, '');

  // 数字・演算子・括弧・小数点のみ許可（念のためパース後もチェック）
  if (!/^[0-9+\-*/().\s]+$/.test(cleanedExpr)) return '0';

  try {
    // 四則演算のみ実行（安全のため Strict Mode で実行）
    const result = new Function(`"use strict"; return (${cleanedExpr})`)();
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

