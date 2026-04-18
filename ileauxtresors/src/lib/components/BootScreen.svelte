<script>
  import { onMount } from 'svelte';

  let { onComplete } = $props();

  let lines = $state([]);
  let memCounter = $state(0);
  let showCursor = $state(true);
  let bootDone = $state(false);

  const bootLines = [
    { text: 'IBM Personal Computer AT', delay: 0 },
    { text: 'Version 3.30 (C)Copyright IBM Corp 1981, 1987', delay: 300 },
    { text: '', delay: 200 },
    { text: 'MEMORY TEST...', delay: 500, isMem: true },
    { text: '', delay: 100 },
    { text: 'C>PATH C:\\;C:\\DOS;', delay: 800 },
    { text: 'C>KEYB FR 437 C:\\DOS\\KEYBOARD.SYS', delay: 600 },
    { text: '', delay: 200 },
    { text: '╔══════════════════════════════════════════╗', delay: 400 },
    { text: '║     LA DICTÉE MAGIQUE  v2.0              ║', delay: 300 },
    { text: '║     ─────────────────────────             ║', delay: 200 },
    { text: '║     Bienvenue, jeune aventurier !         ║', delay: 300 },
    { text: '╚══════════════════════════════════════════╝', delay: 400 },
    { text: '', delay: 300 },
    { text: 'Initialisation du système...', delay: 800 },
    { text: 'Chargement des mots magiques... OK', delay: 600 },
    { text: 'Activation du module sonore... OK', delay: 500 },
    { text: '', delay: 400 },
    { text: 'Système prêt.', delay: 500 },
  ];

  // Cursor blink
  let cursorInterval;
  onMount(() => {
    cursorInterval = setInterval(() => {
      showCursor = !showCursor;
    }, 530);

    runBootSequence();

    return () => clearInterval(cursorInterval);
  });

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runBootSequence() {
    for (const line of bootLines) {
      await sleep(line.delay);

      if (line.isMem) {
        // Memory counter animation
        lines = [...lines, { text: 'MEMORY TEST... 0 KB OK', id: lines.length }];
        const memLineIdx = lines.length - 1;
        for (let kb = 0; kb <= 4096; kb += 64) {
          memCounter = kb;
          lines = lines.map((l, i) =>
            i === memLineIdx ? { ...l, text: `MEMORY TEST... ${kb} KB OK` } : l
          );
          await sleep(8);
        }
      } else {
        // Type out the line character by character
        const lineIdx = lines.length;
        lines = [...lines, { text: '', id: lineIdx }];
        for (let i = 0; i <= line.text.length; i++) {
          const partial = line.text.substring(0, i);
          lines = lines.map((l, idx) =>
            idx === lineIdx ? { ...l, text: partial } : l
          );
          if (line.text.length > 0) await sleep(20);
        }
      }
    }

    await sleep(800);
    bootDone = true;
    onComplete?.();
  }
</script>

<div class="boot-screen">
  <div class="boot-content">
    {#each lines as line (line.id)}
      <div class="boot-line glow">{line.text}</div>
    {/each}
    {#if !bootDone}
      <span class="cursor glow" class:hidden={!showCursor}>█</span>
    {/if}
  </div>
</div>

<style>
  .boot-screen {
    position: absolute;
    inset: 0;
    padding: clamp(16px, 3vw, 40px);
    overflow-y: auto;
    z-index: 10;
  }

  .boot-content {
    max-width: 800px;
  }

  .boot-line {
    font-size: var(--font-sm);
    line-height: 1.4;
    min-height: 1.4em;
    white-space: pre;
  }

  .cursor {
    font-size: var(--font-sm);
    animation: none;
  }

  .cursor.hidden {
    visibility: hidden;
  }
</style>
