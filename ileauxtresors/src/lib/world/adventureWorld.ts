export type ChallengeMode = 'dictee' | 'calcul' | 'logic' | 'qcm';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type TileCode = '~' | 'T' | '.' | '=' | ':' | 'M' | 'H' | 'S';

export type WorldNode = {
    id: string;
    mode: ChallengeMode;
    title: string;
    theme: string;
    reward: string;
    icon: string;
    x: number;
    y: number;
    level?: number;
};

export type PlayerState = {
    x: number;
    y: number;
    facing: Direction;
    walking: boolean;
};

export type MoveResult = {
    player: PlayerState;
    stationIndex: number;
    blocked: boolean;
};

export const WORLD_WIDTH = 10;
export const WORLD_HEIGHT = 7;

export const WORLD_TILES: TileCode[] = [
    '~', '~', '~', 'T', 'T', '.', '.', '=', 'H', 'H',
    '~', '~', '.', '.', 'T', '.', ':', '=', '=', 'H',
    '~', '.', '.', ':', ':', ':', ':', '.', '=', '.',
    'T', '.', ':', 'S', '.', 'S', ':', '.', '.', 'T',
    'T', '.', '.', ':', '~', '~', ':', 'S', 'M', 'M',
    '.', '.', 'S', ':', '~', '~', ':', '.', '.', 'M',
    '.', 'T', 'T', '.', '.', ':', 'S', '.', '.', '.',
];

export function indexFor(x: number, y: number) {
    return (y - 1) * WORLD_WIDTH + (x - 1);
}

export function tileAt(x: number, y: number): TileCode {
    return WORLD_TILES[indexFor(x, y)] ?? '.';
}

export function canWalkTo(x: number, y: number) {
    if (x < 1 || x > WORLD_WIDTH || y < 1 || y > WORLD_HEIGHT) return false;
    return !['~', 'T'].includes(tileAt(x, y));
}

export function stationAt(nodes: WorldNode[], unlockedIndex: number, x: number, y: number) {
    return nodes.findIndex((node, index) => {
        return index <= unlockedIndex && node.x === x && node.y === y;
    });
}

export function createPlayerAtNode(nodes: WorldNode[], selectedIndex: number): PlayerState {
    const node = nodes[selectedIndex] ?? nodes[0];
    return {
        x: node?.x ?? 3,
        y: node?.y ?? 4,
        facing: 'down',
        walking: false
    };
}

export function movePlayer(
    player: PlayerState,
    nodes: WorldNode[],
    unlockedIndex: number,
    dx: number,
    dy: number,
    facing: Direction
): MoveResult {
    const nextX = player.x + dx;
    const nextY = player.y + dy;

    if (!canWalkTo(nextX, nextY)) {
        return {
            player: { ...player, facing, walking: false },
            stationIndex: stationAt(nodes, unlockedIndex, player.x, player.y),
            blocked: true
        };
    }

    const nextPlayer = {
        x: nextX,
        y: nextY,
        facing,
        walking: true
    };

    return {
        player: nextPlayer,
        stationIndex: stationAt(nodes, unlockedIndex, nextX, nextY),
        blocked: false
    };
}

export function directionDelta(direction: Direction) {
    if (direction === 'up') return { dx: 0, dy: -1 };
    if (direction === 'down') return { dx: 0, dy: 1 };
    if (direction === 'left') return { dx: -1, dy: 0 };
    return { dx: 1, dy: 0 };
}
