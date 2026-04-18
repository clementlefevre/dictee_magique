<script>
  import { gameEngine } from '$lib/engine/GameEngine.js';

  let { onComplete } = $props();

  const words = gameEngine.getMiniGameWords();
  let currentWordIndex = $state(0);
  let scrambled = $state('');
  let userAnswer = $state('');
  let feedback = $state(''); // '', 'correct', 'wrong'
  let solved = $state(0);
  let inputEl = $state(null);

  const totalRounds = Math.min(words.length, 3);

  function scrambleWord(word) {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    // Ensure it's actually scrambled
    if (letters.join('') === word && word.length > 1) {
      [letters[0], letters[1]] = [letters[1], letters[0]];
    }
    return letters.join('');
  }

  function loadWord() {
    if (currentWordIndex >= totalRounds) {
      onComplete?.();
      return;
    }
    const word = words[currentWordIndex];
    scrambled = scrambleWord(word);
    userAnswer = '';
    feedback = '';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const answer = userAnswer.trim().toLowerCase();
      const correct = words[currentWordIndex].toLowerCase();

      if (answer === correct) {
        feedback = 'correct';
        solved++;
        setTimeout(() => {
          currentWordIndex++;
          loadWord();
        }, 800);
      } else {
        feedback = 'wrong';
        setTimeout(() => feedback = '', 500);
      }
    }
  }

  function skip() {
    onComplete?.();
  }

  // Initialize
  $effect(() => {
    loadWord();
  });

  import { onMount } from 'svelte';
  onMount(() => {
    if (inputEl) inputEl.focus();
  });
</script>

<div class="minigame">
  <div class="title glow-amber">
    ═══ BONUS : DÉCHIFFRE LE MOT ! ═══
  </div>

  {#if currentWordIndex < totalRounds}
    <div class="round-info glow">
      Mot {currentWordIndex + 1} / {totalRounds}
    </div>

    <div class="scrambled-word glow" class:shake-wrong={feedback === 'wrong'}>
      {#each scrambled.toUpperCase().split('') as letter, i}
        <span class="scramble-letter" style="animation-delay: {i * 0.1}s">
          {letter}
        </span>
      {/each}
    </div>

    <div class="input-area">
      <span class="prompt glow">&gt;</span>
      <input
        bind:this={inputEl}
        bind:value={userAnswer}
        onkeydown={handleKeyDown}
        type="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        class="mini-input glow"
        class:correct-input={feedback === 'correct'}
      />
    </div>

    {#if feedback === 'correct'}
      <div class="feedback glow" style="color: var(--green)">✓ Correct !</div>
    {/if}

    <button class="skip-btn glow" onclick={skip}>
      [PASSER ►]
    </button>
  {/if}
</div>

<style>
  .minigame {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 40px 20px;
    min-height: 60vh;
  }

  .title {
    font-size: var(--font-md);
    text-align: center;
  }

  .round-info {
    font-size: var(--font-xs);
    opacity: 0.6;
  }

  .scrambled-word {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .scramble-letter {
    font-size: var(--font-xl);
    border: 2px solid var(--amber);
    padding: 8px 14px;
    color: var(--amber);
    text-shadow: 0 0 6px var(--amber-glow);
    animation: letter-drop 0.4s ease-out backwards;
  }

  .input-area {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .prompt {
    font-size: var(--font-lg);
  }

  .mini-input {
    font-size: var(--font-lg);
    text-transform: uppercase;
    width: 300px;
    max-width: 80vw;
    border-bottom: 2px solid rgba(0, 255, 0, 0.3) !important;
    padding: 4px 8px;
    text-align: center;
  }

  .correct-input {
    border-bottom-color: var(--green) !important;
    text-shadow: 0 0 8px var(--green-glow);
  }

  .feedback {
    font-size: var(--font-md);
    animation: slideUp 0.3s ease-out;
  }

  .skip-btn {
    font-size: var(--font-xs);
    cursor: pointer;
    opacity: 0.5;
    padding: 4px 12px;
    margin-top: 20px;
    transition: opacity 0.2s;
  }

  .skip-btn:hover {
    opacity: 1;
  }

  .shake-wrong {
    animation: shake 0.4s ease-in-out;
  }

  @keyframes letter-drop {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-4px); }
    40%, 80% { transform: translateX(4px); }
  }
</style>
