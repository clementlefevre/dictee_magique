<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { CHALLENGE_MODES } from "$lib/data/adventure";
    import {
        WORLD_TILES,
        WORLD_WIDTH,
        WORLD_HEIGHT,
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

    // ── Player state ─────────────────────────────────────────────────────────
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

    // ── Canvas / rendering ────────────────────────────────────────────────────
    // DMG Game Boy specs: 160x144 internal resolution, 4-color palette only.
    // Rendering uses Mode-7 style affine floor projection (no external engines).

    const W = 160;
    const H = 144;

    // DMG Game Boy 4-color palette (RGBA tuples for ImageData)
    const PD = [0x0f, 0x38, 0x0f] as const; // darkest  #0f380f
    const PM = [0x30, 0x62, 0x30] as const; // dark     #306230
    const PL = [0x8b, 0xac, 0x0f] as const; // light    #8bac0f
    const PH = [0x9b, 0xbc, 0x0f] as const; // lightest #9bbc0f

    // Horizon y-coordinate (separates sky from floor)
    const HORIZON = 48;

    // Camera: fixed south of the map, follows player X
    const CAM_Y = WORLD_HEIGHT + 2.5; // 9.5 — always south of the 1..7 grid
    const CAM_H = 1.8; // camera height above ground plane
    const FOV = 0.85; // half-width field of view factor

    // Tile visual colors: [close palette, far palette]
    const TILE_PAL: Record<TileCode, [typeof PD, typeof PD]> = {
        ".": [PH, PL], // grass:       lightest / light
        "~": [PM, PD], // water:       dark / darkest
        T: [PD, PD], // forest:      solid darkest
        "=": [PL, PM], // stone road:  light / dark
        ":": [PH, PL], // dirt path:   lightest / light
        M: [PM, PD], // castle:      dark / darkest
        H: [PL, PM], // house:       light / dark
        S: [PH, PH], // station:     solid lightest (stands out)
    };

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let imgData: ImageData;
    let buf: Uint8ClampedArray;
    let rafId: number;
    let frame = 0;

    // Write one pixel into the ImageData buffer (strict palette only)
    function px(x: number, y: number, c: readonly number[]) {
        const i = (y * W + x) << 2;
        buf[i] = c[0];
        buf[i + 1] = c[1];
        buf[i + 2] = c[2];
        buf[i + 3] = 0xff;
    }

    function getTile(tx: number, ty: number): TileCode {
        if (tx < 1 || ty < 1 || tx > WORLD_WIDTH || ty > WORLD_HEIGHT)
            return "~";
        return (WORLD_TILES[(ty - 1) * WORLD_WIDTH + (tx - 1)] ??
            "~") as TileCode;
    }

    // ── Mode-7 affine floor projection ───────────────────────────────────────
    // For each scanline y > HORIZON, compute the world row distance and sweep
    // across all 160 columns, sampling the tile grid.  Depth is encoded as a
    // 4-level checkerboard dither so no intermediate colors are introduced.
    function renderFloor(camX: number) {
        const floorRows = H - HORIZON; // pixel rows below horizon

        for (let sy = HORIZON; sy < H; sy++) {
            const dy = sy - HORIZON; // pixels below horizon
            // World distance: close rows → small dist, far rows → large dist
            const dist = (CAM_H * floorRows) / dy;
            const worldY = CAM_Y - dist; // world row (north of camera)

            // World X extent for this scanline
            const wxLeft = camX - dist * FOV;
            const stepX = (2 * dist * FOV) / W;

            // Depth [0=far, 1=close] drives dither threshold
            const depth = dy / floorRows;

            for (let sx = 0; sx < W; sx++) {
                const wx = wxLeft + sx * stepX;
                const tile = getTile(Math.floor(wx), Math.floor(worldY));
                const [cClose, cFar] = TILE_PAL[tile];

                // 4-shade depth dithering via checkerboard — no anti-aliasing
                let c: readonly number[];
                const odd = (sx + sy) & 1;
                if (depth < 0.18) c = PD;
                else if (depth < 0.4) c = odd ? PD : PM;
                else if (depth < 0.65) c = odd ? PM : cFar;
                else c = odd ? cFar : cClose;

                px(sx, sy, c);
            }
        }
    }

    // ── Sky + horizon ─────────────────────────────────────────────────────────
    function renderSky() {
        for (let sy = 0; sy < HORIZON; sy++) {
            // Gradient: darkest at top, bleeds into dark near horizon
            const c = sy < HORIZON - 5 ? PD : PM;
            for (let sx = 0; sx < W; sx++) px(sx, sy, c);
        }
        // Bright horizon line
        for (let sx = 0; sx < W; sx++) px(sx, HORIZON - 1, PL);
    }

    // ── Project world position onto screen ───────────────────────────────────
    function project(
        wx: number,
        wy: number,
        camX: number,
    ): [number, number] | null {
        const dist = CAM_Y - wy;
        if (dist <= 0.02) return null;
        const sy = HORIZON + (CAM_H * (H - HORIZON)) / dist;
        const sx = W / 2 + ((wx - camX) / (dist * FOV)) * (W / 2);
        if (sx < 0 || sx >= W || sy < HORIZON || sy >= H) return null;
        return [Math.round(sx), Math.round(sy)];
    }

    // ── Draw a sprite at (cx, cy) from an 8-bit-per-row bitmask array ─────────
    // cx/cy is the bottom-centre anchor point of the sprite.
    function drawSprite(
        cx: number,
        cy: number,
        rows: readonly number[],
        color: readonly number[],
    ) {
        const h = rows.length;
        for (let row = 0; row < h; row++) {
            const bits = rows[row];
            for (let col = 0; col < 8; col++) {
                if (!((bits >> (7 - col)) & 1)) continue;
                const sx = cx - 4 + col;
                const sy = cy - h + 1 + row;
                if (sx >= 0 && sx < W && sy >= HORIZON && sy < H)
                    px(sx, sy, color);
            }
        }
    }

    // 8-column sprites (bitmask per row, MSB = leftmost pixel)
    // Player: simple humanoid silhouette
    const SPR_PLAYER = [
        0b00111100, // head
        0b01111110,
        0b01011010, // face
        0b00111100,
        0b01111110, // body
        0b00100100, // legs
        0b01000010,
    ] as const;

    // Station marker: bold "!" post
    const SPR_STATION = [
        0b00111000, 0b00111000, 0b00111000, 0b00000000, 0b00111000,
    ] as const;

    // Locked station: "?"
    const SPR_LOCKED = [
        0b01110000, 0b10001000, 0b00010000, 0b00100000, 0b00100000,
    ] as const;

    // ── Render stations ───────────────────────────────────────────────────────
    function renderStations(camX: number) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const unlocked = isUnlocked(i);
            const isSel = i === selectedIndex;
            const pos = project(node.x + 0.5, node.y + 0.5, camX);
            if (!pos) continue;
            const [sx, sy] = pos;

            if (!unlocked) {
                drawSprite(sx, sy, SPR_LOCKED, PM);
                continue;
            }
            // Blink selected station at ~2 Hz
            if (isSel && frame % 24 >= 14) continue;
            drawSprite(sx, sy, SPR_STATION, isSel ? PH : PL);
        }
    }

    // ── Render player sprite ──────────────────────────────────────────────────
    function renderPlayer(camX: number) {
        const pos = project(player.x + 0.5, player.y + 0.5, camX);
        if (!pos) return;
        const [sx, sy] = pos;
        drawSprite(sx, sy, SPR_PLAYER, PH);
        // Drop shadow (1 row below, 3 pixels wide)
        for (let dx = -1; dx <= 1; dx++) {
            const bx = sx + dx;
            if (bx >= 0 && bx < W && sy + 1 < H) px(bx, sy + 1, PD);
        }
    }

    // ── Main render ───────────────────────────────────────────────────────────
    function renderFrame() {
        // Camera X follows player, clamped to keep map edges in view
        const camX = Math.max(3, Math.min(WORLD_WIDTH - 2, player.x + 0.5));

        // 1. Sky (writes rows 0..HORIZON-1)
        renderSky();
        // 2. Mode-7 floor (writes rows HORIZON..H-1)
        renderFloor(camX);
        // 3. Stations on floor
        renderStations(camX);
        // 4. Player sprite on floor
        renderPlayer(camX);

        // Commit pixel buffer to canvas
        ctx.putImageData(imgData, 0, 0);

        // 5. HUD text overlay — drawn via ctx so Px437 CSS font is used at full clarity.
        //    The canvas is scaled up 3× by CSS; text drawn here is at 160×144 scale.
        renderHUD();

        frame++;
    }

    function renderHUD() {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Title bar (overdraws top of sky)
        ctx.fillStyle = "#0f380f";
        ctx.fillRect(0, 0, W, 11);
        ctx.fillStyle = "#8bac0f";
        ctx.fillRect(0, 10, W, 1);
        ctx.font = "bold 7px Px437, monospace";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#9bbc0f";
        ctx.fillText("ILE AUX TRESORS", 2, 2);

        // Bottom info bar
        const barY = H - 20;
        ctx.fillStyle = "#0f380f";
        ctx.fillRect(0, barY, W, 20);
        ctx.fillStyle = "#306230";
        ctx.fillRect(0, barY, W, 1);

        if (selected) {
            ctx.fillStyle = "#9bbc0f";
            ctx.fillText(
                selected.title.toUpperCase().substring(0, 20),
                2,
                barY + 2,
            );
            ctx.fillStyle = "#8bac0f";
            ctx.fillText(modeLabels[selected.mode] ?? "", 2, barY + 11);
        }

        // ENTER prompt blinks when on a station
        if (selectedStation >= 0 && frame % 40 < 26) {
            ctx.fillStyle = "#9bbc0f";
            ctx.fillText("[ENTER]", W - 50, barY + 6);
        }

        // Player world coords (top-right corner, dim)
        ctx.fillStyle = "#306230";
        ctx.fillText(`${player.x},${player.y}`, W - 20, 2);

        ctx.restore();
    }

    function loop() {
        renderFrame();
        rafId = requestAnimationFrame(loop);
    }

    // ── Input handling ────────────────────────────────────────────────────────
    function markWalkFinished() {
        if (walkTimer !== null) clearTimeout(walkTimer);
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
        if (result.stationIndex >= 0) onSelect?.(result.stationIndex);
    }

    function enterStation() {
        const idx = stationAt(nodes, unlockedIndex, player.x, player.y);
        if (idx < 0) return;
        onSelect?.(idx);
        onEnter?.();
    }

    function handleKeydown(event: KeyboardEvent) {
        if ((event.target as HTMLElement)?.tagName === "INPUT") return;
        const dirs: Record<string, Direction> = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
        };
        const dir = dirs[event.key];
        if (dir) {
            event.preventDefault();
            moveHero(dir);
        } else if (event.key === "Enter") {
            event.preventDefault();
            enterStation();
        }
    }

    // ── Touch / pointer controls ──────────────────────────────────────────────
    // startMove fires immediately and auto-repeats while held; stopMove cancels.
    let touchRepeat: number | null = null;

    function startMove(dir: Direction) {
        moveHero(dir);
        if (touchRepeat !== null) clearInterval(touchRepeat);
        touchRepeat = window.setInterval(() => moveHero(dir), 200);
    }

    function stopMove() {
        if (touchRepeat !== null) {
            clearInterval(touchRepeat);
            touchRepeat = null;
        }
    }

    $effect(() => {
        if (!initialized && nodes[selectedIndex]) {
            player = createPlayerAtNode(nodes, selectedIndex);
            initialized = true;
        }
    });

    onMount(() => {
        ctx = canvas.getContext("2d")!;
        imgData = ctx.createImageData(W, H);
        buf = imgData.data;
        loop();
    });

    onDestroy(() => {
        if (rafId) cancelAnimationFrame(rafId);
        if (walkTimer !== null) clearTimeout(walkTimer);
        if (touchRepeat !== null) clearInterval(touchRepeat);
    });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="overworld">
    <div class="screen-wrap">
        <canvas
            bind:this={canvas}
            width={160}
            height={144}
            class="gb-screen pixel-border"
        ></canvas>

        <!-- Touch D-pad (bottom-left) -->
        <div class="dpad" aria-hidden="true">
            <button
                class="dpad-btn dpad-up"
                onpointerdown={() => startMove("up")}
                onpointerup={stopMove}
                onpointerleave={stopMove}>▲</button
            >
            <button
                class="dpad-btn dpad-left"
                onpointerdown={() => startMove("left")}
                onpointerup={stopMove}
                onpointerleave={stopMove}>◄</button
            >
            <button
                class="dpad-btn dpad-right"
                onpointerdown={() => startMove("right")}
                onpointerup={stopMove}
                onpointerleave={stopMove}>►</button
            >
            <button
                class="dpad-btn dpad-down"
                onpointerdown={() => startMove("down")}
                onpointerup={stopMove}
                onpointerleave={stopMove}>▼</button
            >
        </div>

        <!-- Action button (bottom-right) — enter station -->
        <button
            class="action-btn"
            onclick={enterStation}
            aria-label="Entrer dans la borne">OK</button
        >
    </div>
