# 金種入力アプリ 保守ガイド

このドキュメントは、`kinshu-site` の修正・機能追加・データ仕様変更を行う際に参照する保守用ドキュメントです。  
README が「利用者向けの概要」を扱うのに対し、本書は「実装を変更する人向けの注意点」を扱います。

---

## 1. 基本方針

本アプリは React / Vue などのフレームワークを使わない Vanilla JavaScript の静的 Web アプリです。

主な設計方針は次のとおりです。

- アプリ状態は `app/core/state.js` の `appState` を中心に管理する。
- DOM の読み書きは `app/ui/` に寄せ、状態管理層から極力分離する。
- 金種データは `app/core/data.js` に集約する。
- 永続化はブラウザの `localStorage` を使用する。
- ノート切替・履歴・設定・バックアップは、それぞれの UI / storage モジュールに責務を分ける。
- ビルド工程はなく、ES Modules をブラウザから直接読み込む。

---

## 2. 主なファイル構成

### 2.1 エントリーポイント

- `index.html`
  - 画面構造、各モーダル用 `<template>`、金種セルを定義する。
- `app/main.js`
  - 初期化処理。
  - 各 UI モジュールのイベントを結線する。
  - 起動時に State → UI の反映を行う。

### 2.2 Core

- `app/core/state.js`
  - `appState` の管理。
  - ノート作成・削除・切替。
  - ノート設定・履歴・テーマカラーの更新。
  - `localStorage` への保存。
  - バックアップインポート結果の適用。
- `app/core/data.js`
  - JPY / CNY の金種定義。

### 2.3 UI

- `app/ui/renderer.js`
  - JPY / CNY の表示切替。
  - 金種制限の反映。
  - 合計金額・紙幣枚数・硬貨枚数の集計。
- `app/ui/stateSync.js`
  - State と DOM の同期。
  - `loadStateToUI()`
  - `saveCountsFromUI()`
- `app/ui/noteUI.js`
  - ノート一覧、作成、編集、削除、切替。
  - ノートごとのテーマカラー。
- `app/ui/historyUI.js`
  - 保存ポイント作成。
  - 履歴一覧、詳細、復元、削除。
- `app/ui/settingsUI.js`
  - ダークモード。
  - バックアップのエクスポート / インポート。
- `app/ui/keypad.js`
  - オーバーレイテンキーの入力処理。

### 2.4 Storage

- `app/storage/backup.js`
  - JSON バックアップのダウンロード。
  - バックアップファイル読込後、State へ適用。
- `app/storage/export.js`
  - バックアップ用 JSON / Blob の生成。
- `app/storage/import.js`
  - JSON の解析・妥当性確認。

### 2.5 PWA

- `manifest.json`
  - PWA 名称、表示形式、開始 URL、アイコン等。
- `sw.js`
  - Service Worker。
  - 静的ファイルのキャッシュと旧キャッシュ削除。

---

## 3. 状態管理

`app/core/state.js` の `appState` がアプリ全体の状態の基準です。

主要プロパティ:

```js
appState = {
  currentCurrency: "JPY",
  currentInput: "",
  activeDisplay: null,
  isFirstInput: true,
  currentNoteId: null,
  notes: []
}
```

`notes` 内の 1 ノートは概ね次の構造です。

