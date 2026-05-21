<script>
  import { onMount } from "svelte";
  import { gameEngine } from "$lib/engine/GameEngine.js";

  let { mode = "playing" } = $props(); // 'askName' or 'playing'

  const { lastAnswerCorrect } = gameEngine;

  let inputText = $state("");
  let inputEl;
  let shaking = $state(false);
  let flashing = $state(false);

  const allowedChars = /^[a-zA-Z ]$/;

  onMount(() => {
    if (inputEl) inputEl.focus();
  });

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const text = inputText.trim().toLowerCase();
      if (text.length === 0) return;

      if (mode === "askName") {
        gameEngine.submitPlayerName(text);
      } else {
        gameEngine.checkAnswer(text);
      }
      inputText = "";
      return;
    }

    if (e.key === " " && mode === "playing") {
      e.preventDefault();
      gameEngine.repeatQuestion();
      return;
    }

    if (e.key === "Backspace") {
      return; // Let default behavior handle it
    }

    // Only allow letters and space
    if (!allowedChars.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Play letter sound
    if (mode === "playing" && e.key !== " ") {
      gameEngine.playLetterSound(e.key.toLowerCase());
    }
  }

  // Watch for wrong/correct answer feedback
  $effect(() => {
    const result = $lastAnswerCorrect;
    if (result === false) {
      shaking = true;
      setTimeout(() => (shaking = false), 500);
    } else if (result === true) {
      flashing = true;
      setTimeout(() => (flashing = false), 500);
    }
  });

  export function focus() {
    inputEl?.focus();
  }
</script>

<div class="command-input" class:shake={shaking} class:flash-correct={flashing}>
  <div class="prompt-line">
    <span class="prompt glow">C:\&gt;</span>
    <div class="input-wrapper">
      <input
        bind:this={inputEl}
        bind:value={inputText}
        onkeydown={handleKeyDown}
        type="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        class="text-input glow"
        placeholder=""
      />
      <span class="display-text glow"
        >{inputText.toUpperCase()}<span class="block-cursor pulse">█</span
        ></span
      >
    </div>
  </div>
  {#if mode === "askName"}
    <div
      class="hint glow"
      style="opacity: 0.5; font-size: var(--font-xs); margin-top: 8px; margin-left: 40px;"
    >
      Tape ton prénom et appuie sur ENTRÉE
    </div>
  {:else}
    <div
      class="hint glow"
      style="opacity: 0.4; font-size: var(--font-xs); margin-top: 8px; margin-left: 40px;"
    >
      ENTRÉE = valider │ ESPACE = répéter la question
    </div>
  {/if}
</div>

<style>
  .command-input {
    padding: clamp(12px, 2vw, 24px) clamp(16px, 3vw, 40px);
  }

  .prompt-line {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .prompt {
    font-size: var(--font-lg);
    flex-shrink: 0;
    user-select: none;
  }

  .input-wrapper {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .text-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    font-size: var(--font-xl);
    padding: 0;
    margin: 0;
    opacity: 0;
    z-index: 2;
  }

  .display-text {
    font-size: var(--font-xl);
    display: block;
    min-height: 1.2em;
    white-space: pre;
    z-index: 1;
  }

  .block-cursor {
    color: var(--green);
  }

  .hint {
    font-family: "Px437", monospace;
    color: var(--green);
  }

  .shake {
    animation: shake 0.5s ease-in-out;
  }

  .flash-correct {
    animation: flash-correct 0.5s ease-out;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    10%,
    30%,
    50%,
    70%,
    90% {
      transform: translateX(-4px);
    }
    20%,
    40%,
    60%,
    80% {
      transform: translateX(4px);
    }
  }

  @keyframes flash-correct {
    0% {
      background-color: rgba(0, 255, 0, 0.15);
    }
    100% {
      background-color: transparent;
    }
  }
</style>
