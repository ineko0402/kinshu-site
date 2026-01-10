// app/ui/settingsUI.js
import { openBackupModal } from '../main.js'; // main側の命名に合わせるか、こちらに移行
// 元の settings.js の内容を整理してここに集約

/**
 * 設定モーダルを開く
 */
export function openSettings() {
    const template = document.getElementById('settingsTemplate');
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);

    const overlay = document.getElementById('settings-overlay');
    const closeBtn = document.getElementById('closeSettingsBtn');

    // バックアップボタン
    const backupBtn = document.getElementById('openBackupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            closeOverlay(overlay);
            // main.js の openBackupModal を呼び出す（または後ほどここへ移行）
            import('../main.js').then(m => m.openBackupModal());
        });
    }

    // テーマ切り替え
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.checked = document.body.classList.contains('dark');
        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // ライセンス表示
    const licenseBtn = document.getElementById('viewLicenseBtn');
    if (licenseBtn) {
        licenseBtn.addEventListener('click', () => {
            alert('金種計算機 (Kinshu)\nMIT License\n© 2024');
        });
    }

    function closeOverlay(ov) {
        ov.classList.remove('show');
        document.body.classList.remove('modal-open');
        setTimeout(() => {
            if (document.body.contains(ov)) document.body.removeChild(ov);
        }, 300);
    }

    closeBtn.addEventListener('click', () => closeOverlay(overlay));
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
    });
}

/**
 * 設定関連のイベントをバインド
 */
export function bindSettingsEvents() {
    // 起動時のテーマ適用
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }
}
