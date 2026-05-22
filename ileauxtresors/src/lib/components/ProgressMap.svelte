<script>
  import { gameEngine } from "$lib/engine/GameEngine.js";

  const { levelStars, level, levelsCount } = gameEngine;

  function starDisplay(count) {
    if (count < 0) return "[?]";
    if (count === 0) return "...";
    return "*".repeat(count) + ".".repeat(3 - count);
  }
</script>

<div class="progress-map">
  <div class="map-title glow">═══ CARTE DES NIVEAUX ═══</div>
  <div class="levels-grid">
    {#each Array(levelsCount) as _, i}
      {@const stars = $levelStars[i]}
      {@const isCurrent = $level === i}
      {@const isLocked = stars === -1}
      <div
        class="level-node"
        class:current={isCurrent}
        class:locked={isLocked}
        class:completed={stars > 0}
      >
        <div class="level-number" class:glow={!isLocked}>
          {isLocked ? "?" : i}
        </div>
        <div class="level-stars">
          {starDisplay(stars)}
        </div>
        {#if i < levelsCount - 1}
          <div class="connector" class:active={!isLocked}>─────</div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .progress-map {
    padding: 12px clamp(16px, 3vw, 40px);
  }

  .map-title {
    font-size: var(--font-xs);
    text-align: center;
    margin-bottom: 12px;
    opacity: 0.7;
  }

  .levels-grid {
    display: flex;
    align-items: center;
    gap: 0;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .level-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    position: relative;
  }

  .level-number {
    width: 36px;
    height: 36px;
    border: 2px solid var(--gb-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-sm);
  }

  .level-node.current .level-number {
    border-color: var(--gb-lightest);
    animation: pulse 1s step-end infinite;
  }

  .level-node.locked .level-number {
    opacity: 0.3;
    color: var(--gb-dark);
  }

  .level-node.completed .level-number {
    border-color: var(--gb-light);
    color: var(--gb-light);
  }

  .level-stars {
    font-size: 10px;
    margin-top: 2px;
    letter-spacing: 1px;
  }

  .level-node.locked .level-stars {
    opacity: 0.3;
  }

  .connector {
    position: absolute;
    right: -38px;
    top: 16px;
    font-size: 10px;
    color: var(--gb-dark);
    white-space: nowrap;
  }

  .connector.active {
    color: var(--gb-light);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>
