<script>
  import { gameEngine } from "$lib/engine/GameEngine.js";

  const { mascotMood } = gameEngine;

  const messages = {
    idle: ["...", "♪♫♪", "zzZ", "( ◠‿◠ )"],
    happy: ["Bravo !", "Super !", "Génial !", "Parfait !", "Excellent !"],
    sad: ["Essaie encore !", "Presque !", "Courage !", "Tu peux le faire !"],
    celebrate: ["VICTOIRE !", "CHAMPION !", "INCROYABLE !"],
  };

  let currentMessage = $state("...");
  let prevMood = $state("idle");

  $effect(() => {
    const mood = $mascotMood;
    if (mood !== prevMood) {
      const pool = messages[mood] || messages.idle;
      currentMessage = pool[Math.floor(Math.random() * pool.length)];
      prevMood = mood;
    }
  });
</script>

<div class="mascot-container">
  <!-- Speech bubble -->
  <div class="speech-bubble glow" class:bubble-bounce={$mascotMood === "happy"}>
    <span>{currentMessage}</span>
    <div class="bubble-tail"></div>
  </div>

  <!-- Pixel-art retro computer mascot (CSS-only) -->
  <div
    class="mascot"
    class:bob={$mascotMood === "idle"}
    class:bounce-happy={$mascotMood === "happy"}
    class:shake-sad={$mascotMood === "sad"}
    class:celebrate={$mascotMood === "celebrate"}
  >
    <div class="computer">
      <!-- Monitor -->
      <div class="monitor">
        <div class="screen">
          <div class="face">
            {#if $mascotMood === "happy" || $mascotMood === "celebrate"}
              <span class="eyes">◕ ◕</span>
              <span class="mouth">‿‿‿</span>
            {:else if $mascotMood === "sad"}
              <span class="eyes">◕ ◕</span>
              <span class="mouth sad-mouth">╥</span>
            {:else}
              <span class="eyes">◕ ◕</span>
              <span class="mouth">───</span>
            {/if}
          </div>
        </div>
        <div class="monitor-base"></div>
      </div>
      <!-- Body / keyboard -->
      <div class="keyboard">
        <div class="key-row">
          {#each "░░░░░░░" as _}
            <span class="key">░</span>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .mascot-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px;
  }

  .speech-bubble {
    position: relative;
    background: var(--gb-dark);
    border: 1px solid var(--gb-light);
    padding: 6px 14px;
    font-size: var(--font-xs);
    text-align: center;
    max-width: 160px;
    min-height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gb-lightest);
  }

  .bubble-tail {
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid var(--gb-light);
  }

  .bubble-bounce {
    animation: bubble-pop 0.3s ease-out;
  }

  .mascot {
    transform-origin: bottom center;
  }

  .computer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .monitor {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .screen {
    width: 80px;
    height: 60px;
    border: 3px solid var(--gb-light);
    background: var(--gb-darkest);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .face {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .eyes {
    font-size: 14px;
    letter-spacing: 6px;
    color: var(--gb-lightest);
  }

  .mouth {
    font-size: 12px;
    color: var(--gb-lightest);
  }

  .sad-mouth {
    color: var(--gb-light);
  }

  .monitor-base {
    width: 30px;
    height: 8px;
    background: var(--gb-light);
  }

  .keyboard {
    margin-top: 4px;
  }

  .key-row {
    display: flex;
    gap: 1px;
  }

  .key {
    font-size: 10px;
    color: var(--gb-dark);
    opacity: 0.8;
  }

  /* Animations */
  .bob {
    animation: bob 3s ease-in-out infinite;
  }

  .bounce-happy {
    animation: bounce-happy 0.5s ease-in-out;
  }

  .shake-sad {
    animation: shake-sad 0.5s ease-in-out;
  }

  .celebrate {
    animation: celebrate 1s ease-in-out;
  }

  @keyframes bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }

  @keyframes bounce-happy {
    0% {
      transform: scale(1) translateY(0);
    }
    30% {
      transform: scale(1.1) translateY(-8px);
    }
    60% {
      transform: scale(0.95) translateY(0);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes shake-sad {
    0%,
    100% {
      transform: translateX(0);
    }
    20%,
    60% {
      transform: translateX(-3px);
    }
    40%,
    80% {
      transform: translateX(3px);
    }
  }

  @keyframes celebrate {
    0% {
      transform: scale(1) rotate(0deg);
    }
    25% {
      transform: scale(1.2) rotate(-5deg);
    }
    50% {
      transform: scale(1.2) rotate(5deg);
    }
    75% {
      transform: scale(1.1) rotate(-3deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes bubble-pop {
    0% {
      transform: scale(0.8);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
