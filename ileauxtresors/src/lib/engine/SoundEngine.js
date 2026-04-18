import { Howl } from 'howler';

function createSoundEngine() {
  let currentSequence = null;
  let aborted = false;

  function playOne(soundUrl) {
    return new Promise((resolve, reject) => {
      const src = '/sounds/' + soundUrl + '.mp3';
      const sound = new Howl({
        src: [src],
        volume: 1,
        onend: () => resolve(),
        onloaderror: (_id, err) => {
          console.warn('Sound load error:', src, err);
          resolve(); // Don't break the chain
        },
        onplayerror: (_id, err) => {
          console.warn('Sound play error:', src, err);
          resolve();
        }
      });
      sound.play();
    });
  }

  async function playSequence(sounds, onEachCallback) {
    aborted = false;
    const id = Symbol();
    currentSequence = id;

    for (const sound of sounds) {
      if (aborted || currentSequence !== id) break;
      if (!sound?.url) continue;

      if (onEachCallback) onEachCallback(sound);
      await playOne(sound.url);
    }
  }

  function stopAll() {
    aborted = true;
    currentSequence = null;
    Howler.stop();
  }

  function playBoot() {
    return playOne('boot');
  }

  return {
    playSequence,
    playBoot,
    stopAll
  };
}

export const soundEngine = createSoundEngine();
