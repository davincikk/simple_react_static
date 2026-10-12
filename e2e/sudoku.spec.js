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
