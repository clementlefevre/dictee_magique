<script>
    let { hasSave = false, onStart, onContinue, onReset } = $props();

    const entries = $derived([
        ...(hasSave
            ? [
                  {
                      id: "continue",
                      label: "CONTINUER L AVENTURE",
                      action: onContinue,
                  },
              ]
            : []),
        { id: "new", label: "NOUVELLE PARTIE", action: onStart },
        ...(hasSave
            ? [{ id: "reset", label: "EFFACER LA SAUVEGARDE", action: onReset }]
            : []),
    ]);

    let selected = $state(0);

    function activate() {
        entries[selected]?.action?.();
    }

    function handleKeydown(event) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            selected = (selected + 1) % entries.length;
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            selected = (selected - 1 + entries.length) % entries.length;
        } else if (event.key === "Enter") {
            event.preventDefault();
            activate();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="start-screen">
    <section class="adventure-shell pixel-border">
        <div class="title-block">
            <div class="cart-label glow-amber">CARTOUCHE CRT-BOY</div>
            <h1 class="game-title glow">ILE AUX TRESORS</h1>
            <div class="subtitle glow">
                Aventure clavier: mots, calculs, logique et quiz dans un monde a
                sauver.
            </div>
        </div>

        <div class="hero-scene" aria-hidden="true">
            <div class="scene-hud glow">
                <span>PV [###]</span>
                <span>SAC [CLE][GRAINE]</span>
            </div>
            <div class="scene-grid">
                <span class="tile water">~</span><span class="tile water"
                    >~</span
                ><span class="tile tree">T</span><span class="tile tree">T</span
                ><span class="tile road">=</span><span class="tile road">=</span
                ><span class="tile house">H</span><span class="tile house"
                    >H</span
                >
                <span class="tile water">~</span><span class="tile grass"
                    >.</span
                ><span class="tile tree">T</span><span class="tile grass"
                    >.</span
                ><span class="tile road">=</span><span class="tile car">C</span
                ><span class="tile house">H</span><span class="tile grass"
                    >.</span
                >
                <span class="tile grass">.</span><span class="tile grass"
                    >.</span
                ><span class="tile hero">A</span><span class="tile path">:</span
                ><span class="tile path">:</span><span class="tile smoke"
                    >!</span
                ><span class="tile animal">K</span><span class="tile grass"
                    >.</span
                >
                <span class="tile tree">T</span><span class="tile grass">.</span
                ><span class="tile path">:</span><span class="tile chest"
                    >X</span
                ><span class="tile path">:</span><span class="tile grass"
                    >.</span
                ><span class="tile animal">A</span><span class="tile tree"
                    >T</span
                >
                <span class="tile tree">T</span><span class="tile grass">.</span
                ><span class="tile grass">.</span><span class="tile path"
                    >:</span
                ><span class="tile water">~</span><span class="tile water"
                    >~</span
                ><span class="tile castle">M</span><span class="tile castle"
                    >M</span
                >
            </div>
        </div>

        <div class="mascot-bubble glow">
            ROBOT-CRT: "Capitaine, l ile est ouverte. Le village tousse, la
            foret attend, et le chateau garde le grand quiz."
        </div>
    </section>

    <div class="menu pixel-border" role="menu" aria-label="Menu principal">
        {#each entries as entry, index (entry.id)}
            <button
                class="menu-row glow"
                class:selected={selected === index}
                onclick={() => {
                    selected = index;
                    activate();
                }}
            >
                <span>{selected === index ? ">" : " "}</span>
                <span>{entry.label}</span>
            </button>
        {/each}
    </div>

    <div class="start-hint glow">
        FLECHES = choisir | ENTREE = valider | zero souris requis
    </div>

    <div class="start-hint glow-amber">
        A = aventurier | C = voiture | K/A = animaux | X = coffre
    </div>
</div>

<style>
    .start-screen {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
        padding: 20px;
        text-align: center;
    }

    .adventure-shell {
        width: min(920px, 100%);
        padding: 18px;
        background: rgba(139, 172, 15, 0.08);
        display: grid;
        grid-template-columns: minmax(260px, 0.8fr) minmax(320px, 1.2fr);
        gap: 18px;
        align-items: center;
    }

    .cart-label {
        font-size: var(--font-xs);
        margin-bottom: 8px;
    }

    .title-block {
        display: grid;
        gap: 10px;
        text-align: left;
    }

    .game-title {
        font-size: clamp(32px, 6vw, 72px);
        line-height: 0.95;
        letter-spacing: 0;
    }

    .subtitle {
        font-size: var(--font-xs);
        line-height: 1.45;
    }

    .mascot-bubble,
    .start-hint {
        font-size: var(--font-xs);
        line-height: 1.45;
        max-width: 620px;
    }

    .mascot-bubble {
        color: var(--gameboy-light);
        grid-column: 1 / -1;
    }

    .hero-scene {
        border: 2px solid var(--green);
        background: var(--gameboy-dark);
        box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.35);
        padding: 8px;
    }

    .scene-hud {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 11px;
    }

    .scene-grid {
        display: grid;
        grid-template-columns: repeat(8, minmax(28px, 1fr));
        gap: 3px;
    }

    .tile {
        aspect-ratio: 1;
        min-height: 28px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(155, 188, 15, 0.28);
        font-size: var(--font-xs);
        color: var(--gameboy-light);
        background: rgba(139, 172, 15, 0.1);
    }

    .grass {
        background: rgba(139, 172, 15, 0.14);
    }
    .tree {
        background: rgba(15, 56, 15, 0.95);
    }
    .water {
        background: rgba(48, 98, 48, 0.82);
    }
    .road {
        background: rgba(155, 188, 15, 0.18);
        color: var(--amber);
    }
    .path {
        background: rgba(139, 172, 15, 0.24);
    }
    .house,
    .castle {
        color: var(--amber);
        border-color: var(--amber);
    }
    .hero {
        color: var(--bg);
        background: var(--amber);
        animation: bounce 1s ease-in-out infinite;
    }
    .car,
    .smoke {
        color: var(--red);
    }
    .animal,
    .chest {
        color: var(--amber);
    }

    .menu {
        width: min(520px, 100%);
        padding: 10px;
        display: grid;
        gap: 6px;
    }

    .menu-row {
        width: 100%;
        min-height: 42px;
        display: grid;
        grid-template-columns: 2ch 1fr;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border: 1px solid transparent;
        font-size: var(--font-xs);
        text-align: left;
        cursor: pointer;
    }

    .menu-row.selected,
    .menu-row:hover {
        border-color: var(--green);
        background: rgba(15, 56, 15, 0.45);
        color: var(--gameboy-light);
    }

    @media (max-width: 760px) {
        .adventure-shell {
            grid-template-columns: 1fr;
        }

        .title-block {
            text-align: center;
        }
    }
</style>
