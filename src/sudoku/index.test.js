/** @jest-environment node */
import * as api from './index.js';

const { generatePuzzle, SIZES, LEVELS, CLUE_COUNTS, createSeededRng } = api;

// Independent naive checkers (plain backtracking, no bitmasks) so the generator does not verify itself.
const BOX = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };

function naiveOk(grid, n, r, c, v) {
  const [br, bc] = BOX[n];
  for (let i = 0; i < n; i += 1) {
    if (grid[r][i] === v || grid[i][c] === v) return false;
  }
  const r0 = r - (r % br);
  const c0 = c - (c % bc);
  for (let i = 0; i < br; i += 1) {
    for (let j = 0; j < bc; j += 1) {
      if (grid[r0 + i][c0 + j] === v) return false;
    }
  }
  return true;
}

function naiveSolve(input, n, limit, out) {
  const grid = input.map((row) => row.slice());
  let count = 0;
  const go = (pos) => {
    if (count >= limit) return;
    if (pos === n * n) {
      count += 1;
      if (count === 1) out.first = grid.map((row) => row.slice());
      return;
    }
    const r = Math.floor(pos / n);
    const c = pos % n;
    if (grid[r][c] !== 0) {
      go(pos + 1);
      return;
    }
    for (let v = 1; v <= n; v += 1) {
      if (naiveOk(grid, n, r, c, v)) {
        grid[r][c] = v;
        go(pos + 1);
        grid[r][c] = 0;
      }
    }
  };
  go(0);
  return count;
}

function naiveIsValidSolution(grid, n) {
  const [rows, cols] = BOX[n];
  const want = Array.from({ length: n }, (_, i) => i + 1).join(',');
  const key = (cells) => [...cells].sort((a, b) => a - b).join(',');
  for (let i = 0; i < n; i += 1) {
    if (key(grid[i]) !== want) return false;
    if (key(grid.map((row) => row[i])) !== want) return false;
  }
  for (let r0 = 0; r0 < n; r0 += rows) {
    for (let c0 = 0; c0 < n; c0 += cols) {
      const cells = [];
      for (let i = 0; i < rows; i += 1) for (let j = 0; j < cols; j += 1) cells.push(grid[r0 + i][c0 + j]);
      if (key(cells) !== want) return false;
    }
  }
  return true;
}

const combos = SIZES.flatMap((n) => LEVELS.map((level) => [n, level, CLUE_COUNTS[n][level]]));
const seedCount = (n) => (n === 9 ? 5 : 20);

function verify(res, n, level, count) {
  // shape and metadata
  expect(res.size).toBe(n);
  expect(res.level).toBe(level);
  expect([res.boxRows, res.boxCols]).toEqual(BOX[n]);
  expect(res.puzzle).toHaveLength(n);
  res.puzzle.forEach((row) => expect(row).toHaveLength(n));
  // AC-3 exact count
  expect(res.puzzle.flat().filter((v) => v !== 0)).toHaveLength(count);
  expect(res.givens).toBe(count);
  // AC-2 valid solution with standard boxes; clues match the solution
  expect(naiveIsValidSolution(res.solution, n)).toBe(true);
  res.puzzle.forEach((row, r) => row.forEach((v, c) => v === 0 || expect(v).toBe(res.solution[r][c])));
  // AC-1 exactly one solution, equal to the reported solution
  const out = {};
  expect(naiveSolve(res.puzzle, n, 2, out)).toBe(1);
  expect(out.first).toEqual(res.solution);
}

describe('generatePuzzle public API (e2e layer, DD4)', () => {
  test.each(combos)('size %i %s: AC-1, AC-2, AC-3 for seeded runs', (n, level, count) => {
    for (let seed = 1; seed <= seedCount(n); seed += 1) {
      verify(generatePuzzle(n, level, { rng: createSeededRng(seed) }), n, level, count);
    }
  });

  test.each(combos)('size %i %s: unseeded runs (Math.random)', (n, level, count) => {
    for (let i = 0; i < 2; i += 1) verify(generatePuzzle(n, level), n, level, count);
  });

  test.each([
    [4, 'easy', 8],
    [4, 'medium', 6],
    [4, 'hard', 5],
    [6, 'easy', 18],
    [6, 'medium', 14],
    [6, 'hard', 11],
    [9, 'easy', 40],
    [9, 'medium', 32],
    [9, 'hard', 25],
  ])('AC-3 table: %ix%i %s has %i pre-filled cells', (n, level, count) => {
    const res = generatePuzzle(n, level, { rng: createSeededRng(100) });
    expect(res.puzzle.flat().filter((v) => v !== 0)).toHaveLength(count);
    expect(res.givens).toBe(count);
  });

  test('same seed gives same puzzle', () => {
    expect(generatePuzzle(6, 'hard', { rng: createSeededRng(8) })).toEqual(
      generatePuzzle(6, 'hard', { rng: createSeededRng(8) }),
    );
  });

  test('result is plain structured-clone-safe data', () => {
    const res = generatePuzzle(4, 'easy', { rng: createSeededRng(1) });
    expect(structuredClone(res)).toEqual(res);
  });

  test('accepts null or omitted options', () => {
    expect(generatePuzzle(4, 'easy', null).givens).toBe(8);
    expect(generatePuzzle(4, 'easy', undefined).givens).toBe(8);
  });

  test('re-exports the public constants and helpers', () => {
    expect(api.LEVEL_LABELS.hard).toBe('Hard');
    expect(api.BOX_DIMS[6]).toEqual({ rows: 2, cols: 3 });
    expect(typeof api.countSolutions).toBe('function');
    expect(typeof api.SudokuError).toBe('function');
    expect(api.ERROR_CODES.GENERATION_FAILED).toBe('SUDOKU_GENERATION_FAILED');
  });
});

describe('generatePuzzle validation', () => {
  test.each([['9x9'], [5], [NaN], [undefined], [null], ['9'], ['__proto__'], [[9]]])('invalid size %p', (size) => {
    expect(() => generatePuzzle(size, 'easy')).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_SIZE' }));
  });

  test.each([['Easy'], ['expert'], [undefined], [null], ['__proto__'], ['constructor'], [1]])('invalid level %p', (level) => {
    expect(() => generatePuzzle(9, level)).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_LEVEL' }));
  });

  test.each([['x'], [42], [{ rng: 'nope' }], [{ rng: 1 }], [{ rng: null }]])('invalid options %p', (opts) => {
    expect(() => generatePuzzle(4, 'easy', opts)).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_OPTION' }));
  });

  test('size is validated before level', () => {
    expect(() => generatePuzzle(3, 'bad')).toThrow(expect.objectContaining({ code: 'SUDOKU_INVALID_SIZE' }));
  });
});
