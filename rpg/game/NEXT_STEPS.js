// ═══════════════════════════════════════════════════
//  NEXT STEPS - Audio & Dictée Integration Guide
// ═══════════════════════════════════════════════════

// 1. Copy audio files (run in PowerShell)
// Copy-Item -Recurse "C:\Users\cleme\workspace\dictee_magique\ileauxtresors\static\sounds\QUESTIONS_LEVEL_*" "C:\Users\cleme\workspace\dictee_magique\rpg\game\assets\sounds\"
// Copy-Item -Recurse "C:\Users\cleme\workspace\dictee_magique\ileauxtresors\static\sounds\ANSWERS_OK" "C:\Users\cleme\workspace\dictee_magique\rpg\game\assets\sounds\"
// Copy-Item -Recurse "C:\Users\cleme\workspace\dictee_magique\ileauxtresors\static\sounds\ANSWERS_NOK" "C:\Users\cleme\workspace\dictee_magique\rpg\game\assets\sounds\"

// 2. Add Howler.js CDN to village-educatif.html <head>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>

// 3. Load dictée questions at game start
let DICTEE_DATA = null;

async function loadDicteeData() {
  const response = await fetch('assets/text_content.json');
  DICTEE_DATA = await response.json();
  console.log('Dictée data loaded:', Object.keys(DICTEE_DATA));
}

// Call after game initialization
// loadDicteeData();

// 4. Modify startChallenge() for dictée
function startChallengeDictee(station) {
  if (station.challengeType !== 'dictee') return;
  
  // Get questions for this level
  const levelKey = `QUESTIONS_LEVEL_${station.dicteeLevel}`;
  const questions = DICTEE_DATA[levelKey];
  const questionKeys = Object.keys(questions);
  
  // Pick random question
  const randomKey = questionKeys[Math.floor(Math.random() * questionKeys.length)];
  const correctWord = questions[randomKey];
  
  // Store for validation
  station.currentQuestion = {
    key: randomKey,
    word: correctWord,
    level: station.dicteeLevel
  };
  
  // Play audio
  const audioPath = `assets/sounds/${levelKey}/${randomKey}.mp3`;
  const sound = new Howl({
    src: [audioPath],
    volume: 0.8,
    onend: () => {
      console.log('Audio finished playing');
    },
    onloaderror: (id, err) => {
      console.error('Failed to load audio:', err);
    }
  });
  sound.play();
  
  // Show UI
  // ... existing UI code
}

// 5. Modify submitChallenge() for real validation
function submitChallengeDictee() {
  const station = gameState.currentChallenge;
  const answer = document.getElementById('answerInput').value.trim();
  const correctWord = station.currentQuestion.word;
  
  // Normalize: lowercase + remove accents
  const normalize = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };
  
  const normalizedAnswer = normalize(answer);
  const normalizedCorrect = normalize(correctWord);
  const correct = normalizedAnswer === normalizedCorrect;
  
  if (correct) {
    // Play success sound
    const successSounds = [
      'assets/sounds/ANSWERS_OK/bravo.mp3',
      'assets/sounds/ANSWERS_OK/excellent.mp3',
      'assets/sounds/ANSWERS_OK/parfait.mp3'
    ];
    const randomSuccess = successSounds[Math.floor(Math.random() * successSounds.length)];
    new Howl({ src: [randomSuccess], volume: 0.7 }).play();
    
    // Update UI and score
    // ... existing success code
  } else {
    // Play failure sound
    const failureSounds = [
      'assets/sounds/ANSWERS_NOK/dommage.mp3',
      'assets/sounds/ANSWERS_NOK/raté.mp3'
    ];
    const randomFailure = failureSounds[Math.floor(Math.random() * failureSounds.length)];
    new Howl({ src: [randomFailure], volume: 0.7 }).play();
    
    // Show correct answer
    const feedback = document.getElementById('feedback');
    feedback.textContent = `Presque ! Le mot était : ${correctWord}`;
    // ... existing failure code
  }
}

// 6. Add replay button for dictée
function addReplayButton() {
  const replayBtn = document.createElement('button');
  replayBtn.className = 'btn btn-secondary';
  replayBtn.textContent = '🔊 Rejouer';
  replayBtn.onclick = () => {
    const station = gameState.currentChallenge;
    const levelKey = `QUESTIONS_LEVEL_${station.dicteeLevel}`;
    const audioPath = `assets/sounds/${levelKey}/${station.currentQuestion.key}.mp3`;
    new Howl({ src: [audioPath], volume: 0.8 }).play();
  };
  document.getElementById('challengeButtons').insertBefore(
    replayBtn,
    document.getElementById('submitBtn')
  );
}

