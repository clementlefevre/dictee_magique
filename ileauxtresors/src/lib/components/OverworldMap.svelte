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
    // Unlocked station at player position (>= 0 = can enter)
    const selectedStation = $derived(
        stationAt(nodes, unlockedIndex, player.x, player.y),
    );
    // Any station at player position regardless of lock state
    const anyStationHere = $derived(
        nodes.findIndex((n) => n.x === player.x && n.y === player.y),
    );

    function isUnlocked(index: number) {
        return index <= unlockedIndex;
    }

    // ── Canvas / rendering ────────────────────────────────────────────────────
    // DMG Game Boy specs: 160x144 internal resolution, 8x8 tiles, 4-color palette.
    // Authentic top-down renderer in the style of Link's Awakening / Pokemon RB.
    // Pre-rendered tile bitmaps cached in an offscreen ImageData buffer so each
    // frame is a fast blit + sprites + HUD.

    const W = 160;
    const H = 144;
    const TILE = 16; // on-screen tile size (2 GB hardware tiles = 16x16)
    const VIEW_TW = 10; // 160 / 16
    const VIEW_TH = 8; // 144 / 16 = 9, top row reserved for HUD

    // DMG Game Boy 4-color palette
    const PD = [0x0f, 0x38, 0x0f] as const; // darkest
    const PM = [0x30, 0x62, 0x30] as const; // dark
    const PL = [0x8b, 0xac, 0x0f] as const; // light
    const PH = [0x9b, 0xbc, 0x0f] as const; // lightest

    type Shade = 0 | 1 | 2 | 3; // 0=lightest, 3=darkest
    const SHADES: Record<Shade, readonly number[]> = {
        0: PH,
        1: PL,
        2: PM,
        3: PD,
    };

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let imgData: ImageData;
    let buf: Uint8ClampedArray;
    let rafId: number;
    let frame = 0;

    // ── 16x16 tile patterns (Shade index 0..3) ───────────────────────────────
    // Hand-authored to evoke Link's Awakening / Pokemon GB tile art.
    // Each pattern is a 16x16 array of shade indices.
    type Tile = readonly Shade[];

    function makeTile(
        fn: (x: number, y: number, frame: number) => Shade,
        f = 0,
    ): Tile {
        const out: Shade[] = new Array(TILE * TILE);
        for (let y = 0; y < TILE; y++)
            for (let x = 0; x < TILE; x++) out[y * TILE + x] = fn(x, y, f);
        return out;
    }

    // Grass: dotted with darker tufts
    const TILE_GRASS = makeTile((x, y) => {
        // Sparse tuft pattern
        if ((x === 3 && y === 4) || (x === 11 && y === 9)) return 2;
        if ((x === 4 && y === 4) || (x === 12 && y === 9)) return 2;
        if ((x === 3 && y === 5) || (x === 11 && y === 10)) return 1;
        if ((x === 8 && y === 2) || (x === 1 && y === 12)) return 2;
        if ((x === 14 && y === 6) || (x === 6 && y === 14)) return 1;
        return 0; // lightest base
    });

    // Forest: dense tree canopy block with trunk
    const TILE_FOREST = makeTile((x, y) => {
        // Outer ring darker (canopy edge)
        const cx = x - 7.5,
            cy = y - 6;
        const r = Math.sqrt(cx * cx + cy * cy);
        if (y > 12 && x >= 6 && x <= 9) return 3; // trunk
        if (r < 3) return 1; // canopy highlight
        if (r < 5.5) return 2;
        if (r < 7) return 3;
        return 0; // grass around
    });

    // Water: animated horizontal wave bands
    function tileWater(f: number): Tile {
        const phase = (f >> 3) & 3;
        return makeTile((x, y) => {
            const band = (y + phase) & 3;
            if (band === 0) return 1;
            if (band === 2) return 3;
            // Ripple highlight
            if (band === 1 && ((x + phase) & 7) === 0) return 0;
            return 2;
        });
    }

    // Dirt path: lightest with stippled border
    const TILE_PATH = makeTile((x, y) => {
        // Subtle stipple
        if (((x * 7 + y * 13) & 15) === 0) return 1;
        return 0;
    });

    // Stone road: brick pattern
    const TILE_ROAD = makeTile((x, y) => {
        // Horizontal mortar lines every 8 rows, vertical offset per row band
        const row = (y / 8) | 0;
        const off = row * 4;
        if (y === 0 || y === 8) return 3; // mortar
        if (((x + off) & 7) === 0) return 3; // vertical mortar
        return 1; // brick fill
    });

    // House: roof + wall + door
    const TILE_HOUSE = makeTile((x, y) => {
        if (y < 2) return 0; // grass on top
        if (y < 7) {
            // Roof triangle
            const half = 7 - y;
            if (x < 7 - half || x > 8 + half) return 0;
            if (y === 2) return 3;
            return 2;
        }
        if (y === 7) return 3; // eave
        if (y > 7 && (x < 2 || x > 13)) return 0;
        if (y === 15) return 3; // ground line
        // Door
        if (x >= 6 && x <= 9 && y >= 11) return 3;
        // Windows
        if ((x === 4 || x === 11) && y === 9) return 3;
        return 1; // wall
    });

    // Castle: crenelated wall
    const TILE_CASTLE = makeTile((x, y) => {
        if (y < 3) {
            // Crenellations
            return ((x >> 1) & 1) === 0 ? 3 : 0;
        }
        if (y === 3) return 3;
        if (y > 13) return 3;
        // Stone blocks
        const row = ((y - 4) / 3) | 0;
        const off = (row & 1) * 4;
        if ((y - 4) % 3 === 2) return 3;
        if (((x + off) & 7) === 0) return 3;
        // Door
        if (x >= 6 && x <= 9 && y >= 10) return 2;
        return 2;
    });

    // Station: signpost / waypoint marker with pulsing star (animated)
    function tileStation(
        f: number,
        unlocked: boolean,
        selected: boolean,
    ): Tile {
        const pulse = ((f >> 2) & 7) < 4;
        return makeTile((x, y) => {
            // Base: dirt path
            if (((x * 7 + y * 13) & 15) === 0) return 1;
            // Post in center
            if (x >= 7 && x <= 8 && y >= 8 && y <= 14) return 3;
            // Sign board
            if (y >= 3 && y <= 7 && x >= 3 && x <= 12) {
                if (y === 3 || y === 7 || x === 3 || x === 12) return 3;
                if (!unlocked) {
                    // "?" glyph
                    if ((x === 7 || x === 8) && (y === 4 || y === 6)) return 3;
                    if (y === 5 && x >= 6 && x <= 9) return 3;
                    return 2;
                }
                // Star or flag
                const sx = x - 7.5,
                    sy = y - 5;
                const sr = Math.abs(sx) + Math.abs(sy);
                if (selected && pulse && sr < 2.5) return 0;
                if (sr < 2) return selected ? 0 : 1;
                return selected ? 1 : 2;
            }
            return 0;
        });
    }

    // Tile cache (built once for static tiles)
    const STATIC_TILES: Partial<Record<TileCode, Tile>> = {
        ".": TILE_GRASS,
        T: TILE_FOREST,
        ":": TILE_PATH,
        "=": TILE_ROAD,
        H: TILE_HOUSE,
        M: TILE_CASTLE,
    };

    // ── Camera ───────────────────────────────────────────────────────────────
    // Top-down view, camera follows the player. World is WORLD_WIDTH x WORLD_HEIGHT
    // logical tiles; each logical tile is one 16x16 on-screen tile.
    function getCamera() {
        // Camera in pixel space, centered on player.
        // Node/player coords are 1-based so tile pixel origin = (x-1)*TILE.
        const pxX = (player.x - 1) * TILE + TILE / 2;
        const pxY = (player.y - 1) * TILE + TILE / 2;
        let camX = pxX - W / 2;
        let camY = pxY - H / 2 + 6; // shift up 6px to leave HUD room
        // Clamp to world bounds
        const maxX = WORLD_WIDTH * TILE - W;
        const maxY = WORLD_HEIGHT * TILE - (H - 11 - 20); // HUD top 11, bottom 20
        camX = Math.max(-TILE, Math.min(maxX + TILE, camX));
        camY = Math.max(-TILE, Math.min(maxY + TILE, camY));
        return { camX, camY };
    }

    // Write one pixel into the ImageData buffer (strict palette only)
    function px(x: number, y: number, c: readonly number[]) {
        if (x < 0 || x >= W || y < 0 || y >= H) return;
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

    // ── Top-down tile renderer ───────────────────────────────────────────────
    // Blit a 16x16 tile into the framebuffer at (dx, dy) in screen space.
    function blitTile(dx: number, dy: number, tile: Tile) {
        for (let y = 0; y < TILE; y++) {
            const sy = dy + y;
            if (sy < 0 || sy >= H) continue;
            for (let x = 0; x < TILE; x++) {
                const sx = dx + x;
                if (sx < 0 || sx >= W) continue;
                const shade = tile[y * TILE + x];
                const c = SHADES[shade];
                const i = (sy * W + sx) << 2;
                buf[i] = c[0];
                buf[i + 1] = c[1];
                buf[i + 2] = c[2];
                buf[i + 3] = 0xff;
            }
        }
    }

    // Out-of-bounds backdrop tile: animated water
    function getOOBTile(): Tile {
        return tileWater(frame);
    }

    // Determine which station index occupies world tile (tx, ty), if any.
    function stationIndexAt(tx: number, ty: number): number {
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            if (n.x === tx && n.y === ty) return i;
        }
        return -1;
    }

    function renderWorld(camX: number, camY: number) {
        // Determine tile range to draw
        const startTX = Math.floor(camX / TILE);
        const startTY = Math.floor(camY / TILE);
        const endTX = startTX + Math.ceil(W / TILE) + 1;
        const endTY = startTY + Math.ceil(H / TILE) + 1;

        const waterTile = tileWater(frame);

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                const dx = tx * TILE - camX;
                const dy = ty * TILE - camY;

                // World tile coords are 1-based
                const wx = tx + 1;
                const wy = ty + 1;
                let tile: Tile;

                if (wx < 1 || wy < 1 || wx > WORLD_WIDTH || wy > WORLD_HEIGHT) {
                    tile = waterTile;
                } else {
                    const code = getTile(wx, wy);
                    if (code === "~") {
                        tile = waterTile;
                    } else if (code === "S") {
                        const idx = stationIndexAt(wx, wy);
                        const unlocked = idx >= 0 && isUnlocked(idx);
                        const selected = idx === selectedIndex;
                        tile = tileStation(frame, unlocked, selected);
                    } else {
                        tile = STATIC_TILES[code] ?? TILE_GRASS;
                    }
                }
                blitTile(dx, dy, tile);
            }
        }
    }

    // ── Sprites ──────────────────────────────────────────────────────────────
    // 16x16 player sprite with simple walk animation (2 frames).
    // Shade index per pixel; 4 = transparent.
    type SprPx = 0 | 1 | 2 | 3 | 4;

    function makePlayerSprite(
        facing: Direction,
        step: 0 | 1,
    ): readonly SprPx[] {
        // Build a 16x16 sprite procedurally.  Body uses shade 1 (light),
        // outline shade 3 (darkest), face details shade 2.
        const a: SprPx[] = new Array(16 * 16).fill(4);
        const set = (x: number, y: number, s: SprPx) => {
            if (x >= 0 && x < 16 && y >= 0 && y < 16) a[y * 16 + x] = s;
        };
        const rect = (
            x0: number,
            y0: number,
            x1: number,
            y1: number,
            s: SprPx,
        ) => {
            for (let y = y0; y <= y1; y++)
                for (let x = x0; x <= x1; x++) set(x, y, s);
        };
        const outline = (x0: number, y0: number, x1: number, y1: number) => {
            for (let x = x0; x <= x1; x++) {
                set(x, y0, 3);
                set(x, y1, 3);
            }
            for (let y = y0; y <= y1; y++) {
                set(x0, y, 3);
                set(x1, y, 3);
            }
        };

        // Head (4..11, 1..6)
        rect(5, 2, 10, 6, 1);
        outline(4, 1, 11, 7);
        // Hair / hat top
        rect(5, 1, 10, 2, 3);
        // Eyes (vary by facing)
        if (facing === "down") {
            set(6, 4, 3);
            set(9, 4, 3);
        } else if (facing === "up") {
            // Back of head, no eyes
            rect(5, 4, 10, 5, 3);
        } else if (facing === "left") {
            set(5, 4, 3);
            set(6, 4, 3);
        } else {
            set(9, 4, 3);
            set(10, 4, 3);
        }

        // Body / tunic (4..11, 8..12)
        rect(4, 8, 11, 12, 2);
        outline(3, 7, 12, 13);
        // Belt
        rect(4, 12, 11, 12, 3);

        // Arms swing
        const armOffset = step === 0 ? 0 : 1;
        if (facing === "left" || facing === "right") {
            rect(3, 9 + armOffset, 3, 11 + armOffset, 2);
            rect(12, 9 - armOffset, 12, 11 - armOffset, 2);
        } else {
            rect(3, 9, 3, 11 + armOffset, 2);
            rect(12, 9, 12, 11 - armOffset, 2);
        }

        // Legs (5..6 left, 9..10 right) with walking offset
        const lOff = step === 0 ? 0 : 1;
        const rOff = step === 0 ? 1 : 0;
        rect(5, 13, 6, 15 - lOff, 3);
        rect(9, 13, 10, 15 - rOff, 3);

        return a;
    }

    function drawSprite16(dx: number, dy: number, spr: readonly SprPx[]) {
        for (let y = 0; y < 16; y++) {
            const sy = dy + y;
            if (sy < 0 || sy >= H) continue;
            for (let x = 0; x < 16; x++) {
                const sx = dx + x;
                if (sx < 0 || sx >= W) continue;
                const s = spr[y * 16 + x];
                if (s === 4) continue;
                const c = SHADES[s as Shade];
                const i = (sy * W + sx) << 2;
                buf[i] = c[0];
                buf[i + 1] = c[1];
                buf[i + 2] = c[2];
                buf[i + 3] = 0xff;
            }
        }
    }

    function renderPlayer(camX: number, camY: number) {
        // Walk step alternates every 8 frames while walking
        const step: 0 | 1 = player.walking && (frame >> 3) & 1 ? 1 : 0;
        const spr = makePlayerSprite(player.facing, step);
        // Coords are 1-based: tile pixel origin = (x-1)*TILE
        const dx = (player.x - 1) * TILE - camX;
        const dy = (player.y - 1) * TILE - camY;
        // Drop shadow under feet
        for (let x = 2; x < 14; x++) {
            const sx = dx + x;
            const sy = dy + 15;
            if ((x + sy) & 1) px(sx, sy, PD);
        }
        drawSprite16(dx, dy, spr);
    }

    // ── Main render ───────────────────────────────────────────────────────────
    function renderFrame() {
        const { camX, camY } = getCamera();

        renderWorld(camX, camY);
        renderPlayer(camX, camY);

        // Commit pixel buffer to canvas
        ctx.putImageData(imgData, 0, 0);

        // HUD text overlay
        renderHUD();

        frame++;
    }

    function renderHUD() {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Title bar
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

        if (selectedStation >= 0 && frame % 40 < 26) {
            ctx.fillStyle = "#9bbc0f";
            ctx.fillText("[ENTER]", W - 50, barY + 6);
        } else if (anyStationHere >= 0 && selectedStation < 0) {
            // Locked station — show feedback
            ctx.fillStyle = "#306230";
            ctx.fillText("VERROUILLE", W - 65, barY + 6);
        }

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
        if (result.stationIndex >= 0) {
            onSelect?.(result.stationIndex);
            // Auto-enter: walking onto an unlocked station starts the challenge
            onEnter?.();
        }
    }

    function enterStation() {
        const idx = stationAt(nodes, unlockedIndex, player.x, player.y);
        console.log("[OverworldMap] enterStation", {
            idx,
            px: player.x,
            py: player.y,
            unlockedIndex,
            nodesLen: nodes.length,
        });
        if (idx < 0) {
            if (anyStationHere >= 0)
                console.log(
                    "[OverworldMap] station is LOCKED (index",
                    anyStationHere,
                    "> unlockedIndex",
                    unlockedIndex,
                    ")",
                );
            return;
        }
        onSelect?.(idx);
        onEnter?.();
    }

    function handleKeydown(event: KeyboardEvent) {
        const tag = (event.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
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
        } else if (event.key === "Enter" || event.key === " ") {
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
                type="button"
                tabindex="-1"
                class="dpad-btn dpad-up"
                onpointerdown={() => startMove("up")}
                onpointerup={stopMove}
                onpointerleave={stopMove}>▲</button
            >
            <button
                type="button"
                tabindex="-1"
                class="dpad-btn dpad-left"
                onpointerdown={() => startMove("left")}
                onpointerup={stopMove}
                onpointerleave={stopMove}>◄</button
            >
            <button
                type="button"
                tabindex="-1"
                class="dpad-btn dpad-right"
                onpointerdown={() => startMove("right")}
                onpointerup={stopMove}
                onpointerleave={stopMove}>►</button
            >
            <button
                type="button"
                tabindex="-1"
                class="dpad-btn dpad-down"
                onpointerdown={() => startMove("down")}
                onpointerup={stopMove}
                onpointerleave={stopMove}>▼</button
            >
        </div>

        <!-- Action button (bottom-right) — enter station -->
        <button
            type="button"
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
