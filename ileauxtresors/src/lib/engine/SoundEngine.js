import { Howl, Howler } from 'howler';

function createSoundEngine() {
  let currentSequence = null;
  let aborted = false;
  let voiceFilterEnabled = true;
  const activeSounds = new Set();
  const activeNodes = new Set();

  function getAudioContext() {
    const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (Howler.ctx) return Howler.ctx;
    return AudioContextCtor ? new AudioContextCtor() : null;
  }

  async function warmUp() {
    const ctx = getAudioContext();
    if (ctx?.state === 'suspended') {
      await ctx.resume();
    }
  }

  function isVoiceSound(soundUrl) {
    return !soundUrl.startsWith('SOUNDS/') && soundUrl !== 'boot';
  }

  function settleOnce(resolve, cleanup) {
    let settled = false;
    return () => {
      if (settled) return;
      settled = true;
      cleanup?.();
      resolve();
    };
  }

  function playWithHowler(src) {
    return new Promise(resolve => {
      let sound;
      const finish = settleOnce(resolve, () => {
        if (sound) {
          activeSounds.delete(sound);
          sound.unload();
        }
      });

      sound = new Howl({
        src: [src],
        volume: 1,
        html5: false,
        onload: () => {
          if (aborted) {
            finish();
            return;
          }
          sound.play();
        },
        onend: finish,
        onloaderror: (_id, err) => {
          console.warn('Sound load error:', src, err);
          finish();
        },
        onplayerror: (_id, err) => {
          console.warn('Sound play error:', src, err);
          finish();
        }
      });

      activeSounds.add(sound);
    });
  }

  async function playWithVoiceFilter(src) {
    const ctx = getAudioContext();
    if (!ctx || typeof fetch !== 'function') {
      await playWithHowler(src);
      return;
    }

    await warmUp();

    let audioBuffer;
    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn('Filtered voice decode failed, using Howler:', src, error);
      await playWithHowler(src);
      return;
    }

    await new Promise(resolve => {
      const source = ctx.createBufferSource();
      const highPass = ctx.createBiquadFilter();
      const nasalPeak = ctx.createBiquadFilter();
      const lowPass = ctx.createBiquadFilter();
      const compressor = ctx.createDynamicsCompressor();
      const shaper = ctx.createWaveShaper();
      const gain = ctx.createGain();

      const curve = new Float32Array(256);
      for (let i = 0; i < curve.length; i += 1) {
        const x = (i / 128) - 1;
        curve[i] = Math.round(Math.tanh(x * 3.5) * 7) / 7;
      }

      source.buffer = audioBuffer;
      source.playbackRate.value = 0.96;
      highPass.type = 'highpass';
      highPass.frequency.value = 520;
      nasalPeak.type = 'peaking';
      nasalPeak.frequency.value = 2200;
      nasalPeak.Q.value = 1.4;
      nasalPeak.gain.value = 10;
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 3900;
      compressor.threshold.value = -28;
      compressor.ratio.value = 8;
      shaper.curve = curve;
      gain.gain.value = 0.82;

      source
        .connect(highPass)
        .connect(nasalPeak)
        .connect(lowPass)
        .connect(compressor)
        .connect(shaper)
        .connect(gain)
        .connect(ctx.destination);

      const finish = settleOnce(resolve, () => {
        activeNodes.delete(source);
        source.disconnect();
      });

      activeNodes.add(source);
      source.onended = finish;

      if (aborted) {
        finish();
        return;
      }

      try {
        source.start();
      } catch (error) {
        console.warn('Filtered voice play failed:', src, error);
        finish();
      }
    });
  }

  async function playOne(soundUrl) {
    const src = '/sounds/' + soundUrl + '.mp3';
    if (voiceFilterEnabled && isVoiceSound(soundUrl)) {
      await playWithVoiceFilter(src);
      return;
    }

    await warmUp();
    await playWithHowler(src);
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
    for (const sound of activeSounds) sound.unload();
    activeSounds.clear();
    for (const node of activeNodes) {
      try {
        node.stop();
      } catch {
        // Already stopped.
      }
    }
    activeNodes.clear();
  }

  function playBoot() {
    return playOne('boot');
  }

  function setVoiceFilter(enabled) {
    voiceFilterEnabled = enabled;
  }

  return {
    playSequence,
    playBoot,
    stopAll,
    warmUp,
    setVoiceFilter
  };
}

export const soundEngine = createSoundEngine();
