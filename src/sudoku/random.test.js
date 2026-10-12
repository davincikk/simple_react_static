/** @jest-environment node */
import { createSeededRng, shuffleInPlace, randomInt } from './random.js';

describe('random', () => {
  test('same seed gives same sequence, different seed differs', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    const c = createSeededRng(43);
    const sa = Array.from({ length: 10 }, a);
    expect(Array.from({ length: 10 }, b)).toEqual(sa);
    expect(Array.from({ length: 10 }, c)).not.toEqual(sa);
  });

  test('values stay in [0,1)', () => {
    const r = createSeededRng(7);
    for (let i = 0; i < 1000; i += 1) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  test('shuffle is a permutation and deterministic per seed', () => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const s1 = shuffleInPlace([...base], createSeededRng(5));
    const s2 = shuffleInPlace([...base], createSeededRng(5));
    expect(s1).toEqual(s2);
    expect([...s1].sort()).toEqual(base);
  });

  test('shuffle returns the same array instance and handles tiny arrays', () => {
    const arr = [1];
    expect(shuffleInPlace(arr, () => 0.5)).toBe(arr);
    expect(shuffleInPlace([], () => 0.5)).toEqual([]);
  });

  test('out-of-range rng output is clamped into bounds', () => {
    expect(randomInt(() => 5, 3)).toBeGreaterThanOrEqual(0);
    expect(randomInt(() => 5, 3)).toBeLessThan(3);
    expect(randomInt(() => -0.5, 3)).toBeGreaterThanOrEqual(0);
    expect(randomInt(() => -0.5, 3)).toBeLessThan(3);
    const out = shuffleInPlace([1, 2, 3, 4], () => 99);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
  });

  test.each([[NaN], [Infinity], [-Infinity], ['0.5'], [undefined]])('non-finite rng output %p throws INVALID_OPTION', (bad) => {
    expect(() => randomInt(() => bad, 3)).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_OPTION' }));
    expect(() => shuffleInPlace([1, 2, 3], () => bad)).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_OPTION' }));
  });
});
