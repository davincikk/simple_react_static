import * as boardModule from './board';
import { buildCells, groupIntoBoxes, applyCellInput } from './board';

const makePuzzle = (size) =>
  Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ((r + c) % 2 === 0 ? ((r + c) % size) + 1 : 0))
  );

describe('buildCells', () => {
  it('flags given exactly where the value is not 0', () => {
    const cells = buildCells([
      [1, 0],
      [0, 2],
    ]);
    expect(cells[0][0]).toEqual({ row: 0, col: 0, value: 1, given: true });
    expect(cells[0][1]).toEqual({ row: 0, col: 1, value: 0, given: false });
    expect(cells[1][0].given).toBe(false);
    expect(cells[1][1].given).toBe(true);
  });
});

describe('groupIntoBoxes', () => {
  it.each([
    [4, 2, 2],
    [6, 2, 3],
    [9, 3, 3],
  ])('groups %ix%i into boxes of equal size', (size, boxRows, boxCols) => {
    const boxes = groupIntoBoxes(buildCells(makePuzzle(size)), boxRows, boxCols);
    expect(boxes).toHaveLength(size);
    boxes.forEach((box) => expect(box).toHaveLength(size));
    const seen = new Set(boxes.flat().map((c) => `${c.row},${c.col}`));
    expect(seen.size).toBe(size * size);
  });

  it('uses 2 rows x 3 columns boxes for 6x6 in reading order', () => {
    const boxes = groupIntoBoxes(buildCells(makePuzzle(6)), 2, 3);
    expect(boxes[0].map((c) => [c.row, c.col])).toEqual([
      [0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2],
    ]);
    expect(boxes[1].map((c) => [c.row, c.col])).toEqual([
      [0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [1, 5],
    ]);
    expect(boxes[2][0]).toMatchObject({ row: 2, col: 0 });
  });
});

describe('applyCellInput', () => {
  const cells = buildCells([
    [1, 0],
    [0, 2],
  ]);
  const snapshot = JSON.stringify(cells);

  it.each([
    [{ type: 'digit', value: 2 }],
    [{ type: 'note', value: 2 }],
    [{ type: 'erase' }],
  ])('returns the same reference for a given cell: %j', (input) => {
    expect(applyCellInput(cells, 0, 0, input)).toBe(cells);
  });

  it('sets a digit on a non-given cell without mutating the input', () => {
    const next = applyCellInput(cells, 0, 1, { type: 'digit', value: 2 });
    expect(next).not.toBe(cells);
    expect(next[0][1].value).toBe(2);
    expect(next[1]).toBe(cells[1]);
    expect(JSON.stringify(cells)).toBe(snapshot);
  });

  it('erases a player value', () => {
    const filled = applyCellInput(cells, 0, 1, { type: 'digit', value: 2 });
    const erased = applyCellInput(filled, 0, 1, { type: 'erase' });
    expect(erased[0][1].value).toBe(0);
    expect(filled[0][1].value).toBe(2);
  });

  it('treats notes and missing input as a no-op', () => {
    expect(applyCellInput(cells, 0, 1, { type: 'note', value: 3 })).toBe(cells);
    expect(applyCellInput(cells, 0, 1, undefined)).toBe(cells);
  });

  it('ignores out-of-range targets', () => {
    expect(applyCellInput(cells, 5, 5, { type: 'digit', value: 1 })).toBe(cells);
  });

  it.each([[0], [3], [1.5], [NaN], ['1'], [null], [Infinity]])(
    'ignores digit value %p outside integer 1..N (N = 2)',
    (value) => {
      expect(applyCellInput(cells, 0, 1, { type: 'digit', value })).toBe(cells);
    }
  );

  it('ignores N+1 and a string digit on a 4x4 grid', () => {
    const grid = buildCells(makePuzzle(4));
    const empty = grid.flat().find((c) => !c.given);
    [5, 0, '3', 2.5, NaN].forEach((value) => {
      expect(applyCellInput(grid, empty.row, empty.col, { type: 'digit', value })).toBe(grid);
    });
  });

  it('overwrites 3 with 5 on a 9x9 grid', () => {
    const grid = buildCells(Array.from({ length: 9 }, () => Array(9).fill(0)));
    const three = applyCellInput(grid, 0, 0, { type: 'digit', value: 3 });
    const five = applyCellInput(three, 0, 0, { type: 'digit', value: 5 });
    expect(three[0][0].value).toBe(3);
    expect(five[0][0].value).toBe(5);
    expect(five).not.toBe(three);
  });

  it('returns the same reference when the value does not change', () => {
    const filled = applyCellInput(cells, 0, 1, { type: 'digit', value: 2 });
    expect(applyCellInput(filled, 0, 1, { type: 'digit', value: 2 })).toBe(filled);
  });

  it('returns the same reference when erasing an empty cell', () => {
    expect(applyCellInput(cells, 0, 1, { type: 'erase' })).toBe(cells);
  });

  it('ignores unknown input types', () => {
    expect(applyCellInput(cells, 0, 1, { type: 'bogus', value: 1 })).toBe(cells);
  });
});

describe('module surface (AC-5: no conflict or completion API)', () => {
  it('exports only buildCells, groupIntoBoxes and applyCellInput', () => {
    expect(Object.keys(boardModule).sort()).toEqual(['applyCellInput', 'buildCells', 'groupIntoBoxes']);
  });
});
