import { get, writable } from 'svelte/store';
import textContent from '$lib/data/text_content.json';
import { adventureNodes, CHALLENGE_MODES } from '$lib/data/adventure';
import { matchPlayerName } from './NameMatcher.js';
import { soundEngine } from './SoundEngine.js';
import { clearSave, loadSave, writeSave } from './PersistentStore.js';

const SAVE_KEY = 'ile_aux_tresors_save';

export const PHASES = {
  START: 'start',
  BOOT: 'boot',
  ASK_NAME: 'askName',
  OVERWORLD: 'overworld',
  PLAYING: 'playing',
  CHALLENGE: 'challenge',
  ADVENTURE_RESULT: 'adventureResult',
  LEVEL_COMPLETE: 'levelComplete',
  MINI_GAME: 'miniGame',
  GAME_WON: 'gameWon'
};

const DEFAULT_SAVE = {
  playerName: '',
  score: 0,
  currentNodeIndex: 0,
  unlockedNodeIndex: 0,
  completedNodeIds: [],
  rewards: [],
  levelStars: []
};

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getLevelKeys(data) {
  return Object.keys(data)
    .filter(k => k.startsWith('QUESTIONS_LEVEL_'))
    .sort((a, b) => {
      const na = parseInt(a.replace('QUESTIONS_LEVEL_', ''));
      const nb = parseInt(b.replace('QUESTIONS_LEVEL_', ''));
      return na - nb;
    });
}

function getRandomProperty(data, family) {
  const keys = Object.keys(data[family] || {});
  return keys[Math.floor(Math.random() * keys.length)];
}

function getRandomItem(data, family) {
  const key = getRandomProperty(data, family);
  return data[family]?.[key];
}

function initSoundUrls(data) {
  const processed = {};
  for (const category of Object.keys(data)) {
    processed[category] = {};
    for (const item of Object.keys(data[category])) {
      processed[category][item] = {
        text: data[category][item],
        url: category + '/' + item
      };
    }
  }

  processed.ALPHABET = {};
  for (const letter of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
    processed.ALPHABET[letter] = { text: letter, url: 'ALPHABET/' + letter };
  }
  return processed;
}

