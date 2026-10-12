/** @jest-environment node */
import { countSolutions, solveRandom, isValidSolution, toFlat, toGrid } from './solver.js';
import { createSeededRng } from './random.js';
import { SIZES } from './config.js';

const WIKI_9 = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const FOUR_UNIQUE = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 0, 0],
];

const emptyGrid = (n) => Array.from({ length: n }, () => Array(n).fill(0));
const patternGrid6 = (f) => Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (__, c) => (f(r, c) % 6) + 1));
// valid for boxes of 2 rows x 3 cols
const VALID_2X3 = patternGrid6((r, c) => 3 * (r % 2) + Math.floor(r / 2) + c);
// valid for boxes of 3 rows x 2 cols only
const VALID_3X2_ONLY = patternGrid6((r, c) => 2 * (r % 3) + Math.floor(r / 3) + c);

describe('countSolutions', () => {
  test('unique fixtures return 1 (4x4, 9x9)', () => {
    expect(countSolutions(FOUR_UNIQUE, 4)).toBe(1);
    expect(countSolutions(WIKI_9, 9)).toBe(1);
  });

  test('6x6 grid with one blank returns 1', () => {
    const g = VALID_2X3.map((r) => r.slice());
    g[2][3] = 0;
    expect(countSolutions(g, 6)).toBe(1);
  });

  test('under-clued grid is capped at limit', () => {
    expect(countSolutions(emptyGrid(4), 4)).toBe(2);
    expect(countSolutions(emptyGrid(4), 4, 5)).toBe(5);
    expect(countSolutions(emptyGrid(9), 9, 3)).toBe(3);
    expect(countSolutions(emptyGrid(6), 6, 1)).toBe(1);
  });

  test('conflicting clues return 0', () => {
    expect(countSolutions([[1, 1, 0, 0], ...emptyGrid(4).slice(1)], 4)).toBe(0); // row
    expect(countSolutions([[1, 0, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 4)).toBe(0); // column
    expect(countSolutions([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 4)).toBe(0); // box
  });

  test('unsolvable but non-conflicting clues return 0', () => {
    expect(countSolutions([[1, 2, 3, 0], [0, 0, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0]], 4)).toBe(0);
  });

  test('complete valid grid has exactly one solution', () => {
    expect(countSolutions(VALID_2X3, 6)).toBe(1);
  });

  test('invalid shapes and values throw SUDOKU_INVALID_GRID', () => {
    const bad = [
      null,
      'x',
      [[0, 0], [0, 0]],
      [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0]],
      [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 'abcd'],
      [[5, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      [[-1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      [[1.5, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    ];
    bad.forEach((g) => expect(() => countSolutions(g, 4)).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_GRID' })));
  });

  test.each([[NaN], [Infinity], [0], [1.5], [-1], ['2'], [null]])('invalid limit %p throws SUDOKU_INVALID_OPTION', (limit) => {
    expect(() => countSolutions(FOUR_UNIQUE, 4, limit)).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_OPTION' }));
  });

  test('limit 1 is accepted', () => {
    expect(countSolutions(FOUR_UNIQUE, 4, 1)).toBe(1);
  });

  test('unsupported size throws SUDOKU_INVALID_SIZE', () => {
    expect(() => countSolutions(emptyGrid(5), 5)).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_SIZE' }));
  });
});

describe('solveRandom', () => {
  test.each(SIZES)('returns a valid complete grid for size %i', (n) => {
    const rng = createSeededRng(n);
    for (let i = 0; i < 5; i += 1) {
      expect(isValidSolution(solveRandom(n, rng), n)).toBe(true);
    }
  });

  test('is deterministic per seed and varies across seeds', () => {
    expect(solveRandom(9, createSeededRng(1))).toEqual(solveRandom(9, createSeededRng(1)));
    expect(solveRandom(9, createSeededRng(1))).not.toEqual(solveRandom(9, createSeededRng(2)));
  });

  test('rejects unsupported size', () => {
    expect(() => solveRandom(5, Math.random)).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_SIZE' }));
  });
});

describe('isValidSolution', () => {
  test('accepts a 2x3-box 6x6 grid and rejects one built for 3x2 boxes', () => {
    expect(isValidSolution(VALID_2X3, 6)).toBe(true);
    expect(isValidSolution(VALID_3X2_ONLY, 6)).toBe(false);
  });

  test('rejects incomplete, malformed and duplicate grids', () => {
    expect(isValidSolution(FOUR_UNIQUE, 4)).toBe(false);
    expect(isValidSolution([[1]], 4)).toBe(false);
    const dup = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 1, 2],
    ];
    expect(isValidSolution(dup, 4)).toBe(false);
  });

  test('throws for unsupported size', () => {
    expect(() => isValidSolution([], 7)).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_SIZE' }));
  });
});

describe('toFlat / toGrid', () => {
  test('round trip', () => {
    expect(toGrid(toFlat(FOUR_UNIQUE, 4), 4)).toEqual(FOUR_UNIQUE);
  });
});
