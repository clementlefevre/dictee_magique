<script>
    import { gameEngine, PHASES } from "$lib/engine/GameEngine.js";
    import { soundEngine } from "$lib/engine/SoundEngine.js";
    import {
        CHALLENGE_MODES,
        logicChallenges,
        qcmChallenges,
    } from "$lib/data/adventure";
    import AdventureResult from "$lib/components/AdventureResult.svelte";
    import BootScreen from "$lib/components/BootScreen.svelte";
    import CalculChallenge from "$lib/components/CalculChallenge.svelte";
    import ChoiceChallenge from "$lib/components/ChoiceChallenge.svelte";
    import CommandInput from "$lib/components/CommandInput.svelte";
    import GameHUD from "$lib/components/GameHUD.svelte";
    import Mascot from "$lib/components/Mascot.svelte";
    import MiniGame from "$lib/components/MiniGame.svelte";
    import OverworldMap from "$lib/components/OverworldMap.svelte";
    import ProgressMap from "$lib/components/ProgressMap.svelte";
    import StartMenu from "$lib/components/StartMenu.svelte";
    import VisualRewards from "$lib/components/VisualRewards.svelte";

    const {
        phase,
        showResult,
        resultText,
        playerName,
        score,
        rewards,
        adventureNodes,
        currentNodeIndex,
        selectedNodeIndex,
        unlockedNodeIndex,
        currentChallengeNode,
        challengeResult,
        hasSave,
    } = gameEngine;

    let commandInputRef = $state(null);

    async function handleStart() {
        await gameEngine.startNewAdventure();
    }

    function handleBootComplete() {
        gameEngine.onBootComplete();
    }

    function handleContinue() {
        gameEngine.continueAdventure();
    }

    function handleResetSave() {
        gameEngine.clearAdventureSave();
    }

    function handleChallengeComplete(result) {
        gameEngine.completeAdventureChallenge(result);
    }

    function handleMiniGameComplete() {
        gameEngine.continueFromResult();
    }
</script>

<div class="game-container">
    {#if $phase === PHASES.START}
        <StartMenu
            hasSave={$hasSave}
            onStart={handleStart}
            onContinue={handleContinue}
            onReset={handleResetSave}
        />
    {:else if $phase === PHASES.BOOT}
        <BootScreen onComplete={handleBootComplete} />
    {:else if $phase === PHASES.ASK_NAME}
        <div class="name-screen slide-up">
            <div class="name-header glow pixel-border">
                <span class="glow-amber">ROBOT-CRT</span><br />
                Comment t'appelles-tu, jeune pilote du clavier ?
            </div>
            <CommandInput bind:this={commandInputRef} mode="askName" />
        </div>
    {:else if $phase === PHASES.OVERWORLD}
        <div class="adventure-hud pixel-border">
            <span class="glow">{$playerName || "JOUEUR"}</span>
            <span class="glow-amber">SCORE {$score}</span>
            <span class="glow">TRESORS {$rewards.length}</span>
        </div>
        <OverworldMap
            nodes={adventureNodes}
            currentIndex={$currentNodeIndex}
            unlockedIndex={$unlockedNodeIndex}
            selectedIndex={$selectedNodeIndex}
            onSelect={(index) => gameEngine.selectMapNode(index)}
            onEnter={() => gameEngine.startSelectedChallenge()}
        />
    {:else if $phase === PHASES.CHALLENGE}
        {#if $currentChallengeNode?.mode === CHALLENGE_MODES.DICTEE}
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
                    <div class="result-display glow-red">
                        {$resultText.toUpperCase()}
                    </div>
                {/if}
                <CommandInput bind:this={commandInputRef} mode="playing" />
                <VisualRewards />
            </div>
        {:else if $currentChallengeNode?.mode === CHALLENGE_MODES.CALCUL}
            <CalculChallenge
                node={$currentChallengeNode}
                onComplete={handleChallengeComplete}
            />
        {:else if $currentChallengeNode?.mode === CHALLENGE_MODES.LOGIC}
            <ChoiceChallenge
                node={$currentChallengeNode}
                challenges={logicChallenges}
                label="LOGIQUE ECO-RIGOLOTE"
                onComplete={handleChallengeComplete}
            />
        {:else if $currentChallengeNode?.mode === CHALLENGE_MODES.QCM}
            <ChoiceChallenge
                node={$currentChallengeNode}
                challenges={qcmChallenges}
                label="CULTURE FRANCO-ALLEMANDE"
                onComplete={handleChallengeComplete}
            />
        {/if}
    {:else if $phase === PHASES.ADVENTURE_RESULT}
        <AdventureResult
            result={$challengeResult}
            node={$currentChallengeNode}
            onContinue={() => gameEngine.continueFromResult()}
            onRestart={() => gameEngine.restartCurrentChallenge()}
        />
    {:else if $phase === PHASES.MINI_GAME}
        <MiniGame onComplete={handleMiniGameComplete} />
    {:else if $phase === PHASES.GAME_WON}
        <div class="win-screen">
            <div class="win-art glow-amber pixel-border">
                <pre>
+--------------------------------------+
|   FELICITATIONS, AVENTURIER !        |
|   Tu as traverse toute l ile.        |
|   Les mots brillent, les nombres     |
|   ronronnent, et la planete sourit.  |
+--------------------------------------+
        </pre>
            </div>

            <div class="win-name glow">
                Bravo, {$playerName} ! Score final: {$score}
            </div>
            <button class="start-btn glow" onclick={handleResetSave}
                >[ RECOMMENCER ]</button
            >
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
        background: var(--gb-darkest);
    }

    .name-screen {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 100%;
        gap: 18px;
        padding: 20px;
    }

    .name-header {
        align-self: center;
        width: min(680px, 100%);
        padding: 18px;
        font-size: var(--font-sm);
        line-height: 1.45;
        text-align: center;
    }

    .adventure-hud {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
        margin: 14px auto 0;
        padding: 8px 12px;
        font-size: var(--font-xs);
        background: var(--gb-dark);
    }

    .play-screen {
        display: flex;
        flex-direction: column;
        min-height: 100%;
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
        padding: 12px 40px;
        font-size: var(--font-lg);
        overflow-wrap: anywhere;
    }

    .win-screen {
        min-height: 100%;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 22px;
        padding: 20px;
        text-align: center;
    }

    .win-art {
        padding: 18px;
        max-width: 100%;
        overflow-x: auto;
    }

    .win-art pre {
        font-size: var(--font-xs);
        line-height: 1.3;
    }

    .win-name {
        font-size: var(--font-md);
    }

    .start-btn {
        font-size: var(--font-xs);
        cursor: pointer;
        padding: 10px 18px;
        border: 2px solid var(--gb-light);
    }

    @media (max-width: 680px) {
        .play-top {
            flex-direction: column;
        }

        .play-right {
            align-self: center;
        }
    }
</style>
