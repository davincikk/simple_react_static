import { StrictMode } from 'react';
import { render, screen, within, fireEvent, act, waitFor } from '@testing-library/react';
import App from './App';
import { generatePuzzle } from './sudoku';

jest.mock('./sudoku', () => {
  const actual = jest.requireActual('./sudoku');
  return { ...actual, generatePuzzle: jest.fn(actual.generatePuzzle) };
});

const realGenerate = jest.requireActual('./sudoku').generatePuzzle;

beforeEach(() => {
  generatePuzzle.mockClear();
  generatePuzzle.mockImplementation(realGenerate);
});

afterEach(() => {
  jest.useRealTimers();
});

const runTimers = () => act(() => jest.runOnlyPendingTimers());
const start = () => fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

describe('App (fake timers)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('opens on the setup screen', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument();
    expect(screen.queryByText('Hello, World!')).not.toBeInTheDocument();
  });

  it('shows a generating state before generating', () => {
    render(<App />);
    start();
    expect(screen.getByRole('status')).toHaveTextContent('Generating puzzle…');
    expect(screen.getByRole('button', { name: 'Start game' })).toBeDisabled();
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
    expect(generatePuzzle).not.toHaveBeenCalled();
    expect(screen.queryByRole('group', { name: /Sudoku board/ })).not.toBeInTheDocument();
    runTimers();
    expect(generatePuzzle).toHaveBeenCalledTimes(1);
    expect(generatePuzzle).toHaveBeenCalledWith(9, 'easy');
  });

  it('re-entry guard: two starts in the same tick schedule one generation', () => {
    render(<App />);
    // Both clicks land before React re-renders the button as disabled,
    // so the second one reaches handleStart and must be stopped by the guard.
    act(() => {
      start();
      start();
    });
    expect(screen.getByRole('button', { name: 'Start game' })).toBeDisabled();
    runTimers();
    expect(generatePuzzle).toHaveBeenCalledTimes(1);
  });

  it('starts a 4x4 Easy game with 16 cells in 4 boxes', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: '4x4' }));
    start();
    runTimers();
    expect(screen.getByRole('heading', { name: '4x4 · Easy' })).toBeInTheDocument();
    const board = screen.getByRole('group', { name: 'Sudoku board, 4x4' });
    expect(within(board).getAllByRole('button')).toHaveLength(16);
    for (let k = 1; k <= 4; k += 1) {
      expect(screen.getByRole('group', { name: `Box ${k}` })).toBeInTheDocument();
    }
    expect(screen.queryByRole('heading', { name: 'New game' })).not.toBeInTheDocument();
  });

  it('shows an error, re-enables controls and keeps choices when generation fails', () => {
    generatePuzzle.mockImplementationOnce(() => {
      throw new Error('x');
    });
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: '4x4' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Medium' }));
    start();
    runTimers();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not create a puzzle. Please try again.');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'Start game' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: '4x4' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    expect(screen.queryByRole('group', { name: /Sudoku board/ })).not.toBeInTheDocument();

    start();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    runTimers();
    expect(screen.getByRole('heading', { name: '4x4 · Medium' })).toBeInTheDocument();
  });

  it('never generates when unmounted while pending', () => {
    const { unmount } = render(<App />);
    start();
    unmount();
    expect(() => act(() => jest.runAllTimers())).not.toThrow();
    expect(generatePuzzle).not.toHaveBeenCalled();
  });

  it('generates exactly once under StrictMode', () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    start();
    runTimers();
    expect(generatePuzzle).toHaveBeenCalledTimes(1);
  });

  // Regression check: the document key handler is wired (SCRUM-8); this checks that the
  // guard keeps given cells unchanged through the real input path. The guard itself is
  // tested in game/board.test.js.
  it('regression: key presses leave a selected given cell unchanged', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: '4x4' }));
    start();
    runTimers();
    const given = screen.getAllByRole('button', { name: /given/ })[0];
    const name = given.getAttribute('aria-label');
    const text = given.textContent;
    fireEvent.click(given);
    expect(given).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(given, { key: '1' });
    fireEvent.keyDown(given, { key: 'Backspace' });
    expect(given).toHaveAttribute('aria-label', name);
    expect(given).toHaveTextContent(text);
  });
});

const zeros = (n) => Array.from({ length: n }, () => Array(n).fill(0));
const FIX_4 = [
  [4, 0, 0, 0],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 2],
];
const FIX_6 = zeros(6);
FIX_6[0][1] = 2;
FIX_6[3][3] = 5;
const FIX_9 = zeros(9);
FIX_9[0][1] = 2;
FIX_9[4][4] = 7;

