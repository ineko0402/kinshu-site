// app/ui/settings.js
// ==============================
// グローバル設定（ダークモードのみ）
// ==============================

export function bindSettingsEvents() {
  const btn = document.getElementById('settingsBtn');
  if (!btn) return;
  btn.addEventListener('click', openSettings);
}

export function openSettings() {
  if (document.getElementById('settings-box')) return;

  const tpl = document.getElementById('settingsTemplate');
  const overlay = tpl.content.cloneNode(true).querySelector('.modal-overlay');
  const box = overlay.querySelector('#settings-box');

  box.querySelector('#darkModeCheckbox').checked = document.body.classList.contains('dark');

  box.querySelector('#darkModeCheckbox').addEventListener('change', e => {
    const checked = e.target.checked;
    document.body.classList.toggle('dark', checked);
    localStorage.setItem('darkMode', checked);
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector('#closeSettingsBtn').addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}