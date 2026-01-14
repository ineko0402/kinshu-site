# 金種計算アプリ 保守ドキュメント (MAINTENANCE.md)

このドキュメントは、本アプリケーションの保守・拡張を行う開発者のためのリファレンスです。

---

## 1. システムアーキテクチャ

本アプリはフレームワーク（React, Vue等）を使用しない Vanilla JS で構成されています。
**「状態（State）の変更が UI（Renderer）を駆動する」**という一方向のデータフローを基本としています。

### 1.1 ディレクトリ構造
- `app/core/`: ビジネスロジック。UIに依存しない純粋なJS。
  - `state.js`: 唯一の真実（Single Source of Truth）。状態管理と保存。
  - `data.js`: 通貨（JPY, CNY）の定義。
- `app/ui/`: UI制御。DOM操作を含む。
  - `renderer.js`: 数値の集計計算とメイン表示の描画。
  - `noteUI.js` / `historyUI.js`: 各種モーダルとサイドバーの挙動。
  - `stateSync.js`: UIとStateを接着する（DOMから値を読み取り、Stateに反映する）。
- `app/export/`: 画像（JPEG）出力機能。
- `css/`: デザイン定義。`layout.css` と `components.css` で役割を分離。

---

## 2. データスキーマ (localStorage)

データは `localStorage` の `notes_data` キーに JSON 形式で保存されます。

### 2.1 JSON 構造
```json
{
  "currentNoteId": "uuid-...",
  "notes": [
    {
      "id": "uuid-...",
      "name": "新規ノート 1",
      "currency": "JPY",
      "counts": { "jpy-10000": "5", "jpy-1000": "10" },
      "color": "#ff0000",
      "settings": { "hide2000": false, "hideBills": false, "hideCoins": false },
      "savedPoints": [
        {
          "id": "uuid-...",
          "timestamp": "2026-01-14T...",
          "memo": "残高確認",
          "counts": { ... },
          "total": 60000,
          "billCount": 15,
          "coinCount": 0
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## 3. ノートと履歴のライフサイクル

### 3.1 ノートの切り替えフロー
1. `noteUI.js: handleNoteSwitch(noteId)` が呼ばれる。
2. `saveCountsFromUI()` で現在の画面の数値を State にバックアップ。
3. `switchNote(noteId)` で `currentNoteId` を更新。
4. `loadStateToUI()` で新しいノートの数値を画面に反映。
5. `renderer.js` 等で画面全体を再描画。

### 3.2 履歴の復元フロー
1. `historyUI.js: handleRestoreHistory(savedPoint)`
2. `state.js: restoreCounts(noteId, counts)` を呼び、State を上書き。
3. UI側の再読み込み（`loadStateToUI`, `updateSummary`, `renderCurrency`）。

---

## 4. 拡張ガイド

### 4.1 新しい通貨の追加
1. `app/core/data.js` に新しい配列（例: `usdData`）を定義。
2. `index.html` のノート作成モーダルの `<select>` に選択肢を追加。
3. 通貨記号（円/元/$）などの分岐処理を `renderer.js` や `historyUI.js` に追加。

### 4.2 履歴・ノートへの項目追加（重要）
将来的に「統計」や「用途フラグ」などを追加する場合：
1. `state.js` の `createNewNote` または `addSavedPoint` に初期値を追加。
2. `saveNotesData` は `appState` 全体を保存するため、プロパティを増やすだけで自動的に永続化されます。
3. **注意**: 既存のユーザーデータにはその項目が存在しないため、読み込み時に必ずデフォルト値を代入するようにしてください。

---

## 5. PWA とキャッシュ (sw.js)

- アプリを更新（JS/CSSを変更）した後は、`sw.js` 内の `CACHE_NAME`（例: `kinshu-app-v1.x.x`）をインクリメントしてください。
- インクリメントしないと、ユーザーのブラウザに古いキャッシュが残り続け、新しい変更が反映されません。
