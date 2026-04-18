<script>
  import { gameEngine } from '$lib/engine/GameEngine.js';

  const {
    score, level, streakCount, bestStreak,
    questionsRemaining, questionsTotal,
    correctCount, levelStars, levelsCount
  } = gameEngine;

  let prevScore = $state(0);
  let scoreBounce = $state(false);

  // Watch for score changes to trigger bounce
  $effect(() => {
    const s = $score;
    if (s > prevScore) {
      scoreBounce = true;
      setTimeout(() => scoreBounce = false, 300);
    }
    prevScore = s;
  });

  // Calculate progress percentage
  let progress = $derived(
    $questionsTotal > 0
      ? (($questionsTotal - $questionsRemaining) / $questionsTotal) * 100
      : 0
  );

  let answered = $derived($questionsTotal - $questionsRemaining);
</script>

<div class="hud">
  <!-- Score -->
  <div class="hud-row">
    <span class="label glow">SCORE:</span>
    <span class="value glow" class:bounce={scoreBounce}>{$score}</span>
    <span class="hearts">
      {#each Array(Math.min($correctCount, 20)) as _, i}
        <span class="heart" style="animation-delay: {i * 0.05}s">♥</span>
      {/each}
    </span>
  </div>

  <!-- Level & Streak -->
  <div class="hud-row">
    <span class="label glow">LEVEL:</span>
    <span class="value glow">{$level}</span>
    {#if $streakCount >= 3}
      <span class="streak glow-amber">
        🔥 x{$streakCount}
      </span>
    {/if}
  </div>

  <!-- Progress bar -->
  <div class="progress-section">
    <div class="progress-label glow">
      Question {answered}/{$questionsTotal}
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width: {progress}%"></div>
      <div class="progress-char" style="left: {progress}%">▓</div>
    </div>
  </div>
</div>

<style>
  .hud {
    padding: clamp(8px, 1.5vw, 16px) clamp(16px, 3vw, 40px);
    border-bottom: 1px solid rgba(0, 255, 0, 0.2);
  }

  .hud-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--font-md);
    margin-bottom: 4px;
  }

  .label {
    opacity: 0.7;
  }

  .value {
    min-width: 3ch;
  }

  .hearts {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
  }

  .heart {
    color: var(--red);
    text-shadow: 0 0 4px var(--red-glow);
    font-size: var(--font-sm);
    display: inline-block;
  }

  .streak {
    font-size: var(--font-sm);
    margin-left: 12px;
  }

  .progress-section {
    margin-top: 8px;
  }

  .progress-label {
    font-size: var(--font-xs);
    opacity: 0.7;
    margin-bottom: 4px;
  }

  .progress-track {
    position: relative;
    height: 12px;
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    width: 100%;
    max-width: 400px;
  }

  .progress-fill {
    height: 100%;
    background: var(--green);
    opacity: 0.4;
    transition: width 0.3s ease;
  }

  .progress-char {
    position: absolute;
    top: -6px;
    transform: translateX(-50%);
    color: var(--green);
    font-size: var(--font-sm);
    text-shadow: 0 0 6px var(--green-glow);
    transition: left 0.3s ease;
  }

  .bounce {
    animation: bounce 0.3s ease-in-out;
  }

  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.4); }
  }
</style>
