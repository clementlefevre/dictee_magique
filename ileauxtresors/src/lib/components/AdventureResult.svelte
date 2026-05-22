<script>
    let { result, node, onContinue, onRestart } = $props();

    function handleKeydown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            onContinue?.();
        } else if (event.key === "r" || event.key === "R") {
            event.preventDefault();
            onRestart?.();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="result-screen">
    <div class="result-card pixel-border">
        <div class="chest" class:open={result?.success}>▣</div>
        <h1 class="result-title glow">
            {result?.success ? "TRESOR DEBLOQUE" : "MISSION A REJOUER"}
        </h1>
        <div class="node glow-amber">{node?.title}</div>
        <p class="detail">{result?.detail}</p>
        <p class="reward glow">
            +{result?.points ?? 0} points | {node?.reward}
        </p>

        <div class="result-actions">
            <button class="crt-action selected" onclick={onContinue}
                >[ ENTREE: CARTE ]</button
            >
            <button class="crt-action" onclick={onRestart}
                >[ R: REJOUER ]</button
            >
        </div>
    </div>
</div>

<style>
    .result-screen {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 20px;
    }

    .result-card {
        width: min(620px, 100%);
        padding: 24px;
        display: grid;
        justify-items: center;
        gap: 14px;
        text-align: center;
    }

    .chest {
        width: 72px;
        height: 56px;
        display: grid;
        place-items: center;
        border: 2px solid var(--gb-light);
        color: var(--gb-light);
        font-size: var(--font-lg);
        animation: bounce 0.7s step-end infinite;
    }

    .chest.open {
        border-color: var(--gb-lightest);
        color: var(--gb-lightest);
    }

    .result-title {
        font-size: var(--font-md);
    }

    .node,
    .detail,
    .reward,
    .crt-action {
        font-size: var(--font-xs);
        line-height: 1.45;
    }

    .detail {
        color: var(--gameboy-light);
    }

    .result-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
    }

    .crt-action {
        border: 1px solid var(--gb-dark);
        padding: 8px 12px;
        cursor: pointer;
    }

    .crt-action.selected,
    .crt-action:hover {
        border-color: var(--gb-light);
        background: var(--gb-dark);
        color: var(--gb-lightest);
    }
</style>