function normalizeAnswer(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function createGameEngine() {
  const data = initSoundUrls(textContent);
  const levelKeys = getLevelKeys(data);
  const levelsCount = levelKeys.length;
  const saved = loadSave(SAVE_KEY, {
    ...DEFAULT_SAVE,
    levelStars: Array(levelsCount).fill(-1)
  });

  const phase = writable(PHASES.START);
  const score = writable(saved.score || 0);
  const level = writable(0);
  const retry = writable(0);
  const playerName = writable(saved.playerName || '');
  const currentQuestion = writable(null);
  const showResult = writable(false);
  const resultText = writable('');
  const questionsRemaining = writable(0);
  const questionsTotal = writable(0);
  const correctCount = writable(0);
  const streakCount = writable(0);
  const bestStreak = writable(0);
  const levelStars = writable(saved.levelStars?.length ? saved.levelStars : Array(levelsCount).fill(-1));
  const lastAnswerCorrect = writable(null);
  const questionStartTime = writable(0);
  const mascotMood = writable('idle');
  const currentNodeIndex = writable(saved.currentNodeIndex || 0);
  const selectedNodeIndex = writable(saved.currentNodeIndex || 0);
  const unlockedNodeIndex = writable(saved.unlockedNodeIndex || 0);
  const completedNodeIds = writable(saved.completedNodeIds || []);
  const rewards = writable(saved.rewards || []);
  const currentChallengeNode = writable(adventureNodes[saved.currentNodeIndex || 0]);
  const challengeResult = writable(null);
  const hasSave = writable(Boolean(saved.playerName || saved.completedNodeIds?.length));

  let allQuestions = [];
  let playerNameSound = null;
  let bootCompleted = false;

  function saveProgress() {
    const saveData = {
      playerName: get(playerName),
      score: get(score),
      currentNodeIndex: get(currentNodeIndex),
      unlockedNodeIndex: get(unlockedNodeIndex),
      completedNodeIds: get(completedNodeIds),
      rewards: get(rewards),
      levelStars: get(levelStars)
    };
    writeSave(SAVE_KEY, saveData);
    hasSave.set(Boolean(saveData.playerName || saveData.completedNodeIds.length));
  }

  function resetProgressStores() {
    score.set(0);
    level.set(0);
    retry.set(0);
    playerName.set('');
    currentQuestion.set(null);
    showResult.set(false);
    resultText.set('');
    questionsRemaining.set(0);
    questionsTotal.set(0);
    correctCount.set(0);
    streakCount.set(0);
    bestStreak.set(0);
    levelStars.set(Array(levelsCount).fill(-1));
    lastAnswerCorrect.set(null);
    mascotMood.set('idle');
    currentNodeIndex.set(0);
    selectedNodeIndex.set(0);
    unlockedNodeIndex.set(0);
    completedNodeIds.set([]);
    rewards.set([]);
    currentChallengeNode.set(adventureNodes[0]);
    challengeResult.set(null);
    allQuestions = [];
    playerNameSound = null;
  }

  function getSound(category) {
    return getRandomItem(data, category);
  }

  function setNewGame(lvl) {
    const key = 'QUESTIONS_LEVEL_' + lvl.toString();
    const questionKeys = Object.keys(data[key] || {});
    allQuestions = shuffleArray(questionKeys);
    level.set(lvl);
    retry.set(0);
    showResult.set(false);
    resultText.set('');
    questionsTotal.set(allQuestions.length);
    questionsRemaining.set(allQuestions.length);
    correctCount.set(0);
    streakCount.set(0);
    bestStreak.set(0);
    lastAnswerCorrect.set(null);
    mascotMood.set('idle');

    levelStars.update(stars => {
      const nextStars = [...stars];
      if (nextStars[lvl] === -1) nextStars[lvl] = 0;
      return nextStars;
    });
  }

  function setQuestion() {
    if (allQuestions.length === 0) return false;
    const key = allQuestions.shift();
    const lvl = get(level);
    const q = data['QUESTIONS_LEVEL_' + lvl.toString()][key];
    currentQuestion.set(q);
    retry.set(0);
    questionsRemaining.set(allQuestions.length);
    questionStartTime.set(Date.now());
    return true;
  }

  async function startNewAdventure() {
    clearSave(SAVE_KEY);
    resetProgressStores();
    hasSave.set(false);
    bootCompleted = false;
    soundEngine.stopAll();
    await soundEngine.warmUp();
    phase.set(PHASES.BOOT);
  }

  async function startGame() {
    await startNewAdventure();
  }

  function continueAdventure() {
    soundEngine.stopAll();
    const nodeIndex = Math.min(get(currentNodeIndex), get(unlockedNodeIndex));
    selectedNodeIndex.set(nodeIndex);
    currentChallengeNode.set(adventureNodes[nodeIndex]);
    phase.set(PHASES.OVERWORLD);
  }

  function clearAdventureSave() {
    clearSave(SAVE_KEY);
    resetProgressStores();
    hasSave.set(false);
    phase.set(PHASES.START);
  }

  async function onBootComplete() {
    if (bootCompleted || get(phase) !== PHASES.BOOT) return;
    bootCompleted = true;
    soundEngine.stopAll();
    phase.set(PHASES.ASK_NAME);
    await soundEngine.playSequence([getSound('ASK_PLAYER_NAME')]);
  }

  async function submitPlayerName(inputName) {
    const matched = matchPlayerName(inputName);
    playerName.set(matched);
    playerNameSound = { text: matched, url: 'PRENOMS/' + matched.toLowerCase() };
    saveProgress();

    phase.set(PHASES.OVERWORLD);
    await soundEngine.playSequence([
      getSound('GREETINGS_1'),
      playerNameSound,
      getSound('GREETINGS_2')
    ]);
  }

  function moveSelection(delta) {
    const unlocked = get(unlockedNodeIndex);
    selectedNodeIndex.update(index => {
      const next = Math.max(0, Math.min(unlocked, index + delta));
      currentChallengeNode.set(adventureNodes[next]);
      return next;
    });
  }

  function selectMapNode(index) {
    if (index > get(unlockedNodeIndex)) return;
    selectedNodeIndex.set(index);
    currentChallengeNode.set(adventureNodes[index]);
  }

  async function startSelectedChallenge() {
    const node = adventureNodes[get(selectedNodeIndex)];
    if (!node || get(selectedNodeIndex) > get(unlockedNodeIndex)) return;
    currentNodeIndex.set(get(selectedNodeIndex));
    currentChallengeNode.set(node);
    challengeResult.set(null);
    saveProgress();

    if (node.mode === CHALLENGE_MODES.DICTEE) {
      const lvl = Math.min(node.level ?? 0, levelsCount - 1);
      setNewGame(lvl);
      setQuestion();
      phase.set(PHASES.CHALLENGE);
      await soundEngine.playSequence([getSound('INTRO'), get(currentQuestion)]);
      return;
    }

    phase.set(PHASES.CHALLENGE);
  }

  async function checkAnswer(answer) {
    const q = get(currentQuestion);
    if (!q) return;

    if (normalizeAnswer(answer) === normalizeAnswer(q.text)) {
      const currentStreak = get(streakCount) + 1;
      streakCount.set(currentStreak);
      bestStreak.update(b => Math.max(b, currentStreak));
      correctCount.update(c => c + 1);
      lastAnswerCorrect.set(true);
      mascotMood.set('happy');

      const elapsed = (Date.now() - get(questionStartTime)) / 1000;
      let points = 10;
      if (currentStreak >= 3) points += currentStreak * 2;
      if (elapsed < 10) points += Math.floor((10 - elapsed) * 2);
      score.update(s => s + points);

      if (allQuestions.length === 0) {
        await handleLevelComplete();
      } else {
        setQuestion();
        await playNextQuestion();
      }
    } else {
      streakCount.set(0);
      lastAnswerCorrect.set(false);
      mascotMood.set('sad');
      retry.update(r => r + 1);

      if (get(retry) >= 3) {
        await playCorrectAnswerAndContinue();
      } else {
        await playWrongAnswer();
      }
    }

    setTimeout(() => mascotMood.set('idle'), 2000);
    saveProgress();
  }

  async function handleLevelComplete() {
    const correct = get(correctCount);
    const total = get(questionsTotal);
    const accuracy = total > 0 ? correct / total : 0;

    let stars = 0;
    if (accuracy >= 0.9) stars = 3;
    else if (accuracy >= 0.7) stars = 2;
    else if (accuracy >= 0.5) stars = 1;

    levelStars.update(starsByLevel => {
      const arr = [...starsByLevel];
      arr[get(level)] = Math.max(arr[get(level)], stars);
      return arr;
    });

    await completeAdventureChallenge({
      success: stars > 0,
      points: stars * 20,
      detail: `Dictee terminee: ${correct}/${total} reponses justes, ${stars} etoile(s).`
    });
  }

  async function completeAdventureChallenge(result) {
    const node = get(currentChallengeNode);
    const completed = get(completedNodeIds);
    const success = Boolean(result?.success);
    const points = Number(result?.points || 0);

    if (points > 0) score.update(s => s + points);

    if (success && node && !completed.includes(node.id)) {
      completedNodeIds.set([...completed, node.id]);
      rewards.update(items => [...items, node.reward]);
      unlockedNodeIndex.update(index => Math.min(adventureNodes.length - 1, Math.max(index, get(currentNodeIndex) + 1)));
    }

    challengeResult.set({
      success,
      points,
      detail: result?.detail || (success ? 'Bravo, le chemin continue.' : 'Tu peux recommencer pour gagner le tresor.')
    });
    mascotMood.set(success ? 'celebrate' : 'sad');
    phase.set(PHASES.ADVENTURE_RESULT);
    saveProgress();

    if (success) {
      await soundEngine.playSequence([getSound('SCORE_INFOS_2')]);
    }
  }

  function continueFromResult() {
    const current = get(currentNodeIndex);
    if (current >= adventureNodes.length - 1 && get(completedNodeIds).includes(adventureNodes[current].id)) {
      phase.set(PHASES.GAME_WON);
      mascotMood.set('celebrate');
      saveProgress();
      return;
    }

    const next = Math.min(get(unlockedNodeIndex), current + 1);
    selectedNodeIndex.set(next);
    currentChallengeNode.set(adventureNodes[next]);
    phase.set(PHASES.OVERWORLD);
  }

  async function restartCurrentChallenge() {
    selectedNodeIndex.set(get(currentNodeIndex));
    await startSelectedChallenge();
  }

  async function playNextQuestion() {
    const sounds = [];
    const beepOk = { text: 'beepOK', url: 'SOUNDS/s_1' };
    const ok = getSound('ANSWERS_OK');
    const intro = getSound('INTRO');
    const q = get(currentQuestion);

    if (Math.floor(Math.random() * 5) === 4) {
      sounds.push(beepOk, ok, getSound('JOKES'), intro, q);
    } else {
      sounds.push(beepOk, ok, intro, q);
    }

    currentQuestion.update(cq => ({ ...cq, sounds }));
    await soundEngine.playSequence(sounds);
  }

  async function playWrongAnswer() {
    const beepNOK = { text: 'beepNOK', url: 'SOUNDS/s_2' };
    const wrong = getSound('ANSWERS_NOK');
    const intro = getSound('INTRO');
    const q = get(currentQuestion);

    await soundEngine.playSequence([beepNOK, wrong, intro, q]);
  }

  async function playCorrectAnswerAndContinue() {
    showResult.set(true);
    resultText.set('');

    const q = get(currentQuestion);
    const explanation1 = data.ANSWER_EXPLANATION.answer_1;
    const explanation2 = data.ANSWER_EXPLANATION.answer_2;
    const spellingLetters = q.text.split('').map(letter => ({
      text: letter,
      url: 'ALPHABET/' + letter
    }));

    const letterCallback = sound => {
      if (sound.url?.startsWith('ALPHABET/')) {
        resultText.update(t => t + sound.text);
      }
    };

    await soundEngine.playSequence([explanation1, q, explanation2, ...spellingLetters], letterCallback);
    await new Promise(resolve => setTimeout(resolve, 1200));
    showResult.set(false);
    resultText.set('');

    if (allQuestions.length === 0) {
      await handleLevelComplete();
    } else {
      setQuestion();
      await soundEngine.playSequence([getSound('INTRO'), get(currentQuestion)]);
    }
  }

  function repeatQuestion() {
    const q = get(currentQuestion);
    if (q?.sounds) {
      soundEngine.playSequence(q.sounds);
    } else if (q) {
      soundEngine.playSequence([q]);
    }
  }

  function playLetterSound(letter) {
    soundEngine.playSequence([
      { text: 'click', url: 'SOUNDS/s_3' },
      { text: letter, url: 'ALPHABET/' + letter }
    ]);
  }

  function goToMiniGame() {
    phase.set(PHASES.MINI_GAME);
  }

  function goToNextLevel() {
    continueFromResult();
  }

  function restartGame() {
    clearAdventureSave();
  }

  function getMiniGameWords() {
    const lvl = get(level);
    const key = 'QUESTIONS_LEVEL_' + lvl.toString();
    const words = Object.values(data[key] || {}).map(q => q.text);
    return shuffleArray(words).slice(0, 5);
  }

  return {
    phase,
    score,
    level,
    retry,
    playerName,
    currentQuestion,
    showResult,
    resultText,
    questionsRemaining,
    questionsTotal,
    correctCount,
    streakCount,
    bestStreak,
    levelStars,
    lastAnswerCorrect,
    mascotMood,
    levelsCount,
    adventureNodes,
    currentNodeIndex,
    selectedNodeIndex,
    unlockedNodeIndex,
    completedNodeIds,
    rewards,
    currentChallengeNode,
    challengeResult,
    hasSave,
    startGame,
    startNewAdventure,
    continueAdventure,
    clearAdventureSave,
    onBootComplete,
    submitPlayerName,
    moveSelection,
    selectMapNode,
    startSelectedChallenge,
    checkAnswer,
    completeAdventureChallenge,
    continueFromResult,
    restartCurrentChallenge,
    repeatQuestion,
    playLetterSound,
    goToMiniGame,
    goToNextLevel,
    restartGame,
    getMiniGameWords
  };
}

export const gameEngine = createGameEngine();
