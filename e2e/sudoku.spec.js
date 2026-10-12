import { test, expect } from '@playwright/test';

const SIZES = [
  { n: 4, boxRows: 2, boxCols: 2 },
  { n: 6, boxRows: 2, boxCols: 3 },
  { n: 9, boxRows: 3, boxCols: 3 },
];

async function startGame(page, size, level) {
  await page.getByRole('radio', { name: `${size}x${size}` }).check();
  await page.getByRole('radio', { name: level }).check();
  await page.getByRole('button', { name: 'Start game' }).click();
}

test('setup shows exactly three sizes and three levels with defaults', async ({ page }) => {
  await page.goto('/');
  const sizes = page.getByRole('group', { name: 'Grid size' }).getByRole('radio');
  await expect(sizes).toHaveCount(3);
  for (const n of [4, 6, 9]) {
    await expect(page.getByRole('radio', { name: `${n}x${n}` })).toBeVisible();
  }
  const levels = page.getByRole('group', { name: 'Difficulty' }).getByRole('radio');
  await expect(levels).toHaveCount(3);
  for (const l of ['Easy', 'Medium', 'Hard']) {
    await expect(page.getByRole('radio', { name: l })).toBeVisible();
  }
  await expect(page.getByRole('radio', { name: '9x9' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Easy' })).toBeChecked();
});

test('start shows a generating state, then the board', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-01-01T10:01:00'));
  await startGame(page, 9, 'Hard');
  await expect(page.getByRole('status')).toHaveText('Generating puzzle…');
  await expect(page.getByRole('button', { name: 'Start game' })).toBeDisabled();
  const radios = page.getByRole('radio');
  await expect(radios).toHaveCount(6);
  for (let i = 0; i < 6; i += 1) {
    await expect(radios.nth(i)).toBeDisabled();
  }
  await page.clock.runFor(10);
  await expect(page.getByRole('group', { name: 'Sudoku board, 9x9' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'New game' })).toHaveCount(0);
});

for (const { n, boxRows, boxCols } of SIZES) {
  test(`board for ${n}x${n} has standard boxes`, async ({ page }) => {
    await page.goto('/');
    await startGame(page, n, 'Easy');
    const board = page.getByRole('group', { name: `Sudoku board, ${n}x${n}` });
    await expect(board).toBeVisible();
    await expect(board.getByRole('button')).toHaveCount(n * n);
    for (let k = 1; k <= n; k += 1) {
      await expect(board.getByRole('group', { name: `Box ${k}` }).getByRole('button')).toHaveCount(
        boxRows * boxCols
      );
    }
    await expect(board.getByRole('group', { name: `Box ${n + 1}` })).toHaveCount(0);

    const boxBorder = await board
      .getByRole('group', { name: 'Box 1' })
      .evaluate((el) => parseFloat(getComputedStyle(el).borderBottomWidth));
    const cellBorder = await board
      .getByRole('button')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).borderBottomWidth));
    expect(boxBorder).toBe(3);
    expect(boxBorder).toBeGreaterThan(cellBorder);

    // Edges and box lines are a single 3px line, not two stacked borders.
    const boardEdge = await board.evaluate((el) => {
      const s = getComputedStyle(el);
      return { top: parseFloat(s.borderTopWidth), left: parseFloat(s.borderLeftWidth) };
    });
    expect(boardEdge).toEqual({ top: 3, left: 3 });
    const boxes = board.getByRole('group', { name: /^Box \d+$/ });
    const widths = await boxes.evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el);
        return { top: parseFloat(s.borderTopWidth), left: parseFloat(s.borderLeftWidth) };
      })
    );
    widths.forEach((w) => expect(w).toEqual({ top: 0, left: 0 }));
  });
}

test('given cells are fixed and visually distinct', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 4, 'Easy');
  const board = page.getByRole('group', { name: 'Sudoku board, 4x4' });
  await expect(board).toBeVisible();

  const given = board.getByRole('button', { name: /given/ }).first();
  const empty = board.getByRole('button', { name: /empty/ }).first();
  const name = await given.getAttribute('aria-label');
  const text = await given.textContent();

  await given.click();
  for (const key of ['1', 'Backspace', 'Delete']) {
    await page.keyboard.press(key);
  }
  await expect(given).toHaveAttribute('aria-pressed', 'true');
  await expect(given).toHaveAttribute('aria-label', name);
  await expect(given).toHaveText(text);

  const style = (loc) =>
    loc.evaluate((el) => {
      const s = getComputedStyle(el);
      return { weight: parseInt(s.fontWeight, 10), bg: s.backgroundColor };
    });
  const g = await style(given);
  const e = await style(empty);
  expect(g.weight).toBeGreaterThanOrEqual(700);
  expect(e.weight).toBeLessThan(700);
  expect(g.bg).not.toBe(e.bg);
});

