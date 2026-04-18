import { writable, get } from 'svelte/store';
import textContent from '$lib/data/text_content.json';
import { matchPlayerName } from './NameMatcher.js';
import { soundEngine } from './SoundEngine.js';

// Game phases
export const PHASES = {
  START: 'start',
  BOOT: 'boot',
  ASK_NAME: 'askName',
  PLAYING: 'playing',
  LEVEL_COMPLETE: 'levelComplete',
  MINI_GAME: 'miniGame',
  GAME_WON: 'gameWon'
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
  // Add alphabet
  processed['ALPHABET'] = {};
  for (const letter of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
    processed['ALPHABET'][letter] = { text: letter, url: 'ALPHABET/' + letter };
  }
  return processed;
}

function createGameEngine() {
  const data = initSoundUrls(textContent);
  const levelKeys = getLevelKeys(data);
  const levelsCount = levelKeys.length;

  // Stores
  const phase = writable(PHASES.START);
  const score = writable(0);
  const level = writable(0);
  const retry = writable(0);
  const playerName = writable('');
  const currentQuestion = writable(null);
  const showResult = writable(false);
  const resultText = writable('');
  const questionsRemaining = writable(0);
  const questionsTotal = writable(0);
  const correctCount = writable(0);
  const streakCount = writable(0);
  const bestStreak = writable(0);
  const levelStars = writable(Array(levelsCount).fill(-1)); // -1 = locked, 0-3 = stars
  const lastAnswerCorrect = writable(null); // null, true, false
  const questionStartTime = writable(0);
  const mascotMood = writable('idle'); // idle, happy, sad, celebrate

  let allQuestions = [];
  let playerNameSound = null;

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

    // Unlock this level
    levelStars.update(stars => {
      const s = [...stars];
      if (s[lvl] === -1) s[lvl] = 0;
      return s;
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

  async function startGame() {
    phase.set(PHASES.BOOT);
  }

  async function onBootComplete() {
    phase.set(PHASES.ASK_NAME);
    setNewGame(0);
    await soundEngine.playSequence([getSound('ASK_PLAYER_NAME')]);
  }

  async function submitPlayerName(inputName) {
    const matched = matchPlayerName(inputName);
    playerName.set(matched);
    playerNameSound = { text: matched, url: 'PRENOMS/' + matched.toLowerCase() };

    setQuestion();
    phase.set(PHASES.PLAYING);

    // Play greeting sequence
    const sounds = [
      getSound('GREETINGS_1'),
      playerNameSound,
      getSound('GREETINGS_2'),
      getSound('INTRO'),
      get(currentQuestion)
    ];
    await soundEngine.playSequence(sounds);
  }

  async function checkAnswer(answer) {
    const q = get(currentQuestion);
    if (!q) return;

    const normalized = q.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (answer === normalized) {
      // Correct!
      const currentStreak = get(streakCount) + 1;
      streakCount.set(currentStreak);
      bestStreak.update(b => Math.max(b, currentStreak));
      correctCount.update(c => c + 1);
      lastAnswerCorrect.set(true);
      mascotMood.set('happy');

      // Scoring: base 10 + streak bonus + time bonus
      const elapsed = (Date.now() - get(questionStartTime)) / 1000;
      let points = 10;
      if (currentStreak >= 3) points += currentStreak * 2; // streak bonus
      if (elapsed < 10) points += Math.floor((10 - elapsed) * 2); // time bonus
      score.update(s => s + points);

      // Check if level is complete
      if (allQuestions.length === 0) {
        await handleLevelComplete();
      } else {
        setQuestion();
        await playNextQuestion();
      }
    } else {
      // Wrong
      streakCount.set(0);
      lastAnswerCorrect.set(false);
      mascotMood.set('sad');
      retry.update(r => r + 1);

      const currentRetry = get(retry);
      if (currentRetry >= 3) {
        // Show correct answer and move on
        await playCorrectAnswerAndContinue();
      } else {
        await playWrongAnswer();
      }
    }

    // Reset mood after a delay
    setTimeout(() => mascotMood.set('idle'), 2000);
  }

  async function handleLevelComplete() {
    const correct = get(correctCount);
    const total = get(questionsTotal);
    const accuracy = total > 0 ? correct / total : 0;

    // Calculate stars: 3 = >90%, 2 = >70%, 1 = >50%, 0 = <50%
    let stars = 0;
    if (accuracy >= 0.9) stars = 3;
    else if (accuracy >= 0.7) stars = 2;
    else if (accuracy >= 0.5) stars = 1;

    levelStars.update(s => {
      const arr = [...s];
      arr[get(level)] = Math.max(arr[get(level)], stars);
      // Unlock next level
      const nextLvl = get(level) + 1;
      if (nextLvl < levelsCount && arr[nextLvl] === -1) {
        arr[nextLvl] = 0;
      }
      return arr;
    });

    mascotMood.set('celebrate');
    phase.set(PHASES.LEVEL_COMPLETE);

    await soundEngine.playSequence([getSound('SCORE_INFOS_2')]);
  }

  async function goToMiniGame() {
    phase.set(PHASES.MINI_GAME);
  }

  async function goToNextLevel() {
    const currentLvl = get(level);
    if (currentLvl < levelsCount - 1) {
      setNewGame(currentLvl + 1);
      setQuestion();
      phase.set(PHASES.PLAYING);
      const sounds = [getSound('INTRO'), get(currentQuestion)];
      await soundEngine.playSequence(sounds);
    } else {
      phase.set(PHASES.GAME_WON);
      mascotMood.set('celebrate');
    }
  }

  async function playNextQuestion() {
    const sounds = [];
    const beepOk = { text: 'beepOK', url: 'SOUNDS/s_1' };
    const ok = getSound('ANSWERS_OK');
    const intro = getSound('INTRO');
    const q = get(currentQuestion);

    // 20% chance of joke
    if (Math.floor(Math.random() * 5) === 4) {
      sounds.push(beepOk, ok, getSound('JOKES'), intro, q);
    } else {
      sounds.push(beepOk, ok, intro, q);
    }

    // Store sounds on question for repeat
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
    const explanation1 = data['ANSWER_EXPLANATION']['answer_1'];
    const explanation2 = data['ANSWER_EXPLANATION']['answer_2'];

    // Spell out the correct answer
    const spellingLetters = q.text.split('').map(letter => ({
      text: letter,
      url: 'ALPHABET/' + letter
    }));

    const revealSounds = [explanation1, q, explanation2, ...spellingLetters];

    // Build result text as letters play
    const letterCallback = (sound) => {
      if (sound.url?.startsWith('ALPHABET/')) {
        resultText.update(t => t + sound.text);
      }
    };

    await soundEngine.playSequence(revealSounds, letterCallback);

    // Wait then move to next question
    await new Promise(resolve => setTimeout(resolve, 2000));
    showResult.set(false);
    resultText.set('');

    if (allQuestions.length === 0) {
      await handleLevelComplete();
    } else {
      setQuestion();
      const intro = getSound('INTRO');
      const q2 = get(currentQuestion);
      await soundEngine.playSequence([intro, q2]);
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

  function restartGame() {
    score.set(0);
    levelStars.set(Array(levelsCount).fill(-1));
    setNewGame(0);
    phase.set(PHASES.ASK_NAME);
    soundEngine.playSequence([getSound('ASK_PLAYER_NAME')]);
  }

  // Get words for mini-game from current level data
  function getMiniGameWords() {
    const lvl = get(level);
    const key = 'QUESTIONS_LEVEL_' + lvl.toString();
    const words = Object.values(data[key] || {}).map(q => q.text);
    return shuffleArray(words).slice(0, 5);
  }

  return {
    // Stores
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

    // Actions
    startGame,
    onBootComplete,
    submitPlayerName,
    checkAnswer,
    repeatQuestion,
    playLetterSound,
    goToMiniGame,
    goToNextLevel,
    restartGame,
    getMiniGameWords
  };
}

export const gameEngine = createGameEngine();
