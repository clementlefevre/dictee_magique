<script>
  import { gameEngine } from '$lib/engine/GameEngine.js';

  let { onContinue, onMiniGame } = $props();

  const { score, level, correctCount, questionsTotal, bestStreak, levelStars } = gameEngine;

  let accuracy = $derived(
    $questionsTotal > 0 ? Math.round(($correctCount / $questionsTotal) * 100) : 0
  );

  let stars = $derived($levelStars[$level] || 0);

  let chestOpen = $state(false);

  import { onMount } from 'svelte';
  onMount(() => {
    setTimeout(() => chestOpen = true, 500);
  });

  function starDisplay(n) {
    return '★'.repeat(n) + '☆'.repeat(3 - n);
  }
</script>

<div class="level-complete">
  <!-- Treasure chest -->
  <div class="chest" class:open={chestOpen}>
    <div class="chest-lid">╔══╗</div>
    <div class="chest-body">
      ║{chestOpen ? '✦✦' : '  '}║
    </div>
    <div class="chest-base">╚══╝</div>
  </div>

  <div class="congrats glow-amber">
    ═══ NIVEAU {$level} TERMINÉ ! ═══
  </div>

  <div class="stars-display">
    <span class="stars">{starDisplay(stars)}</span>
  </div>

  <div class="stats-box pixel-border">
    <div class="stat-row glow">
      <span class="stat-label">Bonnes réponses :</span>
      <span class="stat-value">{$correctCount} / {$questionsTotal}</span>
    </div>
    <div class="stat-row glow">
      <span class="stat-label">Précision :</span>
      <span class="stat-value">{accuracy}%</span>
    </div>
    <div class="stat-row glow">
      <span class="stat-label">Meilleure série :</span>
      <span class="stat-value">{$bestStreak} 🔥</span>
    </div>
    <div class="stat-row glow">
      <span class="stat-label">Score total :</span>
      <span class="stat-value glow-amber">{$score}</span>
    </div>
  </div>

  <div class="buttons">
    {#if onMiniGame}
      <button class="btn glow" onclick={onMiniGame}>
        [BONUS GAME ►]
      </button>
    {/if}
    <button class="btn glow" onclick={onContinue}>
      [NIVEAU SUIVANT ►]
    </button>
  </div>
</div>

<style>
  .level-complete {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 40px 20px;
    min-height: 70vh;
    animation: slideUp 0.6s ease-out;
  }

  .chest {
    font-size: var(--font-lg);
    text-align: center;
    line-height: 1;
    transition: transform 0.5s ease;
  }

  .chest.open {
    transform: scale(1.1);
  }

  .chest-lid {
    transition: transform 0.4s ease;
    color: var(--amber);
    text-shadow: 0 0 6px var(--amber-glow);
  }

  .chest.open .chest-lid {
    transform: translateY(-8px) rotateX(-20deg);
  }

  .chest-body {
    color: var(--amber);
    text-shadow: 0 0 6px var(--amber-glow);
  }

  .chest-base {
    color: var(--amber);
    text-shadow: 0 0 6px var(--amber-glow);
  }

  .congrats {
    font-size: var(--font-md);
    text-align: center;
  }

  .stars-display {
    font-size: var(--font-lg);
  }

  .stars {
    color: var(--amber);
    text-shadow: 0 0 8px var(--amber-glow);
    letter-spacing: 8px;
  }

  .stats-box {
    padding: 16px 24px;
    min-width: 300px;
    max-width: 90vw;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    font-size: var(--font-sm);
    padding: 4px 0;
  }

  .stat-label {
    opacity: 0.7;
  }

  .buttons {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 12px;
  }

  .btn {
    font-size: var(--font-sm);
    cursor: pointer;
    padding: 8px 20px;
    border: 1px solid var(--green);
    transition: all 0.2s;
  }

  .btn:hover {
    background: rgba(0, 255, 0, 0.1);
    box-shadow: 0 0 12px var(--green-glow);
  }

  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
