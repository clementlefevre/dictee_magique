<script>
    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function makeProblem(difficulty = 1) {
        const high = difficulty > 1 ? 149 : 79;
        const op = Math.random() < 0.55 ? "+" : "-";
        const a = rand(18, high);
        const b = op === "+" ? rand(7, high - 10) : rand(3, a - 1);
        return { a, b, op, answer: op === "+" ? a + b : a - b };
    }

    /** 3-element array: index 0=hundreds, 1=tens, 2=ones; empty string for blank */
    function pad3(n) {
        return Math.abs(n)
            .toString()
            .padStart(3, " ")
            .split("")
            .map((c) => (c === " " ? "" : c));
    }

    let { node, onComplete } = $props();

    const difficulty = $derived(node?.level ?? 1);
    let problem = $state(makeProblem(1));
    let feedback = $state("");
    let round = $state(1);
    let correct = $state(0);
    const total = 3;

    let carryDigits = $state(["", "", ""]);
    let answerDigits = $state(["", "", ""]);
    // { row: 'carry'|'answer', col: 0|1|2 } | null
    let selectedCell = $state(null);

    const aDigits = $derived(pad3(problem.a));
    const bDigits = $derived(pad3(problem.b));

    function selectCell(row, col) {
        if (feedback) return;
        selectedCell = { row, col };
    }

    function isSelected(row, col) {
        return selectedCell?.row === row && selectedCell?.col === col;
    }

    function inputDigit(d) {
        if (!selectedCell || feedback) return;
        const { row, col } = selectedCell;
        if (row === "carry") {
            carryDigits = carryDigits.map((v, i) => (i === col ? d : v));
        } else {
            answerDigits = answerDigits.map((v, i) => (i === col ? d : v));
        }
        if (col < 2) selectedCell = { row, col: col + 1 };
    }

    function deleteInCell() {
        if (!selectedCell || feedback) return;
        const { row, col } = selectedCell;
        const arr = row === "carry" ? carryDigits : answerDigits;
        const set =
            row === "carry"
                ? (v) => {
                      carryDigits = v;
                  }
                : (v) => {
                      answerDigits = v;
                  };
        if (arr[col] !== "") {
            set(arr.map((v, i) => (i === col ? "" : v)));
        } else if (col > 0) {
            const prev = col - 1;
            selectedCell = { row, col: prev };
            set(arr.map((v, i) => (i === prev ? "" : v)));
        }
    }

    function submit() {
        if (feedback) {
            next();
            return;
        }
        if (answerDigits.every((d) => d === "")) return;
        const val = parseInt(answerDigits.join("").trim() || "x", 10);
        const ok = val === problem.answer;
        feedback = ok ? "correct" : "wrong";
        if (ok) correct += 1;
        selectedCell = null;
    }

    function next() {
        if (round >= total) {
            onComplete?.({
                success: correct >= 2,
                points: correct * 12,
                detail: `${correct}/${total} operations justes`,
            });
            return;
        }
        round += 1;
        problem = makeProblem(difficulty);
        carryDigits = ["", "", ""];
        answerDigits = ["", "", ""];
        feedback = "";
        selectedCell = null;
    }

    function handleKeydown(event) {
        if (event.target?.tagName === "INPUT") return;
        if (/^[0-9]$/.test(event.key)) {
            event.preventDefault();
            inputDigit(event.key);
        } else if (event.key === "Backspace") {
            event.preventDefault();
            deleteInCell();
        } else if (event.key === "Enter") {
            event.preventDefault();
            submit();
        } else if (event.key === "Tab") {
            event.preventDefault();
            if (!selectedCell) {
                selectedCell = { row: "carry", col: 0 };
                return;
            }
            const { row, col } = selectedCell;
            if (row === "carry") {
                selectedCell =
                    col < 2
                        ? { row: "carry", col: col + 1 }
                        : { row: "answer", col: 0 };
            } else {
                selectedCell =
                    col < 2
                        ? { row: "answer", col: col + 1 }
                        : { row: "carry", col: 0 };
            }
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            if (selectedCell && selectedCell.col < 2)
                selectedCell = { ...selectedCell, col: selectedCell.col + 1 };
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (selectedCell && selectedCell.col > 0)
                selectedCell = { ...selectedCell, col: selectedCell.col - 1 };
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            if (selectedCell?.row === "carry")
                selectedCell = { row: "answer", col: selectedCell.col };
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (selectedCell?.row === "answer")
                selectedCell = { row: "carry", col: selectedCell.col };
        }
    }

    const colLabel = (col) =>
        col === 0 ? "centaines" : col === 1 ? "dizaines" : "unites";
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="challenge-screen">
    <div class="challenge-card pixel-border">
        <div class="challenge-kicker glow-amber">CALCUL EN COLONNES</div>
        <h1 class="challenge-title glow">{node?.title}</h1>
        <div class="round glow">Operation {round}/{total}</div>

        <div
            class="col-grid"
            class:wrong={feedback === "wrong"}
            class:correct={feedback === "correct"}
        >
            <!-- Retenue row -->
            <div class="sign-cell carry-label glow-amber" title="retenue">
                r
            </div>
            {#each [0, 1, 2] as col}
                <button
                    class="input-cell carry-cell"
                    class:selected={isSelected("carry", col)}
                    class:filled={carryDigits[col] !== ""}
                    onclick={() => selectCell("carry", col)}
                    tabindex="-1"
                    title="Retenue {colLabel(col)}">{carryDigits[col]}</button
                >
            {/each}

            <!-- Operand A -->
            <div class="sign-cell"></div>
            {#each [0, 1, 2] as col}
                <div class="num-cell glow">{aDigits[col]}</div>
            {/each}

            <!-- Operand B with operator -->
            <div class="sign-cell op-sign glow-amber">{problem.op}</div>
            {#each [0, 1, 2] as col}
                <div class="num-cell">{bDigits[col]}</div>
            {/each}

            <!-- Separator -->
            <div class="sep-row"></div>

            <!-- Answer row -->
            <div class="sign-cell"></div>
            {#each [0, 1, 2] as col}
                <button
                    class="input-cell answer-cell glow"
                    class:selected={isSelected("answer", col)}
                    class:filled={answerDigits[col] !== ""}
                    onclick={() => selectCell("answer", col)}
                    tabindex="-1"
                    title="Reponse {colLabel(col)}">{answerDigits[col]}</button
                >
            {/each}
        </div>

        {#if feedback === "correct"}
            <p class="message glow">Correct. Le pont tient bon.</p>
        {:else if feedback === "wrong"}
            <p class="message glow-red">
                Reponse: {problem.answer}. On repart plus malin.
            </p>
        {:else if selectedCell}
            <p class="message glow">
                {selectedCell.row === "carry" ? "Retenue" : "Reponse"}
                &mdash; {colLabel(selectedCell.col)}
            </p>
        {:else}
            <p class="message glow">Clique une cellule, tape le chiffre.</p>
        {/if}

        {#if !feedback}
            <div class="numpad">
                {#each [7, 8, 9, 4, 5, 6, 1, 2, 3] as d}
                    <button
                        class="num-btn"
                        onclick={() => inputDigit(d.toString())}>{d}</button
                    >
                {/each}
                <button class="num-btn del-btn" onclick={deleteInCell}
                    >&lt;-</button
                >
                <button class="num-btn" onclick={() => inputDigit("0")}
                    >0</button
                >
                <button class="num-btn ok-btn" onclick={submit}>OK</button>
            </div>
        {:else}
            <div class="numpad">
                <button
                    class="num-btn ok-btn"
                    style="grid-column: 1 / -1;"
                    onclick={next}>SUIVANT →</button
                >
            </div>
        {/if}
    </div>
</div>

<style>
    .challenge-screen {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 20px;
    }

    .challenge-card {
        width: min(480px, 100%);
        padding: 22px;
        display: grid;
        gap: 14px;
        justify-items: center;
    }

    .challenge-kicker,
    .round,
    .message {
        font-size: var(--font-xs);
        text-align: center;
    }

    .challenge-title {
        font-size: var(--font-md);
        text-align: center;
    }

    /* 4-column grid: sign + hundreds + tens + ones */
    .col-grid {
        display: grid;
        grid-template-columns: 30px repeat(3, 54px);
        grid-template-rows: 38px 54px 54px 4px 58px;
        gap: 4px 6px;
        padding: 16px 18px;
        border: 2px solid var(--gb-dark);
        background: var(--gb-darkest);
        align-items: center;
        justify-items: center;
    }

    .col-grid.correct {
        border-color: var(--gb-lightest);
    }
    .col-grid.wrong {
        border-color: var(--gb-dark);
    }

    /* separator line */
    .sep-row {
        grid-column: 1 / -1;
        width: 100%;
        height: 2px;
        background: var(--gb-light);
        align-self: center;
    }

    .sign-cell {
        font-size: var(--font-md);
        line-height: 1;
        justify-self: center;
    }

    .op-sign {
        font-size: var(--font-sm);
    }

    .carry-label {
        font-size: var(--font-xs);
        align-self: center;
    }

    /* static digit cells for operands */
    .num-cell {
        font-size: var(--font-lg);
        line-height: 1;
        width: 54px;
        height: 54px;
        display: grid;
        place-items: center;
        color: var(--gameboy-light);
    }

    .input-cell {
        display: grid;
        place-items: center;
        border: 2px solid var(--gb-dark);
        background: var(--gb-darkest);
        cursor: pointer;
        font-family: inherit;
        color: var(--gb-lightest);
        transition: border-color 0.1s steps(1);
    }

    .input-cell:hover {
        border-color: var(--gb-light);
    }

    .input-cell.selected {
        border-color: var(--gb-lightest);
        background: var(--gb-dark);
        animation: cell-blink 0.7s step-end infinite;
    }

    .input-cell.filled {
        border-color: var(--gb-light);
    }

    @keyframes cell-blink {
        50% {
            background: var(--gb-darkest);
        }
    }

    /* carry cells — smaller */
    .carry-cell {
        width: 34px;
        height: 34px;
        font-size: var(--font-xs);
        color: var(--gb-light);
        border-color: var(--gb-dark);
    }

    .carry-cell.selected {
        border-color: var(--gb-lightest);
    }

    /* answer cells — prominent */
    .answer-cell {
        width: 54px;
        height: 54px;
        font-size: var(--font-lg);
    }

    /* numpad */
    .numpad {
        display: grid;
        grid-template-columns: repeat(3, 52px);
        gap: 8px;
        justify-content: center;
    }

    .num-btn {
        width: 52px;
        height: 52px;
        font-size: var(--font-sm);
        border: 2px solid var(--gb-dark);
        background: var(--gb-darkest);
        color: var(--gb-lightest);
        cursor: pointer;
        font-family: inherit;
    }

    .num-btn:hover {
        background: var(--gb-dark);
        border-color: var(--gb-light);
    }

    .num-btn:active {
        background: var(--gb-light);
        color: var(--gb-darkest);
    }

    .del-btn {
        color: var(--gb-light);
        border-color: var(--gb-dark);
    }

    .ok-btn {
        background: var(--gb-dark);
        border-color: var(--gb-light);
    }

    .ok-btn:hover {
        background: var(--gb-light) !important;
        color: var(--gb-darkest) !important;
    }
</style>
