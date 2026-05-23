# 🏡 Village Éducatif - Educational RPG Game

A canvas-based educational RPG game where players explore a serene village and complete dictée (spelling) and calcul (arithmetic) challenges by interacting with animal NPCs.

## 🎮 How to Play

1. **Open** `village-educatif.html` in any modern web browser
2. **Move** using WASD or Arrow keys
3. **Approach** an animal NPC (look for the "!" exclamation mark)
4. **Press Space** to interact and start a challenge
5. **Complete challenges** to earn points

## 🏗️ Project Structure

```
rpg/game/
├── village-educatif.html       # Main game (enhanced version)
├── index.html                  # Original canvas game (backup)
├── assets/
│   ├── characters/
│   │   └── player.png         # 32×32 player spritesheet (4 directions × 4 frames)
│   ├── animals/
│   │   ├── fox.png            # Placeholder (animated cat)
│   │   └── rabbit.png         # Placeholder (animated frog)
│   ├── sounds/                # Audio files (to be copied)
│   └── text_content.json      # Dictée questions data
└── ../SERENE_VILLAGE_REVAMPED/ # Tileset assets
```

## 🦊 NPC Stations

| Station | Animal | Challenge | Position |
|---------|--------|-----------|----------|
| Place du Village | 🦊 Renard (Fox) | Dictée Level 0 | Center (19, 8) |
| Moulin | 🦉 Hibou (Owl) | Calcul Difficulty 1 | Left (10, 12) |
| Mare aux Canards | 🐰 Lapin (Rabbit) | Dictée Level 1 | Right (25, 12) |
| Forge | 🐻 Ours (Bear) | Calcul Difficulty 2 | Center (19, 20) |

## 🎯 Challenge Types

### Dictée (Spelling)
- Player hears a word (audio will be added)
- Types the word into a text input
- Correct answer: +10 points
- Incorrect: feedback with correct word shown

### Calcul (Arithmetic)
- Column addition/subtraction problems
- Difficulty 1: numbers up to 79
- Difficulty 2: numbers up to 149
- Player fills in digit cells
- Correct answer: +20 points

## 🔧 Technical Details

### Canvas 2D Rendering
- **Resolution**: 800×576 viewport
- **Tile size**: 32×32 pixels
- **Map size**: 40×30 tiles
- **Frame rate**: ~60 FPS via requestAnimationFrame
- **Image rendering**: pixelated (crisp pixel art)

### Animation System
- Player: 4 directions (down, left, right, up)
- 4 animation frames per direction (32×32 each)
- Frame duration: 140ms per frame
- Idle state: frame 0

### Collision Detection
- Solid tiles: water, trees, rocks
- Object blocking: houses (3×4 tiles), campfires (1×1)
- Player hitbox: 20×26 pixels with 3px margin
- 4-corner collision checks

### Camera System
- Smooth following with 0.12 lerp factor
- Clamped to map boundaries
- Centered on player

### Y-Sorting
- All entities sorted by bottom edge Y coordinate
- Correct depth rendering (objects behind/in front of player)
- Combined array of objects, NPCs, and player

## 🎨 Assets Used

### Tileset
- **Serene Village Revamped** 32×32 pixel tileset
- Grass, paths, water, trees, rocks, flowers
- Houses with red/green/blue roofs
- Animated campfires (GIF)

### Sprites
- **Player**: `Premade_Character_32x32_01.png` (16 frames)
- **Fox**: Placeholder from `animated_cat_32x32.png`
- **Rabbit**: Placeholder from `animated_frog_idle_32x32.png`
- **Owl** & **Bear**: To be added (use animated sprites from `rpg/3_Animated_objects/`)

## 🚀 Adding More Content

### Add a New Station

```javascript
STATIONS.push({
  id: 'new-station-id',
  x: 15 * TS,  // tile X × 32
  y: 15 * TS,  // tile Y × 32
  animal: { name: 'Chat', emoji: '🐱' },
  challengeType: 'dictee', // or 'calcul'
  dicteeLevel: 2,          // 0-7 (if dictee)
  calculDifficulty: 1,     // 1-2 (if calcul)
  greeting: "Miaou ! Prêt ?",
  success: "Bravo !",
  failure: "Réessaie !",
});
```

### Add Audio Integration

1. Copy sound files from `ileauxtresors/static/sounds/` to `assets/sounds/`
2. Install Howler.js: `<script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>`
3. Add sound playback in `startChallenge()`:

```javascript
// Play dictée word audio
if (station.challengeType === 'dictee') {
  const sound = new Howl({
    src: [`assets/sounds/QUESTIONS_LEVEL_${station.dicteeLevel}/q_${wordIndex}.mp3`]
  });
  sound.play();
}
```

### Real Dictée Validation

Replace the demo validation with:

```javascript
// Load text_content.json first
fetch('assets/text_content.json')
  .then(res => res.json())
  .then(data => window.DICTEE_DATA = data);

// In submitChallenge()
const questions = window.DICTEE_DATA[`QUESTIONS_LEVEL_${station.dicteeLevel}`];
const correctWord = questions[`q_${station.currentQuestionIndex}`];
const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const correct = normalize(answer) === normalize(correctWord);
```

## 🎓 Educational Features (To Implement)

- [ ] Load dictée questions from `text_content.json`
- [ ] Integrate audio playback with Howler.js
- [ ] Add progress saving with localStorage
- [ ] Implement retry limit (3 attempts per challenge)
- [ ] Add hint system
- [ ] Create rewards/collectibles system
- [ ] Add mini-map with station markers
- [ ] Implement achievement badges

## 🐛 Known Issues

- NPCs currently use emoji rendering (replace with proper sprite sheets)
- Dictée validation is placeholder (accepts any 3+ char input)
- No audio integration yet (requires Howler.js setup)
- No persistence (progress resets on page reload)

## 📦 Dependencies

- **None** (pure vanilla JavaScript + Canvas 2D API)
- Optional: Howler.js 2.2.4 for audio (add via CDN)

## 🔗 Reference Implementation

See `ileauxtresors/` SvelteKit app for:
- Complete dictée questions (`src/lib/data/text_content.json`)
- Sound engine implementation (`src/lib/engine/SoundEngine.js`)
- Calcul challenge UI (`src/lib/components/CalculChallenge.svelte`)
- Game engine phase machine (`src/lib/engine/GameEngine.js`)
- Persistent store (`src/lib/engine/PersistentStore.js`)

## 📝 License

Assets:
- Serene Village Tileset: Check `rpg/SERENE_VILLAGE_REVAMPED/` for licensing
- Character sprites: Freely licensed (see original pack)

Code: MIT (educational project)

---

**Built with ❤️ for educational purposes**
