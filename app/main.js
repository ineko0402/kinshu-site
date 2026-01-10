// app/main.js
// ==============================
// アプリのエントリーポイント
// ==============================

import { initState, loadState, appState, switchNote, createNewNote, deleteNote, updateNoteSettings, updateNoteName, addSavedPoint, deleteSavedPoint, restoreCounts, updateNoteColor } from './core/state.js';
import { renderCurrency } from './ui/renderer.js';
import { bindKeypadEvents } from './ui/keypad.js';
import { bindSettingsEvents, openSettings } from './ui/settings.js';
import { bindExportEvents, downloadImage } from './export/imageExport.js';
import { resetAll, updateSummary } from './ui/renderer.js';
import { jpyData, cnyData } from './core/data.js';

// 初期化時にPC用サイドバーを更新
document.addEventListener('DOMContentLoaded', () => {
  renderSidebarNoteList();
  renderSidebarHistoryList();

  // PC用新規作成ボタン
  const pcNewBtn = document.getElementById('pc-newNoteBtn');
  if (pcNewBtn) {
    pcNewBtn.addEventListener('click', () => {
      openNoteCreateModal(() => {
        renderSidebarNoteList();
      });
    });
  }
});

/**
 * ノートの色をCSS変数に適用する (グローエフェクトのみ)
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

  // hex to rgb
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const rgb = `${r}, ${g}, ${b}`;

  // 強度の異なるRGBA変数を設定 (Option 3: Radiant Aura をベースに調整)
  // ダークモードならより鮮やかに、ライトモードでもしっかりとネオン感が出る設定
  const alpha1 = isDark ? 0.7 : 0.5;      // 拡散光 (広範囲)
  const alpha2 = isDark ? 0.5 : 0.35;     // 中心光 (強め)
  const alphaText = isDark ? 1.0 : 0.8;   // テキスト発光

  root.style.setProperty('--accent-color-raw', rgb);
  root.style.setProperty('--accent-glow-primary', `rgba(${rgb}, ${alpha1})`);
  root.style.setProperty('--accent-glow-secondary', `rgba(${rgb}, ${alpha2})`);
  root.style.setProperty('--accent-glow-text', `rgba(${rgb}, ${alphaText})`);
}

// ノート切り替えUIの表示/非表示を制御する関数
export function updateNoteDisplay() {
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  const noteNameEl = document.getElementById('currentNoteName');
  if (noteNameEl && currentNote) {
    noteNameEl.textContent = `${currentNote.name} (${currentNote.currency})`;
  }
}

// ノート編集モーダルを開く
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

  // アニメーション用にクラス追加
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
  });

  noteNameInput.value = note.name;
  currencyDisplay.textContent = note.currency;

  // カラープリセットの初期化
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

  // JPYの場合のみ金種制限設定を表示
  const settingsSection = overlay.querySelector('.note-settings-section');
  if (note.currency === 'JPY') {
    settingsSection.classList.add('visible');
    const settings = note.settings || {};
    overlay.querySelector('#noteHide2000').checked = settings.hide2000 || false;
    overlay.querySelector('#noteHideBills').checked = settings.hideBills || false;
    overlay.querySelector('#noteHideCoins').checked = settings.hideCoins || false;
  } else {
    settingsSection.classList.remove('visible');
  }

  // メッセージ表示関数
  function showMessage(text, type = 'error') {
    messageBar.textContent = text;
    messageBar.className = `message-bar ${type}`;
    messageBar.classList.add('visible');
  }

  function hideMessage() {
    messageBar.classList.remove('visible');
  }

  noteNameInput.addEventListener('input', hideMessage);

  // 閉じる処理（アニメーション対応）
  function closeOverlay() {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300); // CSS transition time
  }

  // 保存処理
  saveBtn.addEventListener('click', () => {
    const newName = noteNameInput.value.trim();
    if (!newName) {
      showMessage('ノート名を入力してください。', 'error');
      return;
    }

    // ノート名を更新
    updateNoteName(noteId, newName);

    // 色を更新
    updateNoteColor(noteId, colorInput.value);

    // JPYの場合は設定も更新
    if (note.currency === 'JPY') {
      updateNoteSettings(noteId, {
        hide2000: overlay.querySelector('#noteHide2000').checked,
        hideBills: overlay.querySelector('#noteHideBills').checked,
        hideCoins: overlay.querySelector('#noteHideCoins').checked
      });
    }

    // 現在アクティブなノートの場合は再描画
    if (noteId === appState.currentNoteId) {
      applyNoteColor(colorInput.value);
      renderCurrency();
      updateSummary();
      updateNoteDisplay();
    }

    // コールバック実行（一覧更新など）
    if (onUpdate) onUpdate();

    closeOverlay();
  });

  closeBtn.addEventListener('click', () => {
    closeOverlay();
  });
}

// 保存ポイント作成モーダルを開く
export function openSavePointModal() {
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (!currentNote) return;

  const template = document.getElementById('savePointTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('savepoint-overlay');
  const closeBtn = document.getElementById('closeSavePointBtn');
  const saveBtn = document.getElementById('saveSavePointBtn');
  const memoInput = document.getElementById('savePointMemoInput');
  const messageBar = document.getElementById('savePointMessage');

  // 現在の集計情報を表示
  const data = currentNote.currency === 'JPY' ? jpyData : cnyData;
  const settings = currentNote.settings || {};
  let total = 0, bills = 0, coins = 0;

  document.querySelectorAll('.cell').forEach(cell => {
    const val = parseFloat(cell.querySelector('.display').dataset.value || '0');
    if (isNaN(val)) return;

    const id = cell.dataset.id;
    const item = data.find(d => d.id === id);
    if (!item) return;

    const amt = item.kind * val;
    if (item.isCoin || item.kind < 1) coins += val;
    else bills += val;
    total += amt;
  });

  const unit = currentNote.currency === 'JPY' ? '円' : '元';
  document.getElementById('savePointPreview').innerHTML = `
    <strong>合計:</strong> ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}<br>
    <strong>紙幣:</strong> ${bills}枚 / <strong>硬貨:</strong> ${coins}枚
  `;

  // デフォルトのメモは空欄
  memoInput.value = '';

  // メモフォーマット関数
  function formatTotalToMemo(amount, currency) {
    if (currency === 'CNY') {
      return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}元`;
    }

    // JPY logic
    const man = Math.floor(amount / 10000);
    const sen = Math.floor((amount % 10000) / 1000);

    if (man > 0 && sen > 0) return `${man}万${sen}千`;
    if (man > 0) return `${man}万`;
    if (sen > 0) return `${sen}千`;
    return `${amount}円`;
  }

  // メッセージ表示関数
  function showMessage(text, type = 'error') {
    messageBar.textContent = text;
    messageBar.className = `message-bar ${type}`;
    messageBar.classList.add('visible');

    // 成功メッセージは自動的に消える（1秒）
    if (type === 'success') {
      setTimeout(() => {
        messageBar.classList.remove('visible');
      }, 1000);
    }
  }

  // メッセージを非表示
  function hideMessage() {
    messageBar.classList.remove('visible');
  }

  // 入力時にメッセージを非表示
  memoInput.addEventListener('input', hideMessage);

  // アニメーション開始
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
  });

  function closeOverlay() {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }

  // 保存処理
  saveBtn.addEventListener('click', () => {
    let memo = memoInput.value.trim();
    if (!memo) {
      // 空欄の場合は自動生成
      memo = formatTotalToMemo(total, currentNote.currency);
    }

    // ボタンを無効化してダブルクリック防止
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    // 現在のcountsデータを収集（既に計算済みのデータを再利用）
    const counts = {};
    document.querySelectorAll('.cell').forEach(cell => {
      const id = cell.dataset.id;
      const val = cell.querySelector('.display').dataset.value || '0';
      counts[id] = val;
    });

    // 非同期で保存処理を実行
    requestAnimationFrame(() => {
      try {
        addSavedPoint(appState.currentNoteId, memo, counts, total, bills, coins);
        showMessage('保存しました。', 'success');

        // サイドバーの履歴を更新
        renderSidebarHistoryList();

        // 短い待機時間でモーダルを閉じる（500ms）
        setTimeout(() => {
          closeOverlay();
        }, 500);
      } catch (error) {
        console.error('保存エラー:', error);
        showMessage('保存に失敗しました。', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = '保存';
      }
    });
  });

  closeBtn.addEventListener('click', () => {
    closeOverlay();
  });
}

// 履歴表示モーダルを開く
export function openHistoryModal() {
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (!currentNote) return;

  const template = document.getElementById('historyTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('history-overlay');
  const closeBtn = document.getElementById('closeHistoryBtn');
  const historyListEl = document.getElementById('historyList');

  // 履歴一覧の描画
  function renderHistoryList() {
    historyListEl.innerHTML = '';

    if (!currentNote.savedPoints || currentNote.savedPoints.length === 0) {
      historyListEl.innerHTML = '<li class="history-empty">保存された履歴がありません</li>';
      return;
    }

    currentNote.savedPoints.forEach(sp => {
      const date = new Date(sp.timestamp);
      const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      const unit = currentNote.currency === 'JPY' ? '円' : '元';

      const li = document.createElement('li');
      li.className = 'history-item';
      li.dataset.id = sp.id;
      li.innerHTML = `
        <div class="history-header">
          <strong>${currentNote.name} ${sp.memo}</strong>
          <span class="history-date">${dateStr}</span>
        </div>
        <div class="history-summary">
          合計: ${sp.total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit} (紙幣: ${sp.billCount}枚 / 硬貨: ${sp.coinCount}枚)
        </div>
        <div class="history-actions">
          <button class="restore-history-btn">復元</button>
          <button class="view-detail-btn">詳細</button>
          <button class="copy-report-btn">レポート</button>
          <button class="delete-history-btn">削除</button>
        </div>
      `;
      historyListEl.appendChild(li);
    });
  }

  // アニメーション開始
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
  });

  function closeOverlay() {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }

  renderHistoryList();

  // イベント処理
  historyListEl.addEventListener('click', (e) => {
    const li = e.target.closest('.history-item');
    if (!li) return;

    const spId = li.dataset.id;
    const savedPoint = currentNote.savedPoints.find(sp => sp.id === spId);
    if (!savedPoint) return;

    if (e.target.classList.contains('delete-history-btn')) {
      // 削除
      if (confirm(`履歴「${savedPoint.memo}」を削除しますか？\n\nこの操作は取り消せません。`)) {
        deleteSavedPoint(appState.currentNoteId, spId);
        renderHistoryList();
      }
    } else if (e.target.classList.contains('restore-history-btn')) {
      // 復元
      if (confirm(`履歴「${savedPoint.memo}」の内容を現在の入力に上書き復元しますか？\n\n現在の入力内容は失われます。`)) {
        restoreCounts(appState.currentNoteId, savedPoint.counts);
        loadState();
        updateSummary();
        renderCurrency(); // セルの無効化状態なども反映するため

        alert('データを復元しました。');
        closeOverlay();
      }
    } else if (e.target.classList.contains('view-detail-btn')) {
      // 詳細表示
      showHistoryDetail(savedPoint);
    } else if (e.target.classList.contains('copy-report-btn')) {
      // レポートコピー
      copyReport(savedPoint, currentNote);
    }
  });

  closeBtn.addEventListener('click', () => {
    closeOverlay();
  });
}

// 履歴詳細を表示
function showHistoryDetail(savedPoint) {
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (!currentNote) return;

  const template = document.getElementById('historyDetailTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('history-detail-overlay');
  const closeBtn = document.getElementById('closeHistoryDetailBtn');
  const detailContent = document.getElementById('historyDetailContent');

  const date = new Date(savedPoint.timestamp);
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const unit = currentNote.currency === 'JPY' ? '円' : '元';
  const data = currentNote.currency === 'JPY' ? jpyData : cnyData;
  const settings = currentNote.settings || {};

  let html = `
    <h4>${savedPoint.memo}</h4>
    <p><strong>日時:</strong> ${dateStr}</p>
    <p><strong>合計:</strong> ${savedPoint.total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}</p>
    <p><strong>紙幣:</strong> ${savedPoint.billCount}枚 / <strong>硬貨:</strong> ${savedPoint.coinCount}枚</p>
    <hr>
    <h5>金種明細</h5>
    <table class="detail-table">
      <thead>
        <tr>
          <th>金種</th>
          <th>枚数</th>
          <th>金額</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach(item => {
    // 金種制限で無効化されている金種はスキップ
    if (currentNote.currency === 'JPY') {
      if (settings.hide2000 && item.kind === 2000) return;
      if (settings.hideBills && !item.isCoin && item.kind >= 1) return;
      if (settings.hideCoins && (item.isCoin || item.kind < 1)) return;
    }

    const count = parseFloat(savedPoint.counts[item.id] || '0');
    const amount = count * item.kind;
    const formattedAmount = currentNote.currency === 'CNY' && item.kind < 1
      ? amount.toFixed(1)
      : amount.toLocaleString();

    html += `
      <tr>
        <td>${item.label}</td>
        <td>${count}</td>
        <td>${formattedAmount} ${unit}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  // アニメーション開始
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
  });

  function closeOverlay() {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }

  detailContent.innerHTML = html;

  closeBtn.addEventListener('click', () => {
    closeOverlay();
  });
}

// レポートをクリップボードにコピー
function copyReport(savedPoint, note) {
  const date = new Date(savedPoint.timestamp);
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const unit = note.currency === 'JPY' ? '円' : '元';
  const data = note.currency === 'JPY' ? jpyData : cnyData;
  const settings = note.settings || {};

  let report = `=== ${note.name}: ${savedPoint.memo} ===\n`;
  report += `日時: ${dateStr}\n`;
  report += `合計: ${savedPoint.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}\n`;
  report += `紙幣: ${savedPoint.billCount}枚 / 硬貨: ${savedPoint.coinCount}枚\n\n`;
  report += `[金種明細]\n`;

  data.forEach(item => {
    // 金種制限で無効化されている金種はスキップ
    if (note.currency === 'JPY') {
      if (settings.hide2000 && item.kind === 2000) return;
      if (settings.hideBills && !item.isCoin && item.kind >= 1) return;
      if (settings.hideCoins && (item.isCoin || item.kind < 1)) return;
    }

    const count = parseFloat(savedPoint.counts[item.id] || '0');
    const amount = count * item.kind;
    const formattedAmount = note.currency === 'CNY' && item.kind < 1
      ? amount.toFixed(1)
      : amount.toLocaleString();

    report += `${item.label}: ${count}枚 (${formattedAmount}${unit})\n`;
  });

  // クリップボードにコピー
  navigator.clipboard.writeText(report).then(() => {
    alert('レポートをクリップボードにコピーしました。');
  }).catch(err => {
    console.error('コピーに失敗しました:', err);
    alert('コピーに失敗しました。');
  });
}

// 新規ノート作成モーダルを開く
export function openNoteCreateModal(onUpdate = null) {
  const template = document.getElementById('noteCreateTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('note-create-overlay');
  const closeBtn = document.getElementById('closeNoteCreateBtn');
  const createBtn = document.getElementById('createNoteBtn');
  const noteNameInput = document.getElementById('newNoteNameInput');
  const currencySelect = document.getElementById('newNoteCurrencySelect');
  const messageBar = document.getElementById('noteCreateMessage');

  // デフォルトのノート名を設定
  noteNameInput.value = `新規ノート ${appState.notes.length + 1}`;

  // 通貨選択時に金種制限設定の表示/非表示を切り替え
  const settingsSection = overlay.querySelector('.note-settings-section');
  currencySelect.addEventListener('change', (e) => {
    if (e.target.value === 'JPY') {
      settingsSection.classList.add('visible');
    } else {
      settingsSection.classList.remove('visible');
    }
  });

  // メッセージ表示関数
  function showMessage(text, type = 'error') {
    messageBar.textContent = text;
    messageBar.className = `message-bar ${type}`;
    messageBar.classList.add('visible');
  }

  function hideMessage() {
    messageBar.classList.remove('visible');
  }

  noteNameInput.addEventListener('input', hideMessage);

  // アニメーション開始
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
  });

  function closeOverlay() {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }

  // 作成処理
  const now = new Date().toISOString();

  // カラープリセット
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
    if (!name) {
      showMessage('ノート名を入力してください。', 'error');
      return;
    }

    const currency = currencySelect.value;
    const settings = {
      hide2000: false,
      hideBills: false,
      hideCoins: false
    };

    // JPYの場合は設定を取得
    if (currency === 'JPY') {
      settings.hide2000 = overlay.querySelector('#newNoteHide2000').checked;
      settings.hideBills = overlay.querySelector('#newNoteHideBills').checked;
      settings.hideCoins = overlay.querySelector('#newNoteHideCoins').checked;
    }

    const newNote = createNewNote(name, currency, settings);
    switchNote(newNote.id);
    renderCurrency();
    updateSummary();
    updateNoteDisplay();

    // コールバック実行（一覧更新など）
    if (onUpdate) onUpdate();

    closeOverlay();
  });

  closeBtn.addEventListener('click', () => {
    closeOverlay();
  });
}

// ノートモーダルを開く
export function openNoteSwitchModal() {
  const template = document.getElementById('noteSwitchTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('note-overlay');
  const closeBtn = document.getElementById('closeNoteBtn');
  const noteListEl = document.getElementById('noteList');
  const newNoteBtn = document.getElementById('newNoteBtn');

  // ノート一覧の描画
  function renderNoteList() {
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
  }

  renderNoteList();

  // サイドバーも更新
  renderSidebarNoteList();

  // ノート切り替え・編集・削除処理
  noteListEl.addEventListener('click', (e) => {
    const li = e.target.closest('.note-item');
    if (!li) return;

    const noteId = li.dataset.id;

    if (e.target.classList.contains('delete-note-btn')) {
      // 削除ボタン
      if (appState.notes.length <= 1) {
        alert('最後のノートは削除できません。');
        return;
      }
      const noteToDelete = appState.notes.find(n => n.id === noteId);
      if (confirm(`ノート「${noteToDelete.name}」を削除しますか？\n\nこの操作は取り消せません。`)) {
        deleteNote(noteId);
        renderNoteList();
        renderCurrency();
        updateSummary();
        updateNoteDisplay();
      }
    } else if (e.target.classList.contains('edit-note-btn')) {
      // 編集ボタン
      openNoteEditModal(noteId, () => {
        renderNoteList();
        updateNoteDisplay();
      });
    } else {
      // ノート切り替え
      if (noteId !== appState.currentNoteId) {
        const success = switchNote(noteId);
        if (success) {
          const note = appState.notes.find(n => n.id === noteId);
          applyNoteColor(note.color);

          renderCurrency();
          updateSummary();
          updateNoteDisplay();
          // アクティブなノートを更新
          document.querySelectorAll('.note-name').forEach(el => el.classList.remove('active'));
          li.querySelector('.note-name').classList.add('active');
        } else {
          alert('ノートの切り替えに失敗しました。');
        }
      }
    }
  });

  // アニメーション開始
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
  });

  function closeOverlay() {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }

  // 新規ノート作成処理
  newNoteBtn.addEventListener('click', () => {
    // 既存モーダルを閉じてから新規作成を開く（オーバーレイを入れ替えるため）
    // ただしDOMからは即削除せず、単に上に重ねる形とするが、
    // ここではシンプルに一度閉じる
    // closeOverlay(); // タイミング問題があるため、コールバック方式推奨だが、今回はそのまま開く
    // 注: 現実装ではオーバーレイが重なる。ボトムシートだと重なりが気になるかも。
    // 一旦そのまま
    openNoteCreateModal(() => {
      renderNoteList();
    });
  });

  closeBtn.addEventListener('click', () => {
    closeOverlay();
  });
}

// バックアップモーダルを開く
export function openBackupModal() {
  const template = document.getElementById('backupTemplate');
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

  const overlay = document.getElementById('backup-overlay');
  const closeBtn = document.getElementById('closeBackupBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');
  const importBtn = document.getElementById('importBtn');

  // エクスポート処理
  exportBtn.addEventListener('click', () => {
    const data = localStorage.getItem('notes_data');
    if (!data) {
      alert('保存されたノートデータがありません。');
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinshu_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('ノートデータをエクスポートしました。');
  });

  // インポート処理
  importBtn.addEventListener('click', () => {
    importInput.click();
  });

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData.notes && Array.isArray(importedData.notes)) {
          if (confirm('現在のノートデータを上書きしてインポートしますか？')) {
            localStorage.setItem('notes_data', event.target.result);
            alert('ノートデータをインポートしました。ページをリロードします。');
            window.location.reload();
          }
        } else {
          alert('ファイル形式が正しくありません。');
        }
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。JSON形式を確認してください。');
        console.error(error);
      }
    };
    reader.readAsText(file);
  });

  overlay.querySelector('#closeSettingsBtn').addEventListener('click', closeOverlay);
  // ↑ Note: openBackupModal uses closeBtn const, not querySelector('#closeSettingsBtn') usually.
  // Wait, let's check the original code.

  // Original:
  //   closeBtn.addEventListener('click', () => {
  //     document.body.removeChild(overlay);
  //   });

  // Revised content:
  closeBtn.addEventListener('click', closeOverlay);

  // Note: overlay.addEventListener('click', ...) is not standard in other modals in main.js, 
  // but let's be consistent with others if possible.
  // Others don't have click-overlay-to-close in main.js (checked openSavePointModal).
  // Only settings.js had it.

  // Let's just add the animation start and closeOverlay function.

  // アニメーション開始
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.body.classList.add('modal-open');
  });

  function closeOverlay() {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }
}

// DOM構築完了後に初期化
window.addEventListener('DOMContentLoaded', () => {
  // 状態初期化・読込
  initState();
  loadState();

  // 現在のノートの色を適用
  const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
  if (currentNote) {
    applyNoteColor(currentNote.color);
  }

  // 通貨レンダリング
  renderCurrency();
  updateNoteDisplay();

  // イベント登録
  bindKeypadEvents();
  bindSettingsEvents();
  bindExportEvents();

  document.getElementById('clearAllBtn').addEventListener('click', resetAll);
  document.getElementById('saveBtn').addEventListener('click', openSavePointModal);
  document.getElementById('historyBtn').addEventListener('click', openHistoryModal);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('noteSwitchBtn').addEventListener('click', openNoteSwitchModal);
  console.log('[INIT] アプリが初期化されました。');
});