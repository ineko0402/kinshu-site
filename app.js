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
     // テキストエリアをフォーカスしたときに全選択状態にする
        document.querySelectorAll("textarea, input[type='text']").forEach(el => {
            el.addEventListener("focus", e => e.target.select());
            el.addEventListener("mouseup", e => {
                e.preventDefault(); // クリックで選択解除されるのを防ぐ
            });
        });
    // 初回計算
    calc();
});
