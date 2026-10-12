/** @jest-environment node */
import { generateSolution, carve, generateWithTarget } from './generator.js';
import { countSolutions, isValidSolution } from './solver.js';
import { createSeededRng } from './random.js';
import { SIZES, CLUE_COUNTS, GENERATION_LIMITS } from './config.js';

const countGivens = (g) => g.flat().filter((v) => v !== 0).length;

describe('generateSolution', () => {
  test.each(SIZES)('size %i is a valid full grid', (n) => {
    expect(isValidSolution(generateSolution(n, createSeededRng(3)), n)).toBe(true);
  });
});

describe('carve', () => {
  test.each(SIZES)('size %i: exact target, unique solution, clues from solution', (n) => {
    const target = CLUE_COUNTS[n].medium;
    for (let seed = 1; seed <= 5; seed += 1) {
      const rng = createSeededRng(seed);
      const solution = generateSolution(n, rng);
      const res = carve(solution, n, target, rng, { orderingsPerGrid: 20, maxAttempts: 1 });
      expect(res).not.toBeNull();
      expect(countGivens(res.puzzle)).toBe(target);
      expect(countSolutions(res.puzzle, n, 2)).toBe(1);
      res.puzzle.forEach((row, r) => row.forEach((v, c) => v !== 0 && expect(v).toBe(solution[r][c])));
    }
  });

  test('does not mutate the solution', () => {
    const rng = createSeededRng(9);
    const solution = generateSolution(4, rng);
    const copy = solution.map((r) => r.slice());
    carve(solution, 4, 6, rng, GENERATION_LIMITS);
    expect(solution).toEqual(copy);
  });

  test('returns null when limits are 0', () => {
    const rng = createSeededRng(1);
    expect(carve(generateSolution(4, rng), 4, 6, rng, { orderingsPerGrid: 0, maxAttempts: 1 })).toBeNull();
  });

  test('returns null for an unreachable target (below the minimum unique clue count)', () => {
    const rng = createSeededRng(1);
    expect(carve(generateSolution(4, rng), 4, 0, rng, { orderingsPerGrid: 2, maxAttempts: 1 })).toBeNull();
  });
});

describe('generateWithTarget', () => {
  test('returns puzzle and solution', () => {
    const res = generateWithTarget(4, 6, createSeededRng(2), GENERATION_LIMITS);
    expect(countGivens(res.puzzle)).toBe(6);
    expect(isValidSolution(res.solution, 4)).toBe(true);
  });

  test('throws SUDOKU_GENERATION_FAILED when attempts are exhausted', () => {
    expect(() => generateWithTarget(4, 6, createSeededRng(2), { orderingsPerGrid: 0, maxAttempts: 3 })).toThrow(
      expect.objectContaining({ code: 'SUDOKU_GENERATION_FAILED' }),
    );
    expect(() => generateWithTarget(4, 6, createSeededRng(2), { orderingsPerGrid: 3, maxAttempts: 0 })).toThrow(
      expect.objectContaining({ code: 'SUDOKU_GENERATION_FAILED' }),
    );
  });
});
