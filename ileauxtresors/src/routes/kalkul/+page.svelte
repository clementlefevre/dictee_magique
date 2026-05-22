<script>
    function rand(lo, hi) {
        return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }

    function toDigits(n) {
        return [Math.floor(n / 100), Math.floor((n % 100) / 10), n % 10];
    }

    function makeProblem() {
        const op = Math.random() < 0.5 ? "+" : "−";
        let a, b;
        if (op === "+") {
            a = rand(10, 99);
            b = rand(1, 99);
        } else {
            a = rand(12, 99);
            b = rand(1, a - 1);
        }
        const ans = op === "+" ? a + b : a - b;
        return { a, b, op, ans };
    }

    // Returns [retenue_C, retenue_D, 0].
    // Addition  → retenue = carry produced by that column.
    // Subtraction → retenue = borrow taken FROM that column.
    function computeRetenues(op, dA, dB) {
        const [, dA_d, dA_u] = dA;
        const [, dB_d, dB_u] = dB;
        if (op === "+") {
            const c_D = Math.floor((dA_u + dB_u) / 10);
            const c_C = Math.floor((dA_d + dB_d + c_D) / 10);
            return [c_C, c_D, 0];
        } else {
            const b_D = dA_u < dB_u ? 1 : 0;
            const b_C = dA_d - b_D < dB_d ? 1 : 0;
            return [b_C, b_D, 0];
        }
    }

    let problem = $state(makeProblem());
    let userDigits = $state(["", "", ""]);
    let userRetenues = $state(["", "", ""]);
    let score = $state(0);
    let played = $state(0);
    let streak = $state(0);
    let result = $state("");

    let digA = $derived(toDigits(problem.a));
    let digB = $derived(toDigits(problem.b));
    let digAns = $derived(toDigits(problem.ans));
    let correctRetenues = $derived(computeRetenues(problem.op, digA, digB));

    function isLeadingZero(digs, i) {
        return digs[i] === 0 && digs.slice(0, i).every((d) => d === 0);
    }

    function cellText(digs, i) {
        return isLeadingZero(digs, i) ? "" : String(digs[i]);
    }

    function onRetenueInput(i, e) {
        const digit = e.target.value.replace(/\D/g, "").slice(-1);
        userRetenues[i] = digit;
        if (digit !== "") {
            setTimeout(() => {
                const nxt =
                    i === 0
                        ? document.querySelectorAll(".ret-row input")[1]
                        : document.querySelectorAll(".ans-row input")[0];
                nxt?.focus();
            }, 0);
        }
    }

    function onInput(i, e) {
        const raw = e.target.value;
        const digit = raw.replace(/\D/g, "").slice(-1);
        userDigits[i] = digit;
        if (digit !== "" && i < 2) {
            setTimeout(() => {
                document.querySelectorAll(".ans-row input")[i + 1]?.focus();
            }, 0);
        }
    }

    function check() {
        const ansOk = userDigits.every(
            (v, i) => Number(v || "0") === digAns[i],
        );
        const retOk = [0, 1].every(
            (i) => Number(userRetenues[i] || "0") === correctRetenues[i],
        );
        const correct = ansOk && retOk;
        played++;
        result = correct ? "correct" : "wrong";
        if (correct) {
            score++;
            streak++;
        } else {
            streak = 0;
        }
    }

    function next() {
        problem = makeProblem();
        userDigits = ["", "", ""];
        userRetenues = ["", "", ""];
        result = "";
        setTimeout(() => {
            document.querySelectorAll(".ret-row input")[0]?.focus();
        }, 50);
    }

    function handleKeydown(e) {
        if (e.key === "Enter") {
            if (result === "") check();
            else next();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="kalkul-page">
    <div class="terminal-header glow">
        <pre class="ascii-title">
╔══════════════════════════════════════════╗
║  K A L K U K  —  Calcul en colonnes     ║
╚══════════════════════════════════════════╝</pre>
        <div class="score-display glow-amber">
            SCORE : {score}/{played}{#if streak >= 3}
                &nbsp; ×{streak} 🔥{/if}
        </div>
    </div>

    <div class="terminal-body">
        <table class="calc-table">
            <thead>
                <tr>
                    <th class="th-op"></th>
                    <th class="th-col glow">C</th>
                    <th class="th-col glow">D</th>
                    <th class="th-col glow">U</th>
                </tr>
            </thead>
            <tbody>
                <!-- Retenue / carry row -->
                <tr class="ret-row">
                    <td class="ret-label glow-amber"
                        >{problem.op === "+" ? "carry" : "empr."}</td
                    >
                    {#each [0, 1, 2] as i (i)}
                        {#if i < 2}
                            <td class="ret-cell">
                                <input
                                    class="ret-input"
                                    class:input-ok={result === "correct"}
                                    class:input-ko={result === "wrong" &&
                                        Number(userRetenues[i] || "0") !==
                                            correctRetenues[i]}
                                    type="text"
                                    inputmode="numeric"
                                    maxlength="1"
                                    disabled={result !== ""}
                                    value={userRetenues[i]}
                                    oninput={(e) => onRetenueInput(i, e)}
                                />
                            </td>
                        {:else}
                            <td></td>
                        {/if}
                    {/each}
                </tr>

                <!-- First number -->
                <tr class="num-row">
                    <td class="op-cell"></td>
                    {#each [0, 1, 2] as i (i)}
                        <td
                            class="digit-cell"
                            class:faded={isLeadingZero(digA, i)}
                        >
                            {cellText(digA, i)}
                        </td>
                    {/each}
                </tr>

                <!-- Operator + second number -->
                <tr class="num-row">
                    <td class="op-cell glow-amber">{problem.op}</td>
                    {#each [0, 1, 2] as i (i)}
                        <td
                            class="digit-cell"
                            class:faded={isLeadingZero(digB, i)}
                        >
                            {cellText(digB, i)}
                        </td>
                    {/each}
                </tr>

                <!-- Divider -->
                <tr class="divider-row">
                    <td colspan="4"><div class="divider glow"></div></td>
                </tr>

                <!-- Answer row -->
                <tr class="ans-row">
                    <td class="op-cell glow-amber">=</td>
                    {#each userDigits as val, i (i)}
                        <td class="input-cell">
                            <input
                                class="digit-input"
                                class:input-ok={result === "correct"}
                                class:input-ko={result === "wrong" &&
                                    Number(val || "0") !== digAns[i]}
                                type="text"
                                inputmode="numeric"
                                maxlength="2"
                                disabled={result !== ""}
                                value={val}
                                oninput={(e) => onInput(i, e)}
                            />
                        </td>
                    {/each}
                </tr>
            </tbody>
        </table>

        <!-- Feedback & actions -->
        <div class="actions">
            {#if result === ""}
                <p class="hint-text glow" style="opacity:0.5">
                    [ Remplis chiffre par chiffre — ENTRÉE pour valider ]
                </p>
                <button class="crt-btn" onclick={check}>[ VÉRIFIER ]</button>
            {:else if result === "correct"}
                <p class="msg msg-correct glow">✓ CORRECT !</p>
                <button class="crt-btn" onclick={next}>[ SUIVANT → ]</button>
            {:else}
                <p class="msg msg-wrong glow-red">✗ RÉPONSE : {problem.ans}</p>
                <button class="crt-btn" onclick={next}>[ RÉESSAYER ]</button>
            {/if}
        </div>
    </div>

    <a href="/" class="back-link glow-amber">[ ← RETOUR AU JEU ]</a>
</div>

<style>
    /* ── Layout ──────────────────────────────────── */
    .kalkul-page {
        --cell: 72px;
        width: 100%;
        height: 100vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
        padding: 20px;
        font-family: "Px437", monospace;
        color: var(--gb-lightest);
        background: var(--gb-darkest);
    }

    /* ── Header ──────────────────────────────────── */
    .terminal-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 100%;
        max-width: 480px;
    }

    .ascii-title {
        font-size: var(--font-xs);
        line-height: 1.3;
        white-space: pre;
        text-align: left;
    }

    .score-display {
        font-size: var(--font-sm);
        letter-spacing: 0.08em;
    }

    /* ── Terminal body ───────────────────────────── */
    .terminal-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        border: 2px solid var(--gb-light);
        padding: 24px 32px;
        width: 100%;
        max-width: 480px;
    }

    /* ── Calc table ──────────────────────────────── */
    .calc-table {
        border-collapse: separate;
        border-spacing: 8px;
    }

    .th-op {
        width: 48px;
    }
    .th-col {
        width: var(--cell);
        text-align: center;
        padding-bottom: 8px;
        font-size: var(--font-xs);
        border-bottom: 1px solid var(--gb-light);
        letter-spacing: 0.15em;
    }

    /* Number rows */
    .digit-cell {
        width: var(--cell);
        height: var(--cell);
        text-align: center;
        vertical-align: middle;
        font-size: var(--font-md);
        border: 1px solid var(--gb-dark);
        padding: 0 4px;
        background: var(--gb-darkest);
    }
    .digit-cell.faded {
        border-color: transparent;
        background: transparent;
        color: transparent;
    }

    .op-cell {
        text-align: center;
        vertical-align: middle;
        font-size: var(--font-md);
        padding: 0 4px;
        width: 48px;
    }

    /* Divider */
    .divider-row td {
        padding: 4px 0;
    }
    .divider {
        height: 2px;
        background: var(--gb-light);
    }

    /* ── Retenue row ─────────────────────────────── */
    .ret-row td {
        vertical-align: middle;
        padding: 2px 4px;
    }

    .ret-label {
        font-size: 0.65rem;
        text-align: right;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        white-space: nowrap;
    }

    .ret-cell {
        text-align: center;
    }

    .ret-input {
        width: 48px;
        height: 48px;
        font-size: var(--font-sm);
        font-family: "Px437", monospace;
        text-align: center;
        border: 1px dashed var(--gb-light);
        background: var(--gb-darkest);
        color: var(--gb-light);
        outline: none;
        caret-color: var(--gb-light);
        -moz-appearance: textfield;
    }
    .ret-input::-webkit-outer-spin-button,
    .ret-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
    }
    .ret-input:focus {
        border-style: solid;
        border-color: var(--gb-lightest);
    }
    .ret-input.input-ok {
        border-style: solid;
        border-color: var(--gb-lightest);
        color: var(--gb-lightest);
        background: var(--gb-dark);
    }
    .ret-input.input-ko {
        border-style: solid;
        border-color: var(--gb-dark);
        color: var(--gb-light);
        background: var(--gb-darkest);
    }
    .ret-input:disabled {
        cursor: default;
        opacity: 0.8;
    }

    /* ── Answer inputs ───────────────────────────── */
    .ans-row td {
        vertical-align: middle;
        padding: 0 4px;
    }

    .digit-input {
        width: var(--cell);
        height: var(--cell);
        font-size: var(--font-md);
        font-family: "Px437", monospace;
        text-align: center;
        border: 2px solid var(--gb-dark);
        background: var(--gb-darkest);
        color: var(--gb-lightest);
        outline: none;
        caret-color: var(--gb-lightest);
        -moz-appearance: textfield;
    }
    .digit-input::-webkit-outer-spin-button,
    .digit-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
    }
    .digit-input:focus {
        border-color: var(--gb-lightest);
    }
    .digit-input.input-ok {
        border-color: var(--gb-lightest);
        background: var(--gb-dark);
    }
    .digit-input.input-ko {
        border-color: var(--gb-dark);
        color: var(--gb-light);
    }
    .digit-input:disabled {
        cursor: default;
        opacity: 0.8;
    }

    /* ── Actions ─────────────────────────────────── */
    .actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        min-height: 90px;
        justify-content: center;
        width: 100%;
    }

    .hint-text {
        font-size: var(--font-xs);
        text-align: center;
    }

    .crt-btn {
        font-size: var(--font-sm);
        cursor: pointer;
        padding: 10px 28px;
        border: 2px solid var(--gb-light);
        color: var(--gb-lightest);
        background: var(--gb-darkest);
        font-family: "Px437", monospace;
        letter-spacing: 0.05em;
    }
    .crt-btn:hover {
        background: var(--gb-dark);
        border-color: var(--gb-lightest);
    }
    .crt-btn:active {
        opacity: 0.7;
    }

    /* ── Messages ────────────────────────────────── */
    .msg {
        font-size: var(--font-sm);
        text-align: center;
        letter-spacing: 0.05em;
        animation: pop 0.2s ease-out;
    }

    @keyframes pop {
        from {
            transform: scale(0.85);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }

    /* ── Back link ───────────────────────────────── */
    .back-link {
        font-size: var(--font-xs);
        text-decoration: none;
        letter-spacing: 0.05em;
        opacity: 0.7;
        transition: opacity 0.15s;
    }
    .back-link:hover {
        opacity: 1;
    }

    /* ── Responsive ──────────────────────────────── */
    @media (max-width: 380px) {
        .kalkul-page {
            --cell: 58px;
        }
        .terminal-body {
            padding: 16px;
        }
    }
</style>
