// app/ui/historyUI.js
import { appState, addSavedPoint, deleteSavedPoint, restoreCounts, loadState } from '../core/state.js';
import { renderCurrency, updateSummary } from './renderer.js';
import { jpyData, cnyData } from '../core/data.js';

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
 * PCサイドバー用の履歴一覧描画
 */
export function renderSidebarHistoryList() {
    const container = document.getElementById('pc-sidebar-history-list');
    if (!container) return;

    const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
    if (!currentNote) return;

    container.innerHTML = '';

    if (!currentNote.savedPoints || currentNote.savedPoints.length === 0) {
        container.innerHTML = '<div class="history-empty" style="font-size: 12px; padding: 20px; text-align: center; color: var(--text-secondary);">履歴なし</div>';
        return;
    }

    const recentPoints = [...currentNote.savedPoints].reverse().slice(0, 10);
    recentPoints.forEach(sp => {
        const date = new Date(sp.timestamp);
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const unit = currentNote.currency === 'JPY' ? '円' : '元';

        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
      <div class="history-header" style="font-size: 11px; display: flex; justify-content: space-between;">
        <strong>${sp.memo}</strong>
        <span class="history-date">${dateStr} ${timeStr}</span>
      </div>
      <div style="font-size: 12px; margin: 4px 0; font-weight: bold;">
        ${sp.total.toLocaleString()} ${unit}
      </div>
      <div class="history-actions" style="margin-top: 5px; display: flex; gap: 4px;">
        <button class="restore-history-btn" style="flex: 1; padding: 4px; font-size: 10px;">復元</button>
        <button class="view-detail-btn" style="flex: 1; padding: 4px; font-size: 10px;">詳細</button>
      </div>
    `;

        div.querySelector('.restore-history-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            handleRestoreHistory(sp);
        });

        div.querySelector('.view-detail-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showHistoryDetail(sp);
        });

        container.appendChild(div);
    });
}

/**
 * 履歴の復元処理
 */
export function handleRestoreHistory(savedPoint) {
    if (confirm(`履歴「${savedPoint.memo}」の内容を現在の入力に復元しますか？`)) {
        restoreCounts(appState.currentNoteId, savedPoint.counts);
        loadState();
        updateSummary();
        renderCurrency();
        alert('データを復元しました。');
    }
}

/**
 * 保存ポイント作成モーダルを開く
 */
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
    const previewEl = document.getElementById('savePointPreview');

    // 現在の集計情報を計算
    const data = currentNote.currency === 'JPY' ? jpyData : cnyData;
    let total = 0, bills = 0, coins = 0;
    const counts = {};

    document.querySelectorAll('.cell').forEach(cell => {
        const val = parseFloat(cell.querySelector('.display').dataset.value || '0');
        const id = cell.dataset.id;
        const item = data.find(d => d.id === id);
        if (!item) return;

        counts[id] = val;
        total += item.kind * val;
        if (item.isCoin || item.kind < 1) coins += val;
        else bills += val;
    });

    const unit = currentNote.currency === 'JPY' ? '円' : '元';
    previewEl.innerHTML = `
    <strong>合計:</strong> ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}<br>
    <strong>紙幣:</strong> ${bills}枚 / <strong>硬貨:</strong> ${coins}枚
  `;

    saveBtn.addEventListener('click', () => {
        let memo = memoInput.value.trim();
        if (!memo) {
            if (currentNote.currency === 'JPY') {
                const man = Math.floor(total / 10000);
                const sen = Math.floor((total % 10000) / 1000);
                memo = man > 0 && sen > 0 ? `${man}万${sen}千` : man > 0 ? `${man}万` : sen > 0 ? `${sen}千` : `${total}円`;
            } else {
                memo = `${total}元`;
            }
        }

        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';

        requestAnimationFrame(() => {
            addSavedPoint(appState.currentNoteId, memo, counts, total, bills, coins);
            renderSidebarHistoryList();
            closeOverlay(overlay);
        });
    });

    closeBtn.addEventListener('click', () => closeOverlay(overlay));
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
    });
}

/**
 * 履歴表示モーダルを開く
 */
export function openHistoryModal() {
    const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
    if (!currentNote) return;

    const template = document.getElementById('historyTemplate');
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);

    const overlay = document.getElementById('history-overlay');
    const historyListEl = document.getElementById('historyList');

    const renderHistoryList = () => {
        historyListEl.innerHTML = '';
        if (!currentNote.savedPoints || currentNote.savedPoints.length === 0) {
            historyListEl.innerHTML = '<li class="history-empty">保存された履歴がありません</li>';
            return;
        }

        currentNote.savedPoints.forEach(sp => {
            const date = new Date(sp.timestamp);
            const dateStr = date.toLocaleString();
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
        <div class="history-header"><strong>${sp.memo}</strong> <span class="history-date">${dateStr}</span></div>
        <div class="history-actions">
          <button class="restore-history-btn">復元</button>
          <button class="view-detail-btn">詳細</button>
          <button class="delete-history-btn">削除</button>
        </div>
      `;
            li.querySelector('.restore-history-btn').onclick = () => {
                handleRestoreHistory(sp);
                closeOverlay(overlay);
            };
            li.querySelector('.view-detail-btn').onclick = () => showHistoryDetail(sp);
            li.querySelector('.delete-history-btn').onclick = () => {
                if (confirm('削除しますか？')) {
                    deleteSavedPoint(appState.currentNoteId, sp.id);
                    renderHistoryList();
                    renderSidebarHistoryList();
                }
            };
            historyListEl.appendChild(li);
        });
    };

    renderHistoryList();
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
    });
    document.getElementById('closeHistoryBtn').onclick = () => closeOverlay(overlay);
}

/**
 * 履歴詳細を表示
 */
export function showHistoryDetail(savedPoint) {
    const currentNote = appState.notes.find(n => n.id === appState.currentNoteId);
    if (!currentNote) return;

    const template = document.getElementById('historyDetailTemplate');
    const clone = template.content.cloneNode(true);
    document.body.appendChild(clone);

    const overlay = document.getElementById('history-detail-overlay');
    const date = new Date(savedPoint.timestamp);
    const data = currentNote.currency === 'JPY' ? jpyData : cnyData;
    const settings = currentNote.settings || {};

    let html = `<h4>${savedPoint.memo}</h4><p>${date.toLocaleString()}</p><hr><table class="detail-table"><tbody>`;
    data.forEach(item => {
        if (currentNote.currency === 'JPY') {
            if (settings.hide2000 && item.kind === 2000) return;
            if (settings.hideBills && !item.isCoin && item.kind >= 1) return;
            if (settings.hideCoins && (item.isCoin || item.kind < 1)) return;
        }
        const count = savedPoint.counts[item.id] || 0;
        html += `<tr><td>${item.label}</td><td>${count}枚</td></tr>`;
    });
    html += `</tbody></table>`;

    document.getElementById('historyDetailContent').innerHTML = html;
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
    });
    document.getElementById('closeHistoryDetailBtn').onclick = () => closeOverlay(overlay);
}
