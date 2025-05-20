const moneyData = {
    JPY: {
        yen: '円',
        sen: '銭',
        list: [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1],
        skip: 2000
    },
    CNY: {
        yen: '元',
        sen: '角',
        list: [100, 50, 20, 10, 5, 2, 1],
        skip: 0
    }
};

let current = "JPY";
let useNisen = false;

// 初期化
window.onload = () => {
    setInterval(updateTime, 1000);
    buildGrid();
    updateTotal();
};

// 時刻表示
function updateTime() {
    const now = new Date();
    const str = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    document.getElementById("dateTime").textContent = str;
}

// グリッド生成
function buildGrid() {
    const grid = document.getElementById("moneyGrid");
    grid.innerHTML = "";

    const list = moneyData[current].list;
    const isJPY = current === "JPY";

    const billRow = createRow(list.filter(v => v >= (isJPY ? 1000 : 10)));
    const coinRow = createRow(list.filter(v => v < (isJPY ? 1000 : 10)));

    grid.appendChild(billRow);
    grid.appendChild(coinRow);
}

function createRow(values) {
    const row = document.createElement("div");
    row.className = "row";

    for (const v of values) {
        if (!useNisen && v === 2000) continue;

        const cell = document.createElement("div");
        cell.className = "cell";
        cell.innerHTML = `
      <div>${formatMoney(v)}</div>
      <input type="text" inputmode="numeric" pattern="[0-9]*" oninput="onInput()" />
    `;
        row.appendChild(cell);
    }

    return row;
}

// 表示形式
function formatMoney(v) {
    const { yen, sen } = moneyData[current];
    return current === "JPY"
        ? `${v.toLocaleString()}${yen}`
        : v >= 10
            ? `${v / 10}${yen}`
            : `${v}${sen}`;
}

// 入力処理
function onInput() {
    updateTotal();
}

// 合計更新
function updateTotal() {
    let total = 0, count = 0, bills = 0, coins = 0;
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        const value = parseInt(cell.querySelector("input").value) || 0;
        const label = cell.querySelector("div").textContent;
        const num = parseFloat(label.replace(/[^\d.]/g, "")) * (current === "JPY" ? 1 : 10);

        total += num * value;
        count += value;
        (num >= (current === "JPY" ? 1000 : 10)) ? (bills += value) : (coins += value);
    });

    document.getElementById("total").textContent = `${(current === "JPY" ? total.toLocaleString() : (total / 10).toFixed(1))}${moneyData[current].yen}`;
    document.getElementById("count").textContent = `紙幣: ${bills}枚 ｜ 硬貨: ${coins}枚 ｜ 合計: ${count}枚`;
}

// 二千円切替
function toggleNisen() {
    useNisen = !useNisen;
    document.getElementById("toggleBtn").textContent = useNisen ? "二千円札を使用しない" : "二千円札を使用する";
    buildGrid();
    updateTotal();
}

// 通貨切替確認
function confirmCurrencySwitch() {
    const next = current === "JPY" ? "CNY" : "JPY";
    if (!confirm(`通貨を ${next} に切り替えますか？\n現在の入力はクリアされます。`)) return;
    current = next;
    useNisen = false;
    document.getElementById("currencyBtn").textContent = `通貨: ${current}`;
    buildGrid();
    updateTotal();
}

// 入力クリア
function clearAll() {
    if (!confirm("すべての入力をクリアしますか？")) return;
    document.querySelectorAll(".cell input").forEach(i => i.value = "");
    updateTotal();
}

// スクリーンショット
function screenshot() {
    const area = document.getElementById("shotArea");
    html2canvas(area).then(canvas => {
        const link = document.createElement("a");
        link.href = canvas.toDataURL();
        const now = new Date();
        const name = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        link.download = `kinsyu_${name}.png`;
        link.click();
    });
}
