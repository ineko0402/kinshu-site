// app/ui/noteUI.js
import { appState, switchNote, createNewNote, updateNoteName, updateNoteColor, updateNoteSettings, deleteNote } from '../core/state.js';
import { renderCurrency, updateSummary } from './renderer.js';

/**
 * ノートの色をCSS変数に適用する
 */
export function applyNoteColor(color) {
    const root = document.documentElement;
    const isDark = document.body.classList.contains('dark');

    if (!color || color === 'default') {
        root.style.setProperty('--accent-glow-primary', 'transparent');
        root.style.setProperty('--accent-glow-secondary', 'transparent');
        root.style.setProperty('--accent-glow-text', 'transparent');
        root.style.setProperty('--accent-color-raw', isDark ? '255, 255, 255' : '52, 58, 64');
        return;
    }

    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const rgb = `${r}, ${g}, ${b}`;

    const alpha1 = isDark ? 0.7 : 0.5;
    const alpha2 = isDark ? 0.5 : 0.35;
    const alphaText = isDark ? 1.0 : 0.8;

    root.style.setProperty('--accent-color-raw', rgb);
    root.style.setProperty('--accent-glow-primary', `rgba(${rgb}, ${alpha1})`);
    root.style.setProperty('--accent-glow-secondary', `rgba(${rgb}, ${alpha2})`);
    root.style.setProperty('--accent-glow-text', `rgba(${rgb}, ${alphaText})`);
}

/**
 * ノート表示（ヘッダー等のノート名）を更新
 */
export function updateNoteDisplay() {
    const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
    const noteNameEl = document.getElementById('currentNoteName');
    if (noteNameEl && currentNote) {
        noteNameEl.textContent = `${currentNote.name} (${currentNote.currency})`;
    }
}

/**
 * PCサイドバー用のノート一覧描画
 */
export function renderSidebarNoteList() {
    const container = document.getElementById('pc-sidebar-note-list');
    if (!container) return;

    container.innerHTML = '';
    appState.notes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.dataset.id = note.id;
        if (note.id === appState.currentNoteId) {
            div.classList.add('active');
            div.style.borderLeft = '4px solid var(--accent)';
        } else {
            div.style.borderLeft = '4px solid transparent';
        }

        div.innerHTML = `
      <div class="note-name ${note.id === appState.currentNoteId ? 'active' : ''}" style="flex: 1; padding: 5px;">
        ${note.name} <br>
        <small style="color: var(--text-secondary)">${note.currency}</small>
      </div>
      <div class="note-actions">
        <button class="edit-note-btn" style="padding: 2px 6px; font-size: 10px;">編集</button>
      </div>
    `;

        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-note-btn')) {
                openNoteEditModal(note.id, () => {
                    renderSidebarNoteList();
                    updateNoteDisplay();
                });
                return;
            }

            if (note.id !== appState.currentNoteId) {
                handleNoteSwitch(note.id);
            }
        });

        container.appendChild(div);
    });
}

/**
 * ノートの切り替え共通処理
 */
export function handleNoteSwitch(noteId) {
    const success = switchNote(noteId);
    if (success) {
        const note = appState.notes.find(n => n.id === noteId);
        applyNoteColor(note.color);
        renderCurrency();
        updateSummary();
        updateNoteDisplay();
        renderSidebarNoteList();
        // 履歴サイドバーがある場合はそれも更新（循環参照を避けるため dispatchEvent 等を検討するか、main側で行う）
        document.dispatchEvent(new CustomEvent('noteSwitched', { detail: { noteId } }));
    }
}

/**
 * モーダル共通のクローズ処理
 */
function closeOverlay(overlay) {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
    }, 300);
}

/**
 * ノート編集モーダルを開く
 */
