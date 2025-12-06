// app/ui/gestures.js
// ==============================
// スワイプジェスチャー機能
// ==============================

/**
 * スワイプジェスチャーを検出するクラス
 */
class SwipeDetector {
    constructor(element, options = {}) {
        this.element = element;
        this.threshold = options.threshold || 50; // スワイプと判定する最小距離
        this.restraint = options.restraint || 100; // 垂直方向の最大許容距離
        this.allowedTime = options.allowedTime || 300; // スワイプと判定する最大時間(ms)

        this.startX = 0;
        this.startY = 0;
        this.startTime = 0;
        this.distX = 0;
        this.distY = 0;

        this.onSwipeLeft = options.onSwipeLeft || null;
        this.onSwipeRight = options.onSwipeRight || null;
        this.onSwipeUp = options.onSwipeUp || null;
        this.onSwipeDown = options.onSwipeDown || null;

        this.init();
    }

    init() {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    handleTouchStart(e) {
        const touch = e.changedTouches[0];
        this.startX = touch.pageX;
        this.startY = touch.pageY;
        this.startTime = new Date().getTime();
        this.distX = 0;
        this.distY = 0;
    }

    handleTouchMove(e) {
        // スワイプ中のスクロールを防止する場合
        if (this.onSwipeUp || this.onSwipeDown) {
            const touch = e.changedTouches[0];
            this.distY = touch.pageY - this.startY;

            // 垂直スワイプの場合はスクロールを防止
            if (Math.abs(this.distY) > 10) {
                e.preventDefault();
            }
        }
    }

    handleTouchEnd(e) {
        const touch = e.changedTouches[0];
        this.distX = touch.pageX - this.startX;
        this.distY = touch.pageY - this.startY;
        const elapsedTime = new Date().getTime() - this.startTime;

        // スワイプ判定
        if (elapsedTime <= this.allowedTime) {
            // 水平スワイプ
            if (Math.abs(this.distX) >= this.threshold && Math.abs(this.distY) <= this.restraint) {
                if (this.distX < 0 && this.onSwipeLeft) {
                    this.onSwipeLeft(e);
                } else if (this.distX > 0 && this.onSwipeRight) {
                    this.onSwipeRight(e);
                }
            }
            // 垂直スワイプ
            else if (Math.abs(this.distY) >= this.threshold && Math.abs(this.distX) <= this.restraint) {
                if (this.distY < 0 && this.onSwipeUp) {
                    this.onSwipeUp(e);
                } else if (this.distY > 0 && this.onSwipeDown) {
                    this.onSwipeDown(e);
                }
            }
        }
    }

    destroy() {
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
    }
}

/**
 * 履歴アイテムにスワイプ削除機能を追加
 */
export function enableHistorySwipe(historyListElement, onDelete) {
    const items = historyListElement.querySelectorAll('.history-item');

    items.forEach(item => {
        new SwipeDetector(item, {
            threshold: 100,
            onSwipeLeft: (e) => {
                // 左スワイプで削除ボタンを表示
                item.style.transform = 'translateX(-80px)';
                item.style.transition = 'transform 0.3s ease';

                // 他のアイテムをリセット
                items.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.style.transform = 'translateX(0)';
                    }
                });
            },
            onSwipeRight: (e) => {
                // 右スワイプで元に戻す
                item.style.transform = 'translateX(0)';
                item.style.transition = 'transform 0.3s ease';
            }
        });
    });
}

/**
 * モーダルにスワイプダウンで閉じる機能を追加
 */
export function enableModalSwipeClose(modalElement, onClose) {
    const modalBox = modalElement.querySelector('.settings-box, #keypadPanel');
    if (!modalBox) return;

    let initialY = 0;
    let currentY = 0;

    new SwipeDetector(modalBox, {
        threshold: 80,
        restraint: 50,
        onSwipeDown: (e) => {
            // 下スワイプでモーダルを閉じる
            modalBox.style.transform = 'translateY(100%)';
            modalBox.style.transition = 'transform 0.3s ease';

            setTimeout(() => {
                if (onClose) onClose();
            }, 300);
        }
    });
}

export { SwipeDetector };
