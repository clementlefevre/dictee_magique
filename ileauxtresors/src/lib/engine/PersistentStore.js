import { get, writable } from 'svelte/store';

const SAVE_VERSION = 1;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadSave(key, fallback) {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (parsed?.version !== SAVE_VERSION) return fallback;
    return { ...fallback, ...parsed.data };
  } catch (error) {
    console.warn('Save load failed:', error);
    return fallback;
  }
}

export function writeSave(key, data) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify({
      version: SAVE_VERSION,
      data
    }));
  } catch (error) {
    console.warn('Save write failed:', error);
  }
}

export function clearSave(key) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(key);
}

export function persistentWritable(key, initialValue) {
  const store = writable(loadSave(key, initialValue));

  store.subscribe(value => {
    writeSave(key, value);
  });

  return {
    subscribe: store.subscribe,
    set: store.set,
    update: store.update,
    snapshot: () => get(store)
  };
}