export function openNoteEditModal(noteId, onUpdate = null) {
    const note = appState.notes.find(n => n.id === noteId);
    if (!note) return;

    const template = document.getElementById('noteEditTemplate');
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);

    const overlay = document.getElementById('note-edit-overlay');
    const closeBtn = document.getElementById('closeNoteEditBtn');
    const saveBtn = document.getElementById('saveNoteEditBtn');
    const noteNameInput = document.getElementById('noteNameInput');
    const currencyDisplay = document.getElementById('currencyDisplay');
    const messageBar = document.getElementById('noteEditMessage');

    requestAnimationFrame(() => {
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
    });

    noteNameInput.value = note.name;
    currencyDisplay.textContent = note.currency;

    const colorInput = overlay.querySelector('#editNoteColorInput');
    colorInput.value = note.color || 'default';
    const colorBtns = overlay.querySelectorAll('.color-preset-btn');

    colorBtns.forEach(btn => {
        if (btn.dataset.color === colorInput.value) btn.classList.add('active');
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            colorInput.value = btn.dataset.color;
        });
    });

    if (note.currency === 'JPY') {
        overlay.querySelector('.note-settings-section').classList.add('visible');
        const settings = note.settings || {};
        overlay.querySelector('#noteHide2000').checked = settings.hide2000 || false;
        overlay.querySelector('#noteHideBills').checked = settings.hideBills || false;
        overlay.querySelector('#noteHideCoins').checked = settings.hideCoins || false;
    }

    saveBtn.addEventListener('click', () => {
        const newName = noteNameInput.value.trim();
        if (!newName) return;

        updateNoteName(noteId, newName);
        updateNoteColor(noteId, colorInput.value);

        if (note.currency === 'JPY') {
            updateNoteSettings(noteId, {
                hide2000: overlay.querySelector('#noteHide2000').checked,
                hideBills: overlay.querySelector('#noteHideBills').checked,
                hideCoins: overlay.querySelector('#noteHideCoins').checked
            });
        }

        if (noteId === appState.currentNoteId) {
            applyNoteColor(colorInput.value);
            renderCurrency();
            updateSummary();
            updateNoteDisplay();
        }

        if (onUpdate) onUpdate();
        renderSidebarNoteList();
        closeOverlay(overlay);
    });

    closeBtn.addEventListener('click', () => closeOverlay(overlay));
}

/**
 * ノート作成モーダルを開く
 */
export function openNoteCreateModal(onUpdate = null) {
    const template = document.getElementById('noteCreateTemplate');
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);

    const overlay = document.getElementById('note-create-overlay');
    const closeBtn = document.getElementById('closeNoteCreateBtn');
    const createBtn = document.getElementById('createNoteBtn');
    const noteNameInput = document.getElementById('newNoteNameInput');
    const currencySelect = document.getElementById('newNoteCurrencySelect');

    noteNameInput.value = `新規ノート ${appState.notes.length + 1}`;

    requestAnimationFrame(() => {
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
    });

    const colorInput = overlay.querySelector('#createNoteColorInput');
    const colorBtns = overlay.querySelectorAll('.color-preset-btn');
    colorBtns.forEach(btn => {
        if (btn.dataset.color === colorInput.value) btn.classList.add('active');
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            colorInput.value = btn.dataset.color;
        });
    });

    createBtn.addEventListener('click', () => {
        const name = noteNameInput.value.trim();
        if (!name) return;

        const currency = currencySelect.value;
        const settings = {
            hide2000: currency === 'JPY' && overlay.querySelector('#newNoteHide2000').checked,
            hideBills: currency === 'JPY' && overlay.querySelector('#newNoteHideBills').checked,
            hideCoins: currency === 'JPY' && overlay.querySelector('#newNoteHideCoins').checked
        };

        const newNote = createNewNote(name, currency, settings);
        handleNoteSwitch(newNote.id);

        if (onUpdate) onUpdate();
        closeOverlay(overlay);
    });

    closeBtn.addEventListener('click', () => closeOverlay(overlay));
}

/**
 * ノート切り替えモーダル
 */
export function openNoteSwitchModal() {
    const template = document.getElementById('noteSwitchTemplate');
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);

    const overlay = document.getElementById('note-overlay');
    const closeBtn = document.getElementById('closeNoteBtn');
    const noteListEl = document.getElementById('noteList');
    const newNoteBtn = document.getElementById('newNoteBtn');

    const renderNoteList = () => {
        noteListEl.innerHTML = '';
        appState.notes.forEach(note => {
            const li = document.createElement('li');
            li.className = 'note-item';
            li.dataset.id = note.id;
            li.innerHTML = `
        <span class="note-name ${note.id === appState.currentNoteId ? 'active' : ''}">${note.name} (${note.currency})</span>
        <div class="note-actions">
          <button class="edit-note-btn">編集</button>
          <button class="delete-note-btn">削除</button>
        </div>
      `;
            noteListEl.appendChild(li);
        });
    };

    renderNoteList();

    noteListEl.addEventListener('click', (e) => {
        const li = e.target.closest('.note-item');
        if (!li) return;
        const noteId = li.dataset.id;

        if (e.target.classList.contains('delete-note-btn')) {
            if (appState.notes.length <= 1) return alert('最後のノートは削除できません。');
            if (confirm('このノートを削除しますか？')) {
                deleteNote(noteId);
                renderNoteList();
                updateNoteDisplay();
                renderSidebarNoteList();
            }
        } else if (e.target.classList.contains('edit-note-btn')) {
            openNoteEditModal(noteId, renderNoteList);
        } else {
            handleNoteSwitch(noteId);
            closeOverlay(overlay);
        }
    });

    newNoteBtn.addEventListener('click', () => {
        openNoteCreateModal(() => {
            renderNoteList();
            renderSidebarNoteList();
        });
    });

    requestAnimationFrame(() => {
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
    });

    closeBtn.addEventListener('click', () => closeOverlay(overlay));
}
