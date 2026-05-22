<script>
    let { node, challenges = [], label = "QUESTION", onComplete } = $props();

    const challenge = $derived(
        challenges[Math.abs((node?.id ?? "").length) % challenges.length] ??
            challenges[0],
    );
    let selected = $state(0);
    let answered = $state(false);
    let isCorrect = $state(false);

    function submit() {
        if (!challenge) return;

        if (answered) {
            onComplete?.({
                success: isCorrect,
                points: isCorrect ? 30 : 10,
                detail: challenge.explanation,
            });
            return;
        }

        answered = true;
        isCorrect = selected === challenge.answer;
    }

    function handleKeydown(event) {
        if (!challenge) return;

        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            event.preventDefault();
            if (!answered) selected = (selected + 1) % challenge.options.length;
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            event.preventDefault();
            if (!answered)
                selected =
                    (selected - 1 + challenge.options.length) %
                    challenge.options.length;
        } else if (event.key === "Enter") {
            event.preventDefault();
            submit();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="choice-screen">
    <div class="choice-card pixel-border">
        <div class="choice-kicker glow-amber">{label}</div>
        <h1 class="choice-title glow">{node?.title}</h1>

        {#if challenge}
            <p class="prompt glow">{challenge.prompt}</p>

            <div class="choices" role="listbox" aria-label={label}>
                {#each challenge.options as option, index}
                    <button
                        class="choice-row glow"
                        class:selected={selected === index}
                        class:correct={answered && index === challenge.answer}
                        class:wrong={answered &&
                            selected === index &&
                            selected !== challenge.answer}
                        onclick={() => {
                            if (!answered) selected = index;
                            submit();
                        }}
                    >
                        <span>{selected === index ? ">" : " "}</span>
                        <span>{option}</span>
                    </button>
                {/each}
            </div>

            {#if answered}
                <p
                    class="explanation"
                    class:ok={isCorrect}
                    class:ko={!isCorrect}
                >
                    {challenge.explanation}
                </p>
                <p class="keys glow">ENTREE = continuer</p>
            {:else}
                <p class="keys glow">FLECHES = choisir | ENTREE = valider</p>
            {/if}
        {/if}
    </div>
</div>

<style>
    .choice-screen {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 20px;
    }

    .choice-card {
        width: min(720px, 100%);
        padding: 22px;
        display: grid;
        gap: 16px;
    }

    .choice-kicker,
    .keys,
    .explanation {
        font-size: var(--font-xs);
        line-height: 1.45;
    }

    .choice-title {
        font-size: var(--font-md);
        line-height: 1.2;
    }

    .prompt {
        font-size: var(--font-sm);
        line-height: 1.35;
        color: var(--gameboy-light);
    }

    .choices {
        display: grid;
        gap: 8px;
    }

    .choice-row {
        min-height: 44px;
        display: grid;
        grid-template-columns: 2ch 1fr;
        gap: 8px;
        align-items: center;
        padding: 8px 10px;
        border: 1px solid var(--gb-dark);
        text-align: left;
        font-size: var(--font-xs);
        cursor: pointer;
    }

    .choice-row.selected {
        border-color: var(--gb-lightest);
        color: var(--gb-lightest);
    }

    .choice-row.correct {
        border-color: var(--gb-light);
        background: var(--gb-dark);
    }

    .choice-row.wrong,
    .explanation.ko {
        color: var(--gb-dark);
        background: var(--gb-darkest);
    }

    .explanation.ok {
        color: var(--gb-lightest);
    }
</style>