```json
{
  "id": "uuid",
  "name": "新規ノート 1",
  "currency": "JPY",
  "counts": {
    "jpy-10000": "5",
    "jpy-1000": "10"
  },
  "settings": {
    "hide2000": false,
    "hideBills": false,
    "hideCoins": false
  },
  "color": "#xxxxxx",
  "savedPoints": [],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### 注意

- `counts` の値は UI 由来のため文字列で保存される場合がある。
- 新しいプロパティを追加する場合、既存ユーザーの保存データには存在しない。
- 読み込み時は必ずデフォルト値を補完できる設計にする。
- 既存 JSON を壊す破壊的変更は避ける。

---

## 4. localStorage

### 4.1 ノートデータ

キー:

`notes_data`

保存形式:

```json
{
  "currentNoteId": "uuid",
  "notes": []
}
```

`saveNotesData()` は通常 100ms のデバウンス付きです。

連続入力中に毎回 `localStorage.setItem()` を実行しないための処理なので、通常の入力更新では即時保存に変更しないでください。

即時保存が必要な処理では `saveNotesData(true)` を使用します。

現在、即時保存を使用する代表例:

- 保存ポイント追加
- 履歴復元
- バックアップインポート適用

### 4.2 テーマ

現行の設定 UI は次のキーを使用します。

`theme`

値:

- `light`
- `dark`

なお、`state.js` には旧仕様の `darkMode` キーを参照するコードも残っています。  
テーマ周りを修正する場合は、`theme` と `darkMode` の扱いを先に整理してから変更してください。

---

## 5. 起動フロー

`app/main.js` の `DOMContentLoaded` 後、おおむね次の順で初期化されます。

1. `initState()`
2. `saveNotesData()` を `renderer.js` に渡す
3. `loadStateToUI()`
4. 現在ノートのテーマカラーを適用
5. `renderCurrency()`
6. ノート表示・PC サイドバーを描画
7. 履歴サイドバーを描画
8. テンキー、設定、各ボタンのイベントを登録

起動時の順序を変える場合、特に以下の依存関係に注意してください。

- `currentNoteId` が確定する前に UI を描画しない。
- `currentCurrency` が確定してから JPY / CNY の表示を切り替える。
- `loadStateToUI()` と `renderCurrency()` の両方が counts を DOM に反映するため、変更時は二重責務に注意する。

---

## 6. 入力・集計・保存フロー

入力後の主な流れ:

1. テンキー等で `.display` の値を更新
2. `updateSummary()`
3. 現在通貨の金種定義を使って合計・枚数を再計算
4. `saveCountsFromUI()`
5. 現在ノートの `counts` を更新
6. `saveNotesData()` により localStorage へデバウンス保存

### 注意

`updateSummary()` は単なる表示更新ではなく、現在値の保存も行います。

そのため、表示だけ再計算したい処理を追加する場合でも、意図せず State / localStorage を更新しないか確認してください。

---

## 7. ノート切替

ノート切替の中心処理は `noteUI.js` です。

基本フロー:

1. 切替前ノートの入力値を保存
2. `switchNote(noteId)`
3. `currentNoteId` と `currentCurrency` を更新
4. 新しいノートの counts を UI へ反映
5. 通貨表示・集計・テーマカラーを更新
6. ノート名や履歴一覧を再描画

### 通貨仕様

通貨はアプリ全体設定ではなくノート単位です。

新しい通貨を追加する場合は、最低でも次を確認してください。

- `app/core/data.js`
- ノート作成 UI の通貨選択肢
- `renderer.js`
- `historyUI.js`
- 通貨記号 / 単位表示
- CSS の通貨別テーマ
- バックアップ既存データとの互換性

---

## 8. 履歴

履歴はノートごとの `savedPoints` に保存されます。

保存ポイントの構造:

```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "memo": "残高確認",
  "counts": {},
  "total": 60000,
  "billCount": 15,
  "coinCount": 0
}
```

### 上限

1 ノートにつき最大 30 件です。

`MAX_SAVED_POINTS = 30`

31 件目以降を保存すると、古い履歴から削除されます。

### 復元

履歴復元では、

1. `restoreCounts()`
2. `loadStateToUI()`
3. `updateSummary()`
4. `renderCurrency()`

の順で現在入力へ反映します。

復元処理を変更する場合は、履歴自体を書き換えず、現在ノートの `counts` のみ上書きする仕様を維持してください。

---

## 9. バックアップ / インポート

設定画面から全ノートデータを JSON で保存・復元できます。

### エクスポート

`app/storage/backup.js: downloadBackup()`

ファイル名:

`kinshu_backup_YYYY-MM-DD.json`

### インポート

`importBackupFromFile()`

1. ファイルをテキスト読込
2. `parseBackupJson()` で解析
3. `applyImportedBackup()` で `appState` を置換
4. 即時保存
5. ページを再読み込み

### 重要

インポートは「追加」ではなく「現在データの置換」です。

仕様変更時は、既存バックアップファイルを読み込める後方互換性を優先してください。

バックアップ仕様を変更する場合、将来的には `schemaVersion` を持たせることを推奨します。

---

## 10. ノート設定

JPY ノートには次の設定があります。

- `hide2000`
- `hideBills`
- `hideCoins`

これらは「データを削除する設定」ではなく「入力対象を無効化する設定」です。

設定変更時に既存 counts を消さないようにしてください。

CNY では現在この制限設定を使用していません。

---

## 11. CSS / UI 修正時の注意

本アプリはスマートフォン利用を主用途としつつ、PC 用サイドバー UI もあります。

UI 修正時は最低限、次を確認してください。

- スマートフォン幅
- PC 幅
- JPY
- CNY
- ライトモード
- ダークモード
- モーダル表示中
- PWA / standalone 表示

モーダルは複数モジュールで似たクローズ処理を持っています。

現在は以下に対応しています。

- 閉じるボタン
- Escape
- オーバーレイ外クリック
- closing アニメーション
- `body.modal-open`

共通化する場合は、挙動を崩さないことを優先してください。

---

## 12. PWA / Service Worker

`sw.js` のキャッシュ名:

```js
const CACHE_NAME = "CalcApp-cache-v20251223";
```

更新時にキャッシュ内容を確実に切り替えたい場合は `CACHE_NAME` を変更してください。

activate 時に旧キャッシュは削除されます。

### 現在のプリキャッシュ対象

- `./`
- `./index.html`
- `./style.css`
- `./manifest.json`

JavaScript ファイルは現状 `urlsToCache` に列挙されていません。

そのため、「JS を変更したら CACHE_NAME を変更すれば必ず更新される」という構成ではありません。  
Service Worker を修正する場合は、キャッシュ戦略そのものを確認してください。

### 修正時の確認

- PWA 起動
- 通常ブラウザ起動
- 初回オンライン
- 再読込
- オフライン時
- Service Worker 更新後に旧 UI が残らないか

---

## 13. 機能追加時のチェック

### State に項目を追加する場合

- 新規ノート作成時の初期値
- 既存データ読込時のデフォルト値
- バックアップ出力
- インポート
- ノート複製相当の処理が将来追加された場合の扱い

### 新しい UI を追加する場合

- `main.js` にイベントを集約すべきか
- 各 UI モジュール内で完結させるべきか
- State を直接書き換えず既存 API を使えるか
- モバイル / PC の両方に必要か

### 新しい通貨を追加する場合

- data
- HTML
- renderer
- history
- 単位
- CSS
- バックアップ互換性

---

## 14. 動作確認チェックリスト

変更後は、影響範囲に応じて次を確認します。

### 基本入力

- JPY の各金種を入力できる
- CNY の各金種を入力できる
- 合計金額が正しい
- 紙幣 / 硬貨 / 合計枚数が正しい
- 全クリアできる

### ノート

- 新規作成
- 切替
- 名前変更
- JPY 金種制限
- 削除
- 最後の 1 ノートを削除できない
- ノートごとに counts が混ざらない

### 履歴

- 保存
- 最大 30 件
- 詳細
- 復元
- 削除

### 設定

- ライト / ダーク切替
- ページ再読込後もテーマが維持される

### バックアップ

- エクスポート
- JSON を再インポート
- ノート・履歴・設定が復元される
- 不正 JSON を拒否できる

### PWA

- manifest 読込
- Service Worker 登録
- キャッシュ更新
- オフライン表示

---

## 15. 既知の保守上の注意点

現時点で特に注意する箇所です。

1. テーマ保存キーに `theme` と旧 `darkMode` の両方が存在する。
2. `renderer.js` の `updateSummary()` が集計と保存の両方を担当している。
3. State → UI の反映が `loadStateToUI()` と `renderCurrency()` の一部で重複している。
4. `renderer.js` へ `saveNotesData` を setter 経由で渡しており、依存関係が少し複雑。
5. Service Worker のプリキャッシュ対象に JavaScript が含まれていない。

これらは直ちに不具合という意味ではありません。  
今後のリファクタリングで触れる場合に、周辺仕様を確認すべきポイントです。

---

## 16. 保守時の優先順位

修正時は次の順序を優先します。

1. ユーザーの保存データを壊さない
2. ノート間でデータを混在させない
3. JPY / CNY の両方を維持する
4. スマートフォン操作性を維持する
5. PWA 更新時に旧画面を残さない
6. 必要以上に依存関係を増やさない

特に `localStorage` とバックアップ JSON の互換性は、見た目の変更より優先して保守してください。
