// ui/effects.js

/**
 * 入力欄に一時的なハイライトを付ける
 * DOM に副作用を与える UI 専用関数
 */
export function applyHighlight(targetEl) {
  if (!targetEl) return;

  targetEl.classList.add('input-flash');

  // 200ms 後に自動的にハイライトを解除
  setTimeout(() => {
    targetEl.classList.remove('input-flash');
  }, 200);
}
