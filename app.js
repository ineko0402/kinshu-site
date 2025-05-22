document.addEventListener("DOMContentLoaded", () => {
    let mode = "JPY";
    let currentInput = null;
    let virtualKeyboardEnabled = true;

    const jpyRate = {
        yen10000: 10000, yen5000: 5000, yen2000: 2000, yen1000: 1000,
        yen500: 500, yen100: 100, yen50: 50, yen10: 10, yen5: 5, yen1: 1
    };
    const jpyBills = ["yen10000", "yen5000", "yen2000", "yen1000"];
    const jpyCoins = ["yen500", "yen100", "yen50", "yen10", "yen5", "yen1"];

    const cnyRate = {
        cny100: 100, cny50: 50, cny20: 20, cny10: 10, cny5: 5, cny1: 1,
        coin1: 1, coin05: 0.5, coin01: 0.1
    };
    const cnyBills = ["cny100", "cny50", "cny20", "cny10", "cny5", "cny1"];
    const cnyCoins = ["coin1", "coin05", "coin01"];

    const keyboard = new SimpleKeyboard.default({
        onKeyPress: button => handleInput(button),
        layout: {
            default: [
                "7 8 9 ÷",
                "4 5 6 ×",
                "1 2 3 -",
                "0 00 {bksp} +",
                "{left} {right} C 決定"
            ]
        },
        display: {
            "{bksp}": "BS",
            "{left}": "←",
            "{right}": "→"
        },
        theme: "hg-theme-default hg-layout-default",
        container: "#virtualKeyboardContainer"
    });

    const inputs = document.querySelectorAll('input.yen, input.cny, #calcInput');
    inputs.forEach(el => {
        el.readOnly = virtualKeyboardEnabled;

        el.addEventListener('focus', e => {
            if (!virtualKeyboardEnabled) return;
            currentInput = e.target;
            keyboard.setInput(currentInput.value);
        });

        el.addEventListener('input', () => calc());
    });

    document.getElementById("vkToggleBtn").onclick = () => {
        virtualKeyboardEnabled = !virtualKeyboardEnabled;
        inputs.forEach(el => el.readOnly = virtualKeyboardEnabled);

        document.getElementById("vkToggleBtn").textContent =
            `仮想キーボード: ${virtualKeyboardEnabled ? "ON" : "OFF"}`;

        if (!virtualKeyboardEnabled) document.activeElement.blur();
    };

    document.getElementById("clearBtn").onclick = () => {
        inputs.forEach(el => el.value = "0");
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

    setInterval(() => {
        const now = new Date();
        document.getElementById("datetime").textContent = now.toLocaleString();
    }, 1000);

    function calc() {
        let total = 0, bills = 0, coins = 0;
        const rate = mode === "JPY" ? jpyRate : cnyRate;
        const billsList = mode === "JPY" ? jpyBills : cnyBills;
        const coinsList = mode === "JPY" ? jpyCoins : cnyCoins;

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

    window.runCalc = () => {
        const input = document.getElementById("calcInput");
        try {
            const result = Function(`'use strict'; return (${input.value})`)();
            input.value = result.toString();
        } catch {
            alert("式が無効です");
        }
    };

    window.clearCalc = () => {
        const input = document.getElementById("calcInput");
        input.value = "";
    };

    function handleInput(key) {
        if (!currentInput) return;

        const start = currentInput.selectionStart;
        const end = currentInput.selectionEnd;
        let val = currentInput.value;

        if (key === "決定") {
            currentInput.blur();
            return;
        }

        if (key === "C") {
            currentInput.value = "";
            return;
        }

        if (key === "BS" || key === "{bksp}") {
            if (start > 0) {
                currentInput.value = val.slice(0, start - 1) + val.slice(end);
                currentInput.setSelectionRange(start - 1, start - 1);
            }
            return;
        }

        if (key === "←" || key === "{left}") {
            currentInput.setSelectionRange(Math.max(0, start - 1), Math.max(0, start - 1));
            return;
        }

        if (key === "→" || key === "{right}") {
            currentInput.setSelectionRange(Math.min(val.length, start + 1), Math.min(val.length, start + 1));
            return;
        }

        const ops = ["+", "-", "*", "/", "÷", "×"];
        if (ops.includes(key) && currentInput.id !== "calcInput") return;

        let insert = key;
        if (insert === "×") insert = "*";
        if (insert === "÷") insert = "/";

        currentInput.value = val.slice(0, start) + insert + val.slice(end);
        const newPos = start + insert.length;
        currentInput.setSelectionRange(newPos, newPos);
    }

    calc();
});
