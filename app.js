document.addEventListener("DOMContentLoaded", () => {
    // モード管理
    let mode = "JPY"; // "JPY" or "CNY"

    // JPYデータ
    const jpyRate = {
        yen10000: 10000, yen5000: 5000, yen2000: 2000, yen1000: 1000,
        yen500: 500, yen100: 100, yen50: 50, yen10: 10, yen5: 5, yen1: 1
    };
    const jpyBills = ["yen10000", "yen5000", "yen2000", "yen1000"];
    const jpyCoins = ["yen500", "yen100", "yen50", "yen10", "yen5", "yen1"];

    // CNYデータ
    const cnyRate = {
        cny100: 100, cny50: 50, cny20: 20, cny10: 10, cny5: 5, cny1: 1,
        coin1: 1, coin05: 0.5, coin01: 0.1
    };
    const cnyBills = ["cny100", "cny50", "cny20", "cny10", "cny5", "cny1"];
    const cnyCoins = ["coin1", "coin05", "coin01"];

    // 初期化
    document.querySelectorAll("input").forEach(el => {
        el.addEventListener("input", calc);
    });

    document.getElementById("clearBtn").onclick = () => {
        document.querySelectorAll("input").forEach(el => el.value = "0");
        calc();
    };

    document.getElementById("modeBtn").onclick = () => {
        mode = mode === "JPY" ? "CNY" : "JPY";
        document.getElementById("JPYgrid").style.display = mode === "JPY" ? "block" : "none";
        document.getElementById("CNYgrid").style.display = mode === "CNY" ? "block" : "none";
        document.getElementById("modeBtn").textContent = `通貨切替: ${mode}`;
        calc();
    };

    document.getElementById("shotBtn").onclick = () => {
        html2canvas(document.getElementById("shotArea")).then(canvas => {
            const link = document.createElement("a");
            link.href = canvas.toDataURL();
            link.download = `screenshot_${mode}_${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
            link.click();
        });
    };

    // 日時表示
    setInterval(() => {
        const now = new Date();
        document.getElementById("datetime").textContent = now.toLocaleString();
    }, 1000);

    // 計算関数
    function calc() {
        let total = 0, bills = 0, coins = 0;
        let rate, billsList, coinsList;
        if (mode === "JPY") {
            rate = jpyRate;
            billsList = jpyBills;
            coinsList = jpyCoins;
        } else {
            rate = cnyRate;
            billsList = cnyBills;
            coinsList = cnyCoins;
        }

        for (const id in rate) {
            const el = document.getElementById(id);
            if (!el || el.disabled) continue;
            const count = parseFloat(el.value) || 0;
            total += rate[id] * count;
            if (billsList.includes(id)) bills += count;
            if (coinsList.includes(id)) coins += count;
        }

        document.getElementById("total").textContent = total.toLocaleString();
        document.getElementById("count").textContent = `紙幣: ${bills}枚 ｜ 硬貨: ${coins}枚 ｜ 合計: ${bills + coins}枚`;
    }

    window.runCalc = function () {
        const input = document.getElementById("calcInput");
        if (!input) return;

        try {
            const result = Function(`'use strict'; return (${input.value})`)();
            input.value = result.toString(); // ← 結果をそのまま input に表示
        } catch (e) {
            alert("式が無効です");
        }
    };

    window.insertCalc = function (char) {
        if (currentInput && currentInput.tagName === "INPUT") {
            currentInput.value += char;
            currentInput.focus();
            currentInput.dispatchEvent(new Event('input')); // 計算を反映
        }
    };

    window.clearCalc = function () {
        if (currentInput && currentInput.tagName === "INPUT") {
            currentInput.value = "";
            currentInput.focus();
            currentInput.dispatchEvent(new Event('input'));
        }
    };


    // フォーカス時に全選択
    document.querySelectorAll('input.yen').forEach(input => {
        input.addEventListener('focus', e => e.target.select());
    });

    document.querySelectorAll('input.cny').forEach(input => {
        input.addEventListener('focus', e => e.target.select());
    });

    // ▼▼▼ 追加：テンキー制御 ▼▼▼
    const keypad = document.createElement('div');
    keypad.id = 'customKeypad';
    keypad.innerHTML = `
        <div class="keypad-row"><button onclick="insertCalc('7')">7</button><button onclick="insertCalc('8')">8</button><button onclick="insertCalc('9')">9</button></div>
        <div class="keypad-row"><button onclick="insertCalc('4')">4</button><button onclick="insertCalc('5')">5</button><button onclick="insertCalc('6')">6</button></div>
        <div class="keypad-row"><button onclick="insertCalc('1')">1</button><button onclick="insertCalc('2')">2</button><button onclick="insertCalc('3')">3</button></div>
        <div class="keypad-row"><button onclick="insertCalc('0')">0</button><button onclick="insertCalc('00')">00</button><button onclick="clearCalc()">C</button></div>
    `;
    keypad.style.display = 'none';
    keypad.className = 'keypad-container';
    document.body.appendChild(keypad);

    let currentInput = null;

    // フォーカス時に入力欄を記憶
    document.querySelectorAll('input.yen, input.cny, #calcInput').forEach(input => {
        input.addEventListener('focusin', e => {
            currentInput = e.target;
            e.target.select();
        });
    });

    // ボタンクリック前に入力欄を保持し続ける
    document.addEventListener('mousedown', e => {
        const active = document.activeElement;
        if (active && active.tagName === "INPUT") {
            currentInput = active;
        }
    });

    window.insertCalc = function (char) {
        if (currentInput && currentInput.tagName === "INPUT") {
            currentInput.value += char;
            currentInput.focus();
            currentInput.dispatchEvent(new Event('input')); // 自動反映
        }
    };

    window.clearCalc = function () {
        if (currentInput && currentInput.tagName === "INPUT") {
            currentInput.value = "";
            currentInput.focus();
            currentInput.dispatchEvent(new Event('input'));
        }
    };

    function showKeypad(input) {
        currentInput = input;
        const rect = input.getBoundingClientRect();
        keypad.style.top = `${rect.bottom + window.scrollY + 5}px`;
        keypad.style.left = `${rect.left + window.scrollX}px`;
        keypad.style.display = 'block';
    }

    function hideKeypad() {
        keypad.style.display = 'none';
        currentInput = null;
    }

    document.addEventListener('focusin', (e) => {
        if (e.target.matches('input.yen, input.cny')) {
            showKeypad(e.target);
        } else if (e.target.id === 'calcInput') {
            hideKeypad(); // 記号付きテンキーが別に存在するならここは分岐
        } else {
            hideKeypad();
        }
    });

    document.addEventListener('click', (e) => {
        if (!keypad.contains(e.target) && !e.target.matches('input.yen, input.cny')) {
            hideKeypad();
        }
    });

    // 初回計算
    calc();
});
