/** @jest-environment node */
import { SIZES, LEVELS, LEVEL_LABELS, BOX_DIMS, CLUE_COUNTS, GENERATION_LIMITS, getSizeConfig } from './config.js';
import { SudokuError, ERROR_CODES } from './errors.js';

describe('config', () => {
  test('sizes, levels and labels', () => {
    expect(SIZES).toEqual([4, 6, 9]);
    expect(LEVELS).toEqual(['easy', 'medium', 'hard']);
    expect(LEVEL_LABELS).toEqual({ easy: 'Easy', medium: 'Medium', hard: 'Hard' });
  });

  test('box dims are 2x2, 2 rows x 3 cols, 3x3 and tile the board', () => {
    expect(BOX_DIMS[4]).toEqual({ rows: 2, cols: 2 });
    expect(BOX_DIMS[6]).toEqual({ rows: 2, cols: 3 });
    expect(BOX_DIMS[9]).toEqual({ rows: 3, cols: 3 });
    SIZES.forEach((n) => expect(BOX_DIMS[n].rows * BOX_DIMS[n].cols).toBe(n));
  });

  test('clue counts equal the AC-3 table exactly', () => {
    expect(CLUE_COUNTS).toEqual({
      4: { easy: 8, medium: 6, hard: 5 },
      6: { easy: 18, medium: 14, hard: 11 },
      9: { easy: 40, medium: 32, hard: 25 },
    });
  });

  test('tables are frozen', () => {
    expect(Object.isFrozen(SIZES)).toBe(true);
    expect(Object.isFrozen(CLUE_COUNTS[9])).toBe(true);
    expect(Object.isFrozen(BOX_DIMS[6])).toBe(true);
    expect(Object.isFrozen(GENERATION_LIMITS)).toBe(true);
  });

  test('getSizeConfig', () => {
    expect(getSizeConfig(6)).toEqual({ size: 6, boxRows: 2, boxCols: 3 });
    expect(getSizeConfig(5)).toBeNull();
    expect(getSizeConfig('9')).toBeNull();
  });

  test('SudokuError carries a code', () => {
    const e = new SudokuError(ERROR_CODES.INVALID_SIZE, 'bad');
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe('SUDOKU_INVALID_SIZE');
    expect(e.name).toBe('SudokuError');
    expect(Object.isFrozen(ERROR_CODES)).toBe(true);
  });
});
