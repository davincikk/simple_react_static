export const ERROR_CODES = Object.freeze({
  INVALID_SIZE: 'SUDOKU_INVALID_SIZE',
  INVALID_LEVEL: 'SUDOKU_INVALID_LEVEL',
  INVALID_OPTION: 'SUDOKU_INVALID_OPTION',
  INVALID_GRID: 'SUDOKU_INVALID_GRID',
  GENERATION_FAILED: 'SUDOKU_GENERATION_FAILED',
});

export class SudokuError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SudokuError';
    this.code = code;
  }
}
