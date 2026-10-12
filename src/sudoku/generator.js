import { SudokuError, ERROR_CODES } from './errors.js';
import { solveRandom, countSolutions } from './solver.js';
import { shuffleInPlace } from './random.js';

export function generateSolution(size, rng) {
  return solveRandom(size, rng);
}

/**
 * Removes cells one at a time (random order) keeping a unique solution, stopping exactly at target.
 * Returns { puzzle } or null if the target is not reached within limits.orderingsPerGrid passes.
 */
export function carve(solution, size, target, rng, limits) {
  const total = size * size;
  for (let pass = 0; pass < limits.orderingsPerGrid; pass += 1) {
    const puzzle = solution.map((row) => row.slice());
    const cells = shuffleInPlace(Array.from({ length: total }, (_, i) => i), rng);
    let givens = total;
    for (let k = 0; k < cells.length && givens > target; k += 1) {
      const r = Math.floor(cells[k] / size);
      const c = cells[k] % size;
      const saved = puzzle[r][c];
      puzzle[r][c] = 0;
      if (countSolutions(puzzle, size, 2) === 1) {
        givens -= 1;
      } else {
        puzzle[r][c] = saved;
      }
    }
    if (givens === target) return { puzzle };
  }
  return null;
}

/** Builds solution + carved puzzle. Throws SUDOKU_GENERATION_FAILED when attempts are exhausted. */
export function generateWithTarget(size, target, rng, limits) {
  for (let attempt = 0; attempt < limits.maxAttempts; attempt += 1) {
    const solution = generateSolution(size, rng);
    const carved = carve(solution, size, target, rng, limits);
    if (carved) return { puzzle: carved.puzzle, solution };
  }
  throw new SudokuError(ERROR_CODES.GENERATION_FAILED, 'Could not generate a puzzle with the required clue count');
}
