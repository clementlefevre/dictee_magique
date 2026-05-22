<script lang="ts">
    import { CHALLENGE_MODES } from "$lib/data/adventure";
    import {
        WORLD_TILES,
        WORLD_WIDTH,
        createPlayerAtNode,
        directionDelta,
        movePlayer,
        stationAt,
        type Direction,
        type PlayerState,
        type TileCode,
        type WorldNode,
    } from "$lib/world/adventureWorld";

    type Props = {
        nodes?: WorldNode[];
        currentIndex?: number;
        unlockedIndex?: number;
        selectedIndex?: number;
        onSelect?: (index: number) => void;
        onEnter?: () => void;
    };

    let {
        nodes = [],
        currentIndex = 0,
        unlockedIndex = 0,
        selectedIndex = 0,
        onSelect,
        onEnter,
    }: Props = $props();

    const modeLabels: Record<WorldNode["mode"], string> = {
        [CHALLENGE_MODES.DICTEE]: "DICTEE",
        [CHALLENGE_MODES.CALCUL]: "CALCUL",
        [CHALLENGE_MODES.LOGIC]: "LOGIQUE",
        [CHALLENGE_MODES.QCM]: "QUIZ",
    };

    let player = $state<PlayerState>({
        x: 4,
        y: 4,
        facing: "down",
        walking: false,
    });
    let initialized = $state(false);
    let walkTimer: number | null = null;

    const selected = $derived(nodes[selectedIndex]);
    const selectedStation = $derived(
        stationAt(nodes, unlockedIndex, player.x, player.y),
    );

    function isUnlocked(index: number) {
        return index <= unlockedIndex;
    }

    // Sprite sheet: Tiny 16 Basic by Lanea Zimmerman (Sharm) — CC-BY 3.0
    // https://opengameart.org/content/tiny-16-basic
    const SPRITE_SCALE = 3;
    const TILE_PX = 16 * SPRITE_SCALE; // 48px per displayed tile

    const tilePos: Record<TileCode, [number, number]> = {
        ".": [3, 1], // bright grass
        "~": [5, 1], // water
        T: [4, 1], // dark forest
        "=": [1, 0], // stone path
        ":": [0, 1], // dirt path
        M: [2, 6], // dark stone / castle
        H: [4, 0], // red brick / house
        S: [2, 1], // sand / station ground
    };

    function tileBg(tile: TileCode): string {
        const [c, r] = tilePos[tile] ?? [0, 0];
        const bw = 128 * SPRITE_SCALE;
        const bh = 240 * SPRITE_SCALE;
        return `background-image:url('/sprites/basictiles.png');background-size:${bw}px ${bh}px;background-position:${-(c * TILE_PX)}px ${-(r * TILE_PX)}px;`;
    }

    const heroDirRow: Record<Direction, number> = {
        down: 0,
        left: 1,
        right: 2,
        up: 3,
    };

    function heroBg(facing: Direction): string {
        const r = heroDirRow[facing];
        const bw = 192 * SPRITE_SCALE;
        const bh = 128 * SPRITE_SCALE;
        // col 1 = standing frame for each direction
        return `background-image:url('/sprites/characters.png');background-size:${bw}px ${bh}px;background-position:-${TILE_PX}px -${r * TILE_PX}px;`;
    }

    function markWalkFinished() {
        if (walkTimer !== null) window.clearTimeout(walkTimer);
        walkTimer = window.setTimeout(() => {
            player = { ...player, walking: false };
            walkTimer = null;
        }, 140);
    }

    function moveHero(direction: Direction) {
        const { dx, dy } = directionDelta(direction);
        const result = movePlayer(
            player,
            nodes,
            unlockedIndex,
            dx,
            dy,
            direction,
        );
        player = result.player;
        markWalkFinished();

        if (result.stationIndex >= 0) {
            onSelect?.(result.stationIndex);
        }
    }

    function jumpToStation(index: number) {
        const node = nodes[index];
        if (!node || !isUnlocked(index)) return;

        player = {
            x: node.x,
            y: node.y,
            facing: "down",
            walking: false,
        };
        onSelect?.(index);
    }

    function enterStation() {
        const stationIndex = stationAt(
            nodes,
            unlockedIndex,
            player.x,
            player.y,
        );
        if (stationIndex < 0) return;
        onSelect?.(stationIndex);
        onEnter?.();
    }

    function clickStation(index: number) {
        const node = nodes[index];
        if (!node || !isUnlocked(index)) return;
        if (player.x === node.x && player.y === node.y) {
            onSelect?.(index);
            onEnter?.();
        } else {
            player = { x: node.x, y: node.y, facing: "down", walking: false };
            onSelect?.(index);
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if ((event.target as HTMLElement)?.tagName === "INPUT") return;
        if (event.key === "ArrowUp") {
            event.preventDefault();
            moveHero("up");
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            moveHero("down");
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveHero("left");
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            moveHero("right");
        } else if (event.key === "Enter") {
            event.preventDefault();
            enterStation();
        }
    }

    $effect(() => {
        if (!initialized && nodes[selectedIndex]) {
            player = createPlayerAtNode(nodes, selectedIndex);
            initialized = true;
        }
    });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="overworld">
    <div class="map-frame pixel-border">
        <div class="map-title glow-amber">ILE AUX TRESORS - AVENTURE 2D</div>

        <div class="world-grid" style="--world-width: {WORLD_WIDTH};">
            {#each WORLD_TILES as tile, index}
                <div
                    class="terrain-cell"
                    class:station-ground={tile === "S"}
                    style="grid-column: {(index % WORLD_WIDTH) +
                        1}; grid-row: {Math.floor(index / WORLD_WIDTH) +
                        1}; {tileBg(tile)}"
                ></div>
            {/each}

            {#each nodes as node, index (node.id)}
                <button
                    class="station-node glow"
                    class:selected={selectedIndex === index}
                    class:current={currentIndex === index}
                    class:locked={!isUnlocked(index)}
                    class:active-station={node.x === player.x &&
                        node.y === player.y}
                    style="grid-column: {node.x}; grid-row: {node.y};"
                    disabled={!isUnlocked(index)}
                    onclick={() => clickStation(index)}
                    aria-label={node.title}
                >
                    <span class="station-sign">!</span>
                    <span class="station-icon"
                        >{isUnlocked(index) ? node.icon : "?"}</span
                    >
                </button>
            {/each}

            <div
                class="hero-token"
                class:walking={player.walking}
                style="grid-column: {player.x}; grid-row: {player.y}; {heroBg(
                    player.facing,
                )}"
                aria-label="Aventurier"
            ></div>
        </div>
    </div>

    {#if selected}
        <aside class="node-panel pixel-border">
            <div class="mini-inventory glow">
                PV [###] | POS [{player.x},{player.y}] | STATION [{selectedStation >=
                0
                    ? "OK"
                    : "--"}]
            </div>
            <div class="node-mode glow-amber">{modeLabels[selected.mode]}</div>
            <h1 class="node-title glow">{selected.title}</h1>
            <p class="node-theme">{selected.theme}</p>
            <p class="node-reward glow">Tresor: {selected.reward}</p>
            <p class="node-keys glow">
                FLECHES / clic = se deplacer | ENTREE = entrer
            </p>
            {#if selectedStation >= 0}
                <button
                    class="enter-btn glow pixel-border"
                    onclick={enterStation}
                >
                    [ ENTRER → ]
                </button>
            {:else}
                <p class="walk-hint glow-amber">
                    Marche sur une borne ! pour lancer une epreuve.
                </p>
            {/if}
        </aside>
    {/if}
</div>

<style>
    .overworld {
        min-height: 100%;
        display: grid;
        grid-template-columns: minmax(420px, 1.25fr) minmax(260px, 0.75fr);
        gap: 18px;
        align-items: center;
        padding: clamp(16px, 3vw, 36px);
    }

    .map-frame {
        padding: 18px;
        background: linear-gradient(
            180deg,
            rgba(139, 172, 15, 0.08),
            rgba(48, 98, 48, 0.08)
        );
    }

    .map-title {
        font-size: var(--font-xs);
        margin-bottom: 14px;
        text-align: center;
    }

    .world-grid {
        position: relative;
        display: grid;
        grid-template-columns: repeat(10, 48px);
        grid-template-rows: repeat(7, 48px);
        gap: 0;
    }

    .terrain-cell {
        width: 48px;
        height: 48px;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    }

    .terrain-cell.station-ground {
        box-shadow: inset 0 0 8px rgba(255, 176, 0, 0.45);
    }

    .station-node {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
    }

    .station-node {
        position: relative;
        z-index: 2;
        border: 2px solid var(--green-dim);
        background: rgba(15, 56, 15, 0.58);
        cursor: pointer;
        overflow: visible;
    }

    .station-node::before {
        content: "";
        position: absolute;
        inset: 6px;
        border: 1px solid rgba(255, 176, 0, 0.55);
        background: rgba(255, 176, 0, 0.08);
    }

    .station-node.selected,
    .station-node.active-station {
        border-color: var(--amber);
        color: var(--amber);
        box-shadow: 0 0 12px var(--amber-glow);
    }

    .station-node.locked {
        opacity: 0.35;
        cursor: default;
    }

    .station-sign {
        position: absolute;
        top: -16px;
        right: 5px;
        width: 20px;
        height: 20px;
        display: grid;
        place-items: center;
        border: 2px solid var(--amber);
        background: var(--bg);
        color: var(--amber);
        font-size: 14px;
        z-index: 3;
    }

    .station-icon {
        position: relative;
        z-index: 4;
        font-size: var(--font-sm);
    }

    .hero-token {
        width: 48px;
        height: 48px;
        position: relative;
        z-index: 5;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        filter: drop-shadow(0 0 4px rgba(255, 176, 0, 0.7));
        pointer-events: none;
    }

    .hero-token.walking {
        animation: hero-bob 0.28s steps(2) infinite;
    }

    @keyframes hero-bob {
        0% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-3px);
        }
        100% {
            transform: translateY(0px);
        }
    }

    .hero-token.facing-up .hero-hat {
        background: var(--gameboy-light);
    }

    .hero-token.facing-left {
        transform: translateY(-4px) scaleX(-1);
    }

    .hero-token.facing-right {
        transform: translateY(-4px) scaleX(1);
    }

    .node-panel {
        padding: 18px;
        display: grid;
        gap: 12px;
        align-content: start;
    }

    .node-mode,
    .node-reward,
    .node-keys,
    .node-theme,
    .walk-hint,
    .mini-inventory {
        font-size: var(--font-xs);
        line-height: 1.45;
    }

    .node-title {
        font-size: var(--font-md);
        line-height: 1.2;
    }

    .node-theme {
        color: var(--gameboy-light);
    }

    @keyframes hero-step {
        0%,
        100% {
            margin-top: 0;
        }
        50% {
            margin-top: -5px;
        }
    }

    .enter-btn {
        width: 100%;
        padding: 10px;
        font-size: var(--font-xs);
        background: rgba(15, 56, 15, 0.55);
        cursor: pointer;
        color: var(--green);
        font-family: inherit;
        text-align: center;
    }

    .enter-btn:hover {
        background: rgba(139, 172, 15, 0.3);
        border-color: var(--green);
    }

    @media (max-width: 760px) {
        .overworld {
            grid-template-columns: 1fr;
            align-items: start;
        }

        .world-grid {
            min-height: 300px;
            grid-template-columns: repeat(
                var(--world-width),
                minmax(24px, 1fr)
            );
            grid-auto-rows: minmax(30px, 1fr);
            gap: 3px;
        }

        .hero-token {
            transform: translateY(-4px) scale(0.82);
        }
    }
</style>
