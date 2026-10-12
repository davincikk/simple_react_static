import { getSizeConfig } from './config.js';
import { SudokuError, ERROR_CODES } from './errors.js';
import { randomInt } from './random.js';

const POPCOUNT = new Uint8Array(512);
for (let i = 1; i < 512; i += 1) POPCOUNT[i] = POPCOUNT[i >> 1] + (i & 1);

function requireConfig(size) {
  const cfg = getSizeConfig(size);
  if (!cfg) throw new SudokuError(ERROR_CODES.INVALID_SIZE, 'Unsupported size');
  return cfg;
}

export function toFlat(grid, size) {
  if (!Array.isArray(grid) || grid.length !== size) {
    throw new SudokuError(ERROR_CODES.INVALID_GRID, 'Grid must be size x size');
  }
  const flat = new Uint8Array(size * size);
  for (let r = 0; r < size; r += 1) {
    const row = grid[r];
    if (!Array.isArray(row) || row.length !== size) {
      throw new SudokuError(ERROR_CODES.INVALID_GRID, 'Grid must be size x size');
    }
    for (let c = 0; c < size; c += 1) {
      const v = row[c];
      if (!Number.isInteger(v) || v < 0 || v > size) {
        throw new SudokuError(ERROR_CODES.INVALID_GRID, 'Grid values must be integers in 0..size');
      }
      flat[r * size + c] = v;
    }
  }
  return flat;
}

export function toGrid(flat, size) {
  const grid = [];
  for (let r = 0; r < size; r += 1) grid.push(Array.from(flat.subarray(r * size, (r + 1) * size)));
  return grid;
}

/**
 * Backtracking search with MRV. Returns the number of solutions found (capped at limit).
 * If onSolution is given it receives a copy of the first solution found.
 * If rng is given, candidate digit order is shuffled.
 */
function search(flat, size, limit, rng, onSolution) {
  const { boxRows, boxCols } = requireConfig(size);
  const boxesPerRow = size / boxCols;
  const full = (1 << size) - 1;
  const rowMask = new Uint16Array(size);
  const colMask = new Uint16Array(size);
  const boxMask = new Uint16Array(size);
  const boxOf = (r, c) => Math.floor(r / boxRows) * boxesPerRow + Math.floor(c / boxCols);

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const v = flat[r * size + c];
      if (v !== 0) {
        const bit = 1 << (v - 1);
        const b = boxOf(r, c);
        if (rowMask[r] & bit || colMask[c] & bit || boxMask[b] & bit) return 0; // conflicting clues
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[b] |= bit;
      }
    }
  }

  let found = 0;

  function recurse() {
    let best = -1;
    let bestCands = 0;
    let bestCount = size + 1;
    for (let i = 0; i < flat.length; i += 1) {
      if (flat[i] === 0) {
        const r = (i / size) | 0;
        const c = i - r * size;
        const cands = ~(rowMask[r] | colMask[c] | boxMask[boxOf(r, c)]) & full;
        const n = POPCOUNT[cands];
        if (n < bestCount) {
          best = i;
          bestCands = cands;
          bestCount = n;
          if (n <= 1) break;
        }
      }
    }
    if (best === -1) {
      found += 1;
      if (found === 1 && onSolution) onSolution(flat.slice());
      return found >= limit;
    }
    if (bestCount === 0) return false;

    const digits = [];
    for (let d = 1; d <= size; d += 1) if (bestCands & (1 << (d - 1))) digits.push(d);
    if (rng) {
      for (let i = digits.length - 1; i > 0; i -= 1) {
        const j = randomInt(rng, i + 1);
        const t = digits[i];
        digits[i] = digits[j];
        digits[j] = t;
      }
    }
    const r = (best / size) | 0;
    const c = best - r * size;
    const b = boxOf(r, c);
    for (let k = 0; k < digits.length; k += 1) {
      const bit = 1 << (digits[k] - 1);
      flat[best] = digits[k];
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;
      const stop = recurse();
      rowMask[r] &= ~bit;
      colMask[c] &= ~bit;
      boxMask[b] &= ~bit;
      flat[best] = 0;
      if (stop) return true;
    }
    return false;
  }

  recurse();
  return found;
}

/** Number of solutions, capped at limit. 0 if clues conflict. Throws SUDOKU_INVALID_GRID on bad shape. */
export function countSolutions(grid, size, limit = 2) {
  requireConfig(size);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new SudokuError(ERROR_CODES.INVALID_OPTION, 'limit must be an integer >= 1');
  }
  const flat = toFlat(grid, size);
  return search(flat, size, limit, null, null);
}

/** Returns a complete valid grid built with randomised candidate order. */
export function solveRandom(size, rng) {
  requireConfig(size);
  const flat = new Uint8Array(size * size);
  let result = null;
  search(flat, size, 1, rng, (s) => {
    result = s;
  });
  return toGrid(result, size);
}

/** True if every row, column and box holds 1..size exactly once. */
export function isValidSolution(grid, size) {
  const { boxRows, boxCols } = requireConfig(size);
  let flat;
  try {
    flat = toFlat(grid, size);
  } catch (e) {
    return false;
  }
  const full = (1 << size) - 1;
  const rows = new Uint16Array(size);
  const cols = new Uint16Array(size);
  const boxes = new Uint16Array(size);
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const v = flat[r * size + c];
      if (v === 0) return false;
      const bit = 1 << (v - 1);
      const b = Math.floor(r / boxRows) * (size / boxCols) + Math.floor(c / boxCols);
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
    }
  }
  for (let i = 0; i < size; i += 1) {
    if (rows[i] !== full || cols[i] !== full || boxes[i] !== full) return false;
  }
  return true;
}
