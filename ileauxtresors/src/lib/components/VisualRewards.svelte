<script>
  import { onMount } from "svelte";
  import { gameEngine } from "$lib/engine/GameEngine.js";

  const { lastAnswerCorrect, streakCount } = gameEngine;

  let canvas;
  let confettiModule;

  onMount(async () => {
    const mod = await import("canvas-confetti");
    confettiModule = mod.default;
  });

  function fireConfetti() {
    if (!confettiModule) return;
    confettiModule({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#9bbc0f", "#8bac0f", "#306230", "#0f380f"],
      disableForReducedMotion: true,
    });
  }

  function fireStars() {
    if (!confettiModule) return;
    confettiModule({
      particleCount: 20,
      spread: 100,
      shapes: ["star"],
      colors: ["#9bbc0f", "#8bac0f", "#306230"],
      origin: { y: 0.5 },
      disableForReducedMotion: true,
    });
  }

  function fireBigCelebration() {
    if (!confettiModule) return;
    const duration = 2000;
    const end = Date.now() + duration;
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confettiModule({
        particleCount: 30,
        spread: 120,
        origin: { x: Math.random(), y: Math.random() * 0.6 },
        colors: ["#9bbc0f", "#8bac0f", "#306230", "#0f380f"],
        disableForReducedMotion: true,
      });
    }, 250);
  }

  let prevStreak = $state(0);

  $effect(() => {
    const result = $lastAnswerCorrect;
    if (result === true) {
      fireConfetti();
    }
  });

  $effect(() => {
    const streak = $streakCount;
    if (streak >= 5 && streak > prevStreak && streak % 5 === 0) {
      fireStars();
    }
    prevStreak = streak;
  });

  // Export celebration for external use (level complete)
  export function celebrate() {
    fireBigCelebration();
  }
</script>

<!-- Visual flash overlay -->
{#if $lastAnswerCorrect === true}
  <div class="correct-flash"></div>
{/if}

<style>
  .correct-flash {
    position: fixed;
    inset: 0;
    background: var(--gb-dark);
    pointer-events: none;
    z-index: 999;
    animation: fade-flash 0.35s steps(3) forwards;
  }

  @keyframes fade-flash {
    from {
      opacity: 0.4;
    }
    to {
      opacity: 0;
    }
  }
</style>
