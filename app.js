const moneyData = {
    JPY: {
        yen: '�~',
        sen: '�K',
        list: [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1],
        skip: 2000
    },
    CNY: {
        yen: '��',
        sen: '�p',
        list: [100, 50, 20, 10, 5, 2, 1],
        skip: 0
    }
};

let current = "JPY";
let useNisen = false;

// ������
window.onload = () => {
    setInterval(updateTime, 1000);
    buildGrid();
    updateTotal();
};

// �����\��
function updateTime() {
    const now = new Date();
    const str = `${now.getFullYear()}�N${now.getMonth() + 1}��${now.getDate()}�� ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    document.getElementById("dateTime").textContent = str;
}

// �O���b�h����
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

// �\���`��
function formatMoney(v) {
    const { yen, sen } = moneyData[current];
    return current === "JPY"
        ? `${v.toLocaleString()}${yen}`
        : v >= 10
            ? `${v / 10}${yen}`
            : `${v}${sen}`;
}

// ���͏���
function onInput() {
    updateTotal();
}

// ���v�X�V
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
    document.getElementById("count").textContent = `����: ${bills}�� �b �d��: ${coins}�� �b ���v: ${count}��`;
}

// ���~�ؑ�
function toggleNisen() {
    useNisen = !useNisen;
    document.getElementById("toggleBtn").textContent = useNisen ? "���~�D���g�p���Ȃ�" : "���~�D���g�p����";
    buildGrid();
    updateTotal();
}

// �ʉݐؑ֊m�F
function confirmCurrencySwitch() {
    const next = current === "JPY" ? "CNY" : "JPY";
    if (!confirm(`�ʉ݂� ${next} �ɐ؂�ւ��܂����H\n���݂̓��͂̓N���A����܂��B`)) return;
    current = next;
    useNisen = false;
    document.getElementById("currencyBtn").textContent = `�ʉ�: ${current}`;
    buildGrid();
    updateTotal();
}

// ���̓N���A
function clearAll() {
    if (!confirm("���ׂĂ̓��͂��N���A���܂����H")) return;
    document.querySelectorAll(".cell input").forEach(i => i.value = "");
    updateTotal();
}

// �X�N���[���V���b�g
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