// 7. Add persistence with localStorage
const GamePersistence = {
  save() {
    const data = {
      score: gameState.score,
      stationsCompleted: Array.from(gameState.stationsCompleted),
      timestamp: Date.now()
    };
    localStorage.setItem('village-educatif-save', JSON.stringify(data));
    console.log('Game saved:', data);
  },
  
  load() {
    const saved = localStorage.getItem('village-educatif-save');
    if (!saved) return false;
    
    try {
      const data = JSON.parse(saved);
      gameState.score = data.score;
      gameState.stationsCompleted = new Set(data.stationsCompleted);
      document.getElementById('scoreValue').textContent = gameState.score;
      console.log('Game loaded:', data);
      return true;
    } catch (err) {
      console.error('Failed to load save:', err);
      return false;
    }
  },
  
  reset() {
    localStorage.removeItem('village-educatif-save');
    gameState.score = 0;
    gameState.stationsCompleted.clear();
    document.getElementById('scoreValue').textContent = '0';
    console.log('Game reset');
  }
};

// Auto-save after completing a challenge
// Add to closeChallenge():
// if (gameState.stationsCompleted.size > 0) {
//   GamePersistence.save();
// }

// Load on game start
// window.addEventListener('DOMContentLoaded', () => {
//   GamePersistence.load();
// });

// 8. Better NPC sprites (replace emoji rendering)
const animalSprites = {
  fox: new Image(),
  owl: new Image(),
  rabbit: new Image(),
  bear: new Image()
};

animalSprites.fox.src = 'assets/animals/fox.png';
animalSprites.owl.src = 'assets/animals/owl.png'; // Add this
animalSprites.rabbit.src = 'assets/animals/rabbit.png';
animalSprites.bear.src = 'assets/animals/bear.png'; // Add this

function drawNPCSprite(station) {
  const sx = Math.round(station.x - cam.x);
  const sy = Math.round(station.y - cam.y);
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx + 16, sy + 28, 10, 5, 0, 0, Math.PI*2);
  ctx.fill();
  
  // Map animal name to sprite
  const spriteKey = station.animal.name.toLowerCase();
  const sprite = animalSprites[spriteKey];
  
  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    // Draw 32×32 sprite
    ctx.drawImage(sprite, sx, sy, 32, 32);
  } else {
    // Fallback emoji
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(station.animal.emoji, sx + 16, sy + 14);
  }
  
  // Exclamation mark
  if (!gameState.stationsCompleted.has(station.id)) {
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffdd00';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('!', sx + 16, sy - 10);
    ctx.fillText('!', sx + 16, sy - 10);
  }
}

// 9. Add mini-map overlay
function drawMiniMap() {
  const miniMapX = VW - 120;
  const miniMapY = 10;
  const miniMapW = 110;
  const miniMapH = 80;
  const scale = miniMapW / (MAP_W * TS);
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(miniMapX, miniMapY, miniMapW, miniMapH);
  ctx.strokeStyle = '#4a6a8a';
  ctx.lineWidth = 2;
  ctx.strokeRect(miniMapX, miniMapY, miniMapW, miniMapH);
  
  // Player dot
  const px = miniMapX + player.x * scale;
  const py = miniMapY + player.y * scale;
  ctx.fillStyle = '#7ec850';
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Station dots
  STATIONS.forEach(s => {
    const sx = miniMapX + s.x * scale;
    const sy = miniMapY + s.y * scale;
    ctx.fillStyle = gameState.stationsCompleted.has(s.id) ? '#999' : '#ffdd00';
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Add to render():
// drawMiniMap();

// ═══════════════════════════════════════════════════
//  DEPLOYMENT CHECKLIST
// ═══════════════════════════════════════════════════
/*
[ ] Copy all audio files to assets/sounds/
[ ] Add Howler.js script tag
[ ] Implement loadDicteeData()
[ ] Replace startChallenge with audio playback
[ ] Add normalized string validation
[ ] Add replay button
[ ] Implement GamePersistence
[ ] Replace NPC emoji with sprite rendering
[ ] Add mini-map
[ ] Test all 4 stations
[ ] Test all challenge types
[ ] Verify audio playback
[ ] Test on mobile (responsive touch controls?)
[ ] Add loading screen for assets
*/

console.log('Next steps guide loaded. See comments for integration details.');