const startWith = (puzzle, boxRows, boxCols) => {
  generatePuzzle.mockImplementationOnce(() => ({ puzzle, solution: puzzle, boxRows, boxCols }));
  fireEvent.click(screen.getByRole('radio', { name: `${puzzle.length}x${puzzle.length}` }));
  start();
  runTimers();
};
const cellAt = (r, c) => screen.getByRole('button', { name: new RegExp(`^Row ${r}, column ${c},`) });
const press = (key, init = {}) => fireEvent.keyDown(document.body, { key, ...init });
const pad = (name) => fireEvent.click(screen.getByRole('button', { name }));
const boardButtons = () =>
  within(screen.getByRole('group', { name: /Sudoku board/ })).getAllByRole('button');
const classSnapshot = () => boardButtons().map((b) => b.className);
const pressedCount = () =>
  boardButtons().filter((b) => b.getAttribute('aria-pressed') === 'true').length;
const noFeedback = () => {
  expect(screen.queryAllByRole('alert')).toHaveLength(0);
  expect(screen.queryAllByRole('status')).toHaveLength(0);
};

describe('App cell input (fake timers)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('enters a pen value by keyboard and by pad (AC-1)', () => {
    render(<App />);
    startWith(FIX_4, 2, 2);
    fireEvent.click(cellAt(1, 2));
    press('3');
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, 3');
    expect(cellAt(1, 2)).toHaveClass('cell--pen');
    fireEvent.click(cellAt(1, 3));
    pad('Digit 2');
    expect(cellAt(1, 3)).toHaveAccessibleName('Row 1, column 3, 2');
    expect(pressedCount()).toBe(1);
  });

  it('Pencil mode makes digits a no-op, Pen applies again (D004)', () => {
    render(<App />);
    startWith(FIX_4, 2, 2);
    expect(screen.getByRole('radio', { name: 'Pen' })).toBeChecked();
    fireEvent.click(cellAt(1, 2));
    fireEvent.click(screen.getByRole('radio', { name: 'Pencil' }));
    press('3');
    pad('Digit 3');
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, empty');
    fireEvent.click(screen.getByRole('radio', { name: 'Pen' }));
    press('3');
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, 3');
  });

  it('Erase clears a pen value in Pencil mode (D010)', () => {
    render(<App />);
    startWith(FIX_4, 2, 2);
    fireEvent.click(cellAt(1, 2));
    press('3');
    fireEvent.click(screen.getByRole('radio', { name: 'Pencil' }));
    pad('Erase');
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, empty');
    press('3');
    press('Delete');
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, empty');
  });

  it('ignores invalid keys on 6x6 and offers only Digit 1..6 (AC-2)', () => {
    render(<App />);
    startWith(FIX_6, 2, 3);
    fireEvent.click(cellAt(1, 1));
    ['0', '7', '8', '9', 'a', 'x'].forEach((k) => press(k));
    expect(cellAt(1, 1)).toHaveAccessibleName('Row 1, column 1, empty');
    const padGroup = screen.getByRole('group', { name: 'Number pad' });
    expect(within(padGroup).getAllByRole('button')).toHaveLength(7);
    expect(within(padGroup).queryByRole('button', { name: 'Digit 7' })).not.toBeInTheDocument();
    press('6');
    expect(cellAt(1, 1)).toHaveAccessibleName('Row 1, column 1, 6');
  });

  it('overwrites 3 with 5 by keyboard and by pad (AC-3)', () => {
    render(<App />);
    startWith(FIX_9, 3, 3);
    fireEvent.click(cellAt(1, 1));
    press('3');
    press('5');
    expect(cellAt(1, 1)).toHaveAccessibleName('Row 1, column 1, 5');
    pad('Digit 3');
    pad('Digit 5');
    expect(cellAt(1, 1)).toHaveAccessibleName('Row 1, column 1, 5');
    pad('Digit 8');
    expect(cellAt(1, 1)).toHaveAccessibleName('Row 1, column 1, 8');
  });

  it.each([
    ['Delete', () => press('Delete')],
    ['Backspace', () => press('Backspace')],
    ['Erase button', () => pad('Erase')],
  ])('erases a pen value with %s (AC-4)', (_name, erase) => {
    render(<App />);
    startWith(FIX_4, 2, 2);
    fireEvent.click(cellAt(1, 2));
    press('2');
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, 2');
    erase();
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, empty');
  });

  it('erases with Delete while focus is on the number pad (AC-4 focus path)', () => {
    render(<App />);
    startWith(FIX_4, 2, 2);
    fireEvent.click(cellAt(1, 2));
    const two = screen.getByRole('button', { name: 'Digit 2' });
    fireEvent.click(two);
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, 2');
    fireEvent.keyDown(two, { key: 'Delete' });
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, empty');
  });

  it('accepts a duplicate of a given digit with no feedback (AC-5, given variant)', () => {
    render(<App />);
    startWith(FIX_4, 2, 2);
    fireEvent.click(cellAt(1, 3));
    const before = classSnapshot();
    press('4');
    expect(cellAt(1, 3)).toHaveAccessibleName('Row 1, column 3, 4');
    noFeedback();
    expect(pressedCount()).toBe(1);
    const allowed = ['cell', 'cell--given', 'cell--player', 'cell--pen', 'cell--selected'];
    const target = cellAt(1, 3);
    boardButtons().forEach((b, i) => {
      b.className.split(' ').forEach((c) => expect(allowed).toContain(c));
      if (b !== target) expect(b.className).toBe(before[i]);
    });
  });

  it('accepts a pen-only duplicate (no given of that digit in the row) with no feedback (AC-5, pen variant)', () => {
    render(<App />);
    startWith(FIX_4, 2, 2);
    // Row 2 is [0, 0, 1, 0]: it holds a given 1 but no given 4, so the duplicate 4 is pen-only.
    fireEvent.click(cellAt(2, 1));
    press('4');
    expect(cellAt(2, 1)).toHaveAccessibleName('Row 2, column 1, 4');
    fireEvent.click(cellAt(2, 2));
    const before = classSnapshot();
    pad('Digit 4');
    expect(cellAt(2, 2)).toHaveAccessibleName('Row 2, column 2, 4');
    expect(cellAt(2, 1)).toHaveAccessibleName('Row 2, column 1, 4');
    expect(cellAt(2, 3)).toHaveAccessibleName('Row 2, column 3, given 1');
    noFeedback();
    expect(pressedCount()).toBe(1);
    const allowed = ['cell', 'cell--given', 'cell--player', 'cell--pen', 'cell--selected'];
    const target = cellAt(2, 2);
    boardButtons().forEach((b, i) => {
      b.className.split(' ').forEach((c) => expect(allowed).toContain(c));
      if (b !== target) expect(b.className).toBe(before[i]);
    });
  });

  describe('document keydown listener', () => {
    let add;
    let remove;
    const net = () => {
      const n = (spy) => spy.mock.calls.filter(([type]) => type === 'keydown').length;
      return n(add) - n(remove);
    };
    beforeEach(() => {
      add = jest.spyOn(document, 'addEventListener');
      remove = jest.spyOn(document, 'removeEventListener');
    });
    afterEach(() => {
      add.mockRestore();
      remove.mockRestore();
    });

    it('applies a key once under StrictMode with exactly one active listener', () => {
      render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      expect(net()).toBe(0);
      startWith(FIX_4, 2, 2);
      expect(net()).toBe(1);
      fireEvent.click(cellAt(1, 2));
      press('1');
      expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, 1');
      press('2');
      expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, 2');
      expect(net()).toBe(1);
    });

    it('has one keydown listener only while playing and none after unmount', () => {
      const { unmount } = render(<App />);
      expect(net()).toBe(0);
      expect(() => press('1')).not.toThrow();
      startWith(FIX_4, 2, 2);
      expect(net()).toBe(1);
      unmount();
      expect(net()).toBe(0);
    });
  });

  it('ignores digits with no selection and modified keys', () => {
    render(<App />);
    startWith(FIX_4, 2, 2);
    const names = () => boardButtons().map((b) => b.getAttribute('aria-label'));
    const before = names();
    press('1');
    pad('Digit 1');
    pad('Erase');
    expect(names()).toEqual(before);
    noFeedback();
    fireEvent.click(cellAt(1, 2));
    press('1', { ctrlKey: true });
    expect(cellAt(1, 2)).toHaveAccessibleName('Row 1, column 2, empty');
  });

  it('does not change a given cell via the pad', () => {
    render(<App />);
    startWith(FIX_4, 2, 2);
    fireEvent.click(cellAt(1, 1));
    pad('Digit 1');
    pad('Erase');
    expect(cellAt(1, 1)).toHaveAccessibleName('Row 1, column 1, given 4');
  });
});

describe('App (real timers)', () => {
  it('starts a 4x4 Easy game once generation completes', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: '4x4' }));
    start();
    const board = await waitFor(() => screen.getByRole('group', { name: 'Sudoku board, 4x4' }));
    expect(within(board).getAllByRole('button')).toHaveLength(16);
    expect(screen.getByRole('heading', { name: '4x4 · Easy' })).toBeInTheDocument();
  });
});