// ---- SCRUM-8: enter, overwrite and erase pen answers ----

const boardOf = (page, n) => page.getByRole('group', { name: `Sudoku board, ${n}x${n}` });
const padOf = (page) => page.getByRole('group', { name: 'Number pad' });
const GAME_KEYS = ['0', '7', '8', '9', 'a', 'x'];

async function readCells(board) {
  return board.getByRole('button').evaluateAll((els) =>
    els.map((el) => {
      const m = /^Row (\d+), column (\d+), (empty|given (\d)|(\d))$/.exec(el.getAttribute('aria-label'));
      return {
        row: Number(m[1]),
        col: Number(m[2]),
        state: m[3] === 'empty' ? 'empty' : m[4] ? 'given' : 'pen',
        digit: m[4] || m[5] || null,
      };
    })
  );
}

const cellLoc = (board, row, col) =>
  board.getByRole('button', { name: new RegExp(`^Row ${row}, column ${col},`) });

const expectOnePressed = async (board) => {
  await expect(board.locator('button[aria-pressed="true"]')).toHaveCount(1);
};

const styleOf = (loc) =>
  loc.evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, bg: s.backgroundColor, outline: s.outlineStyle };
  });

const snapshotExcept = async (board, skipRow, skipCol, n) => {
  const out = {};
  for (let r = 1; r <= n; r += 1) {
    for (let c = 1; c <= n; c += 1) {
      if (r !== skipRow || c !== skipCol) out[`${r},${c}`] = await styleOf(cellLoc(board, r, c));
    }
  }
  return out;
};

test('AC-1: enters a pen value by keyboard and by pad, in ink style', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 4, 'Easy');
  const board = boardOf(page, 4);
  const empties = (await readCells(board)).filter((c) => c.state === 'empty');
  expect(empties.length).toBeGreaterThanOrEqual(2);
  const [a, b] = empties;

  await cellLoc(board, a.row, a.col).click();
  await page.keyboard.press('3');
  const first = cellLoc(board, a.row, a.col);
  await expect(first).toHaveAccessibleName(`Row ${a.row}, column ${a.col}, 3`);
  const ink = await first.evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, weight: parseInt(s.fontWeight, 10) };
  });
  const given = board.getByRole('button', { name: /given/ }).first();
  const givenColor = await given.evaluate((el) => getComputedStyle(el).color);
  expect(ink.color).not.toBe(givenColor);
  expect(ink.weight).toBe(400);

  await cellLoc(board, b.row, b.col).click();
  await padOf(page).getByRole('button', { name: 'Digit 2' }).click();
  await expect(cellLoc(board, b.row, b.col)).toHaveAccessibleName(`Row ${b.row}, column ${b.col}, 2`);
  await expect(board.locator('[aria-pressed="true"]')).toHaveCount(1);
});

test('D004: Pencil mode makes digits a no-op', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 4, 'Easy');
  const board = boardOf(page, 4);
  await expect(page.getByRole('radio', { name: 'Pen', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Pencil', exact: true }).check();
  const [a] = (await readCells(board)).filter((c) => c.state === 'empty');
  await cellLoc(board, a.row, a.col).click();
  await page.keyboard.press('1');
  await padOf(page).getByRole('button', { name: 'Digit 1' }).click();
  await expect(cellLoc(board, a.row, a.col)).toHaveAccessibleName(/empty$/);
  await page.getByRole('radio', { name: 'Pen', exact: true }).check();
  await page.keyboard.press('1');
  await expect(cellLoc(board, a.row, a.col)).toHaveAccessibleName(/, 1$/);
});

test('AC-2: invalid keys are ignored and the pad offers only 1..N on 6x6', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 6, 'Easy');
  const board = boardOf(page, 6);
  const [a] = (await readCells(board)).filter((c) => c.state === 'empty');
  await cellLoc(board, a.row, a.col).click();
  for (const key of GAME_KEYS) {
    await page.keyboard.press(key);
  }
  await expect(cellLoc(board, a.row, a.col)).toHaveAccessibleName(/empty$/);
  await expect(padOf(page).getByRole('button')).toHaveCount(7);
  for (let d = 1; d <= 6; d += 1) {
    await expect(padOf(page).getByRole('button', { name: `Digit ${d}` })).toBeVisible();
  }
  await expect(padOf(page).getByRole('button', { name: 'Digit 7' })).toHaveCount(0);
});

