import { SudokuError, ERROR_CODES } from './errors.js';

// mulberry32: small deterministic PRNG returning floats in [0, 1).
export function createSeededRng(seed) {
  let state = seed >>> 0;
  return function rng() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Random integer in [0, n), safe for out-of-range RNG output.
export function randomInt(rng, n) {
  const raw = rng();
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    throw new SudokuError(ERROR_CODES.INVALID_OPTION, 'rng must return a finite number');
  }
  const v = Math.floor(raw * n);
  return ((v % n) + n) % n;
}

// Fisher-Yates, in place.
export function shuffleInPlace(array, rng) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, i + 1);
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}
