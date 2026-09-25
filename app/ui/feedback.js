import { bindBackdropDismiss } from './backdropDismiss.js';

export function confirmAction(title, message, actionLabel) {
  return new Promise((resolve) => {
    const previousFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay action-overlay';
    overlay.innerHTML = `
      <div class="settings-box" role="alertdialog" aria-modal="true" aria-labelledby="actionTitle" aria-describedby="actionMessage">
        <h3 id="actionTitle"></h3>
        <p id="actionMessage"></p>
        <div class="modal-buttons">
          <button type="button" class="modal-button modal-button-default action-cancel">キャンセル</button>
          <button type="button" class="modal-button modal-button-success action-confirm"></button>
        </div>
      </div>`;
    overlay.querySelector('#actionTitle').textContent = title;
    overlay.querySelector('#actionMessage').textContent = message;
    const cancel = overlay.querySelector('.action-cancel');
    const confirm = overlay.querySelector('.action-confirm');
    confirm.textContent = actionLabel;

    let finished = false;
    const finish = (accepted) => {
      if (finished) return;
      finished = true;
      document.removeEventListener('keydown', onKeydown, true);
      overlay.remove();
      if (!document.querySelector('.modal-overlay.show')) {
        document.body.classList.remove('modal-open');
      }
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      resolve(accepted);
    };
    const onKeydown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      finish(false);
    };
    cancel.addEventListener('click', () => finish(false));
    confirm.addEventListener('click', () => finish(true));
    bindBackdropDismiss(overlay, () => finish(false));
    document.addEventListener('keydown', onKeydown, true);
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      overlay.classList.add('show');
      cancel.focus();
    });
  });
}

let messageTimer;
export function showFeedback(message) {
  let notice = document.getElementById('app-feedback');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'app-feedback';
    notice.setAttribute('role', 'status');
    document.body.appendChild(notice);
  }
  clearTimeout(messageTimer);
  notice.textContent = message;
  notice.classList.add('visible');
  messageTimer = setTimeout(() => notice.classList.remove('visible'), 3000);
}