test('AC-3: overwrites an answer by keyboard and by pad on 9x9', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 9, 'Easy');
  const board = boardOf(page, 9);
  const [a] = (await readCells(board)).filter((c) => c.state === 'empty');
  await cellLoc(board, a.row, a.col).click();
  await page.keyboard.press('3');
  await page.keyboard.press('5');
  await expect(cellLoc(board, a.row, a.col)).toHaveAccessibleName(/, 5$/);
  await padOf(page).getByRole('button', { name: 'Digit 7' }).click();
  await expect(cellLoc(board, a.row, a.col)).toHaveAccessibleName(/, 7$/);
});

test('AC-4: erases with Delete, Backspace and the Erase button', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 4, 'Easy');
  const board = boardOf(page, 4);
  const [a] = (await readCells(board)).filter((c) => c.state === 'empty');
  const cell = cellLoc(board, a.row, a.col);
  await cell.click();
  for (const erase of ['Delete', 'Backspace', 'Erase']) {
    await page.keyboard.press('2');
    await expect(cell).toHaveAccessibleName(/, 2$/);
    if (erase === 'Erase') await padOf(page).getByRole('button', { name: 'Erase' }).click();
    else await page.keyboard.press(erase);
    await expect(cell).toHaveAccessibleName(/empty$/);
  }
  // Focus path: after a pad click, focus is on the pad and Delete still erases.
  await padOf(page).getByRole('button', { name: 'Digit 2' }).click();
  await expect(cell).toHaveAccessibleName(/, 2$/);
  await page.keyboard.press('Delete');
  await expect(cell).toHaveAccessibleName(/empty$/);
});

test('AC-5: a duplicate of a given digit is accepted with no feedback', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 9, 'Hard');
  const board = boardOf(page, 9);
  const cells = await readCells(board);
  const target = cells.find(
    (c) => c.state === 'empty' && cells.some((o) => o.row === c.row && o.state === 'given')
  );
  expect(target, 'precondition: an empty cell shares a row with a given').toBeDefined();
  const given = cells.find((o) => o.row === target.row && o.state === 'given');
  await cellLoc(board, target.row, target.col).click();
  const before = await snapshotExcept(board, target.row, target.col, 9);
  await page.keyboard.press(given.digit);
  await expect(cellLoc(board, target.row, target.col)).toHaveAccessibleName(
    `Row ${target.row}, column ${target.col}, ${given.digit}`
  );
  expect(await snapshotExcept(board, target.row, target.col, 9)).toEqual(before);
  await expectOnePressed(board);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('AC-5: a duplicate of a pen digit is accepted with no feedback', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 9, 'Hard');
  const board = boardOf(page, 9);
  const cells = await readCells(board);
  const rowOf = (r) => cells.filter((c) => c.row === r && c.state === 'empty');
  const givenDigits = (r) => cells.filter((c) => c.row === r && c.state === 'given').map((c) => c.digit);
  const row = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((r) => rowOf(r).length >= 3);
  expect(row, 'precondition: a row with at least 3 empty cells').toBeDefined();
  // Pick a digit that is NOT a given in this row, so the duplicate is pen-only.
  const digit = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].find((d) => !givenDigits(row).includes(d));
  expect(digit, 'precondition: a digit with no given in the row').toBeDefined();
  expect(givenDigits(row)).not.toContain(digit);
  const [first, second, third] = rowOf(row);
  await cellLoc(board, first.row, first.col).click();
  await page.keyboard.press(digit);
  await expect(cellLoc(board, first.row, first.col)).toHaveAccessibleName(new RegExp(`, ${digit}$`));
  await cellLoc(board, second.row, second.col).click();
  const before = await snapshotExcept(board, second.row, second.col, 9);
  await padOf(page).getByRole('button', { name: `Digit ${digit}` }).click();
  await expect(cellLoc(board, second.row, second.col)).toHaveAccessibleName(new RegExp(`, ${digit}$`));
  await expect(cellLoc(board, first.row, first.col)).toHaveAccessibleName(new RegExp(`, ${digit}$`));
  expect(await snapshotExcept(board, second.row, second.col, 9)).toEqual(before);
  await expect(cellLoc(board, third.row, third.col)).toHaveAccessibleName(/empty$/);
  await expectOnePressed(board);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('keyboard-only flow: Enter selects, a digit enters, Backspace erases', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 4, 'Easy');
  const board = boardOf(page, 4);
  const [a] = (await readCells(board)).filter((c) => c.state === 'empty');
  const cell = cellLoc(board, a.row, a.col);
  await cell.focus();
  await page.keyboard.press('Enter');
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('2');
  await expect(cell).toHaveAccessibleName(/, 2$/);
  await page.keyboard.press('Backspace');
  await expect(cell).toHaveAccessibleName(/empty$/);
});