</div>

<style>
    /* Fill the remaining viewport below the top HUD bar */
    .overworld {
        flex: 1;
        min-height: 0;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--gb-darkest);
        overflow: hidden;
    }

    .screen-wrap {
        position: relative;
        line-height: 0;
    }

    /*
     * Scale the 160×144 canvas to fill the available viewport.
     * Portrait  → constrained by width  (100vw wins).
     * Landscape → constrained by height (100vh - HUD wins).
     */
    .gb-screen {
        display: block;
        width: min(100vw, calc((100vh - 56px) * 160 / 144));
        height: auto;
        aspect-ratio: 160 / 144;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    }

    /* ── Touch D-pad (bottom-left of canvas) ─────────────────────────────── */
    .dpad {
        position: absolute;
        bottom: 16%;
        left: 3%;
        width: 22%;
        min-width: 76px;
        max-width: 110px;
        aspect-ratio: 1;
        display: grid;
        grid-template-areas:
            ". up ."
            "left . right"
            ". down .";
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;
        touch-action: none;
        pointer-events: none;
        opacity: 0.72;
    }

    .dpad-btn {
        pointer-events: auto;
        background: var(--gb-darkest);
        color: var(--gb-lightest);
        border: 1px solid var(--gb-dark);
        font-size: 11px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
    }

    .dpad-btn:active {
        background: var(--gb-dark);
    }

    .dpad-up {
        grid-area: up;
    }
    .dpad-left {
        grid-area: left;
    }
    .dpad-right {
        grid-area: right;
    }
    .dpad-down {
        grid-area: down;
    }

    /* ── Action button (bottom-right of canvas) ──────────────────────────── */
    .action-btn {
        position: absolute;
        bottom: 16%;
        right: 3%;
        width: 13%;
        min-width: 48px;
        max-width: 68px;
        aspect-ratio: 1;
        border-radius: 50%;
        background: var(--gb-darkest);
        color: var(--gb-lightest);
        border: 2px solid var(--gb-dark);
        font-size: 11px;
        font-family: inherit;
        font-weight: bold;
        cursor: pointer;
        opacity: 0.72;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
    }

    .action-btn:active {
        background: var(--gb-dark);
    }
</style>
