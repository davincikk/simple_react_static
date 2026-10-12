import { SIZES, LEVELS, LEVEL_LABELS, BOX_DIMS, CLUE_COUNTS, GENERATION_LIMITS } from './config.js';
import { SudokuError, ERROR_CODES } from './errors.js';
import { createSeededRng } from './random.js';
import { countSolutions } from './solver.js';
import { generateWithTarget } from './generator.js';

export { SIZES, LEVELS, LEVEL_LABELS, BOX_DIMS, CLUE_COUNTS, SudokuError, ERROR_CODES, createSeededRng, countSolutions };

/**
 * @param {4|6|9} size
 * @param {'easy'|'medium'|'hard'} level
 * @param {{ rng?: () => number }} [options]
 * @returns {{size:number, level:string, boxRows:number, boxCols:number, givens:number, puzzle:number[][], solution:number[][]}}
 * @throws {SudokuError}
 */
export function generatePuzzle(size, level, options = {}) {
  if (!SIZES.includes(size)) {
    throw new SudokuError(ERROR_CODES.INVALID_SIZE, 'size must be one of 4, 6, 9');
  }
  if (!LEVELS.includes(level)) {
    throw new SudokuError(ERROR_CODES.INVALID_LEVEL, 'level must be one of easy, medium, hard');
  }
  const opts = options === null || options === undefined ? {} : options;
  if (typeof opts !== 'object') {
    throw new SudokuError(ERROR_CODES.INVALID_OPTION, 'options must be an object');
  }
  if (opts.rng !== undefined && typeof opts.rng !== 'function') {
    throw new SudokuError(ERROR_CODES.INVALID_OPTION, 'options.rng must be a function');
  }
  const rng = opts.rng || Math.random;
  const target = CLUE_COUNTS[size][level];
  const { puzzle, solution } = generateWithTarget(size, target, rng, GENERATION_LIMITS);
  return {
    size,
    level,
    boxRows: BOX_DIMS[size].rows,
    boxCols: BOX_DIMS[size].cols,
    givens: target,
    puzzle,
    solution,
  };
}
