<script>
  import { gameEngine, PHASES } from "$lib/engine/GameEngine.js";
  import { soundEngine } from "$lib/engine/SoundEngine.js";
  import BootScreen from "$lib/components/BootScreen.svelte";
  import GameHUD from "$lib/components/GameHUD.svelte";
  import CommandInput from "$lib/components/CommandInput.svelte";
  import Mascot from "$lib/components/Mascot.svelte";
  import VisualRewards from "$lib/components/VisualRewards.svelte";
  import ProgressMap from "$lib/components/ProgressMap.svelte";
  import MiniGame from "$lib/components/MiniGame.svelte";
  import LevelComplete from "$lib/components/LevelComplete.svelte";

  const { phase, showResult, resultText, playerName } = gameEngine;

  let commandInputRef = $state(null);
  let visualRewardsRef = $state(null);

  async function handleStart() {
    gameEngine.startGame();
    await soundEngine.playBoot();
    gameEngine.onBootComplete();
  }

  function handleBootComplete() {
    gameEngine.onBootComplete();
  }

  function handleMiniGameComplete() {
    gameEngine.goToNextLevel();
  }

  function handleNextLevel() {
    gameEngine.goToNextLevel();
  }

  function handleGoMiniGame() {
    gameEngine.goToMiniGame();
  }

  function handleRestart() {
    gameEngine.restartGame();
  }
</script>

<div class="game-container">
  <!-- START SCREEN -->
  {#if $phase === PHASES.START}
    <div class="start-screen">
      <div class="logo glow">
        <pre class="ascii-art">
╔═══════════════════════════════════════════╗
║                                           ║
║     ██╗      █████╗                       ║
║     ██║     ██╔══██╗                      ║
║     ██║     ███████║                      ║
║     ██║     ██╔══██║                      ║
║     ███████╗██║  ██║                      ║
║     ╚══════╝╚═╝  ╚═╝                     ║
║                                           ║
║     DICTÉE MAGIQUE  v2.0                  ║
║     ─────────────────                     ║
║     Un jeu d'orthographe                  ║
║     pour jeunes aventuriers               ║
║                                           ║
╚═══════════════════════════════════════════╝
        </pre>
      </div>

      <button class="start-btn glow pulse" onclick={handleStart}>
        ▶ APPUIE POUR COMMENCER ◀
      </button>

      <div
        class="start-hint glow"
        style="opacity: 0.4; font-size: var(--font-xs); margin-top: 20px;"
      >
        IBM Personal Computer • Système de Dictée v2.0
      </div>

      <a href="/kalkul" class="kalkul-link glow">
        🧮 KALKUK — Entraînement calcul
      </a>
    </div>

    <!-- BOOT SEQUENCE -->
  {:else if $phase === PHASES.BOOT}
    <BootScreen onComplete={handleBootComplete} />

    <!-- ASK NAME -->
  {:else if $phase === PHASES.ASK_NAME}
    <div class="name-screen slide-up">
      <div
        class="name-header glow"
        style="padding: 20px 40px; font-size: var(--font-md);"
      >
        ╔═══════════════════════════════╗<br />
        ║ Comment t'appelles-tu ? ║<br />
        ╚═══════════════════════════════╝
      </div>
      <CommandInput bind:this={commandInputRef} mode="askName" />
    </div>

    <!-- PLAYING -->
  {:else if $phase === PHASES.PLAYING}
    <div class="play-screen">
      <div class="play-top">
        <div class="play-left">
          <GameHUD />
          <ProgressMap />
        </div>
        <div class="play-right">
          <Mascot />
        </div>
      </div>

      {#if $showResult}
        <div
          class="result-display glow-red"
          style="padding: 12px 40px; font-size: var(--font-lg);"
        >
          {$resultText.toUpperCase()}
        </div>
      {/if}

      <CommandInput bind:this={commandInputRef} mode="playing" />
      <VisualRewards bind:this={visualRewardsRef} />
    </div>

    <!-- LEVEL COMPLETE -->
  {:else if $phase === PHASES.LEVEL_COMPLETE}
    <LevelComplete onContinue={handleNextLevel} onMiniGame={handleGoMiniGame} />

    <!-- MINI GAME -->
  {:else if $phase === PHASES.MINI_GAME}
    <MiniGame onComplete={handleMiniGameComplete} />

    <!-- GAME WON -->
  {:else if $phase === PHASES.GAME_WON}
    <div class="win-screen">
      <div class="win-art glow-amber">
        <pre>
╔══════════════════════════════════════╗
║                                      ║
║   ★ ★ ★  FÉLICITATIONS ! ★ ★ ★      ║
║                                      ║
║   Tu as terminé tous les niveaux !   ║
║                                      ║
║   Tu es un vrai champion             ║
║   de l'orthographe !                 ║
║                                      ║
╚══════════════════════════════════════╝
        </pre>
      </div>

      <div
        class="win-name glow"
        style="font-size: var(--font-lg); margin: 20px 0;"
      >
        Bravo, {$playerName} !
      </div>

      <ProgressMap />

      <button class="start-btn glow" onclick={handleRestart}>
        [REJOUER ►]
      </button>
    </div>
  {/if}
</div>

<style>
  .game-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .start-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 30px;
    padding: 20px;
  }

  .ascii-art {
    font-size: var(--font-xs);
    line-height: 1.2;
    text-align: left;
    white-space: pre;
  }

  .start-btn {
    font-size: var(--font-md);
    cursor: pointer;
    padding: 12px 32px;
    border: 2px solid var(--green);
    transition: all 0.2s;
  }

  .start-btn:hover {
    background: rgba(0, 255, 0, 0.1);
    box-shadow: 0 0 20px var(--green-glow);
    transform: scale(1.05);
  }

  .kalkul-link {
    font-size: var(--font-xs);
    color: var(--amber);
    text-decoration: none;
    border: 1px solid var(--amber);
    padding: 8px 20px;
    border-radius: 4px;
    opacity: 0.7;
    transition: opacity 0.2s;
    margin-top: 10px;
  }
  .kalkul-link:hover {
    opacity: 1;
    background: rgba(251, 191, 36, 0.08);
  }

  .name-screen {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
  }

  .name-header {
    white-space: pre;
    line-height: 1.4;
  }

  .play-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .play-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .play-left {
    flex: 1;
    min-width: 0;
  }

  .play-right {
    flex-shrink: 0;
    padding: 16px;
  }

  .result-display {
    text-align: center;
    min-height: 1.4em;
  }

  .win-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
    padding: 20px;
  }

  .win-art pre {
    font-size: var(--font-sm);
    line-height: 1.3;
    white-space: pre;
  }
</style>
