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

  // Regression check only: no key handler is wired yet (D008), so this holds by
  // construction. It must keep passing once cell input is added. The given-cell
  // guard itself is tested in game/board.test.js.
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
