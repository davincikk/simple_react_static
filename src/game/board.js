/**
 * Pure board model helpers. Cells are { row, col, value, given } (0-based row/col, 0 = empty).
 */

export function buildCells(puzzle) {
  return puzzle.map((rowValues, row) =>
    rowValues.map((value, col) => ({ row, col, value, given: value !== 0 }))
  );
}

/**
 * Groups cells into boxes, in row-major box order; each box lists its cells in row-major order.
 */
export function groupIntoBoxes(cells, boxRows, boxCols) {
  const size = cells.length;
  const boxesPerRow = size / boxCols;
  const boxes = Array.from({ length: (size / boxRows) * boxesPerRow }, () => []);
  cells.forEach((rowCells, r) => {
    rowCells.forEach((cell, c) => {
      const index = Math.floor(r / boxRows) * boxesPerRow + Math.floor(c / boxCols);
      boxes[index].push(cell);
    });
  });
  return boxes;
}

/**
 * Immutability guard. Returns the same reference when the target is given (or the input is a
 * no-op); otherwise returns a new grid. Never mutates its input.
 */
export function applyCellInput(cells, row, col, input) {
  const target = cells[row] && cells[row][col];
  if (!target || target.given || !input) return cells;
  let value;
  if (input.type === 'digit') value = input.value;
  else if (input.type === 'erase') value = 0;
  else return cells;
  return cells.map((rowCells, r) =>
    r === row ? rowCells.map((cell, c) => (c === col ? { ...cell, value } : cell)) : rowCells
  );
}
