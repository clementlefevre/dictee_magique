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

    let { node, onComplete } = $props();

    const difficulty = $derived(node?.level ?? 1);
    let problem = $state(makeProblem(1));
    let answer = $state("");
    let feedback = $state("");
    let round = $state(1);
    let correct = $state(0);
    const total = 3;

    function submit() {
        if (feedback) return next();
        if (!answer.trim()) return;

        const ok = Number(answer) === problem.answer;
        feedback = ok ? "correct" : "wrong";
        if (ok) correct += 1;
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
        answer = "";
        feedback = "";
    }

    function handleKeydown(event) {
        if (/^[0-9]$/.test(event.key)) {
            event.preventDefault();
            if (!feedback && answer.length < 4) answer += event.key;
        } else if (event.key === "Backspace") {
            event.preventDefault();
            if (!feedback) answer = answer.slice(0, -1);
        } else if (event.key === "Enter") {
            event.preventDefault();
            submit();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="challenge-screen">
    <div class="challenge-card pixel-border">
        <div class="challenge-kicker glow-amber">CALCUL EN COLONNES MINI</div>
        <h1 class="challenge-title glow">{node?.title}</h1>
        <div class="round glow">Operation {round}/{total}</div>

        <div
            class="sum-box"
            class:wrong={feedback === "wrong"}
            class:correct={feedback === "correct"}
        >
            <div class="number">{problem.a}</div>
            <div class="number op">{problem.op} {problem.b}</div>
            <div class="line"></div>
            <div class="answer glow">{answer || "___"}</div>
        </div>

        {#if feedback === "correct"}
            <p class="message glow">Correct. Le pont tient bon.</p>
        {:else if feedback === "wrong"}
            <p class="message glow-red">
                Reponse: {problem.answer}. On repart plus malin.
            </p>
        {:else}
            <p class="message glow">
                Tape le resultat au clavier, puis ENTREE.
            </p>
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
        width: min(560px, 100%);
        padding: 22px;
        display: grid;
        gap: 16px;
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

    .sum-box {
        width: min(280px, 90vw);
        padding: 18px 30px;
        border: 2px solid var(--green-dim);
        background: rgba(15, 56, 15, 0.25);
        text-align: right;
    }

    .sum-box.correct {
        border-color: var(--green);
    }

    .sum-box.wrong {
        border-color: var(--red);
    }

    .number,
    .answer {
        font-size: var(--font-lg);
        line-height: 1.1;
    }

    .op {
        color: var(--amber);
    }

    .line {
        height: 2px;
        margin: 8px 0;
        background: var(--green);
    }
</style>
