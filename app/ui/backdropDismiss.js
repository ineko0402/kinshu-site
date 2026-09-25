// 押し始めと離した場所がどちらも背景だった場合だけ閉じる。
// 入力欄から背景へドラッグした際の click は閉じる操作とみなさない。
export function bindBackdropDismiss(overlay, dismiss) {
  let pointerId = null;
  let pressedOnBackdrop = false;
  let releasedOnBackdrop = false;

  overlay.addEventListener('pointerdown', (event) => {
    pointerId = event.pointerId;
    pressedOnBackdrop = event.target === overlay;
    releasedOnBackdrop = false;
  });

  overlay.addEventListener('pointerup', (event) => {
    if (event.pointerId === pointerId) {
      releasedOnBackdrop = pressedOnBackdrop && event.target === overlay;
    }
  });

  overlay.addEventListener('pointercancel', (event) => {
    if (event.pointerId === pointerId) {
      pressedOnBackdrop = false;
      releasedOnBackdrop = false;
    }
  });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay && (releasedOnBackdrop || event.detail === 0)) {
      dismiss();
    }
    pointerId = null;
    pressedOnBackdrop = false;
    releasedOnBackdrop = false;
  });
}
