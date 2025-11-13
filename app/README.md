# アプリ構成概要

## ディレクトリ構成

app/
├── core/
│   ├── state.js          # 状態管理・localStorage同期
│   ├── data.js           # 通貨データ定義
│   ├── utils.js          # 安全な演算処理・DOM補助関数
│
├── ui/
│   ├── renderer.js       # 通貨一覧描画・合計更新
│   ├── keypad.js         # 入力UI制御
│   ├── settings.js       # 設定モーダル・トグル制御
│
├── export/
│   └── imageExport.js    # スクリーンショット生成（html2canvas）
│
└── main.js               # 初期化処理・イベントバインド
