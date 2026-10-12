import { render, screen, within, fireEvent } from '@testing-library/react';
import Board from './Board';
import { buildCells } from '../game/board';

const makePuzzle = (size) =>
  Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ((r + c) % 3 === 0 ? ((r + c) % size) + 1 : 0))
  );

describe('Board', () => {
  it.each([
    [4, 2, 2],
    [6, 2, 3],
    [9, 3, 3],
  ])('renders %ix%i with boxes', (size, boxRows, boxCols) => {
    render(
      <Board size={size} boxRows={boxRows} boxCols={boxCols} cells={buildCells(makePuzzle(size))} onSelect={() => {}} />
    );
    const board = screen.getByRole('group', { name: `Sudoku board, ${size}x${size}` });
    expect(within(board).getAllByRole('button')).toHaveLength(size * size);
    for (let k = 1; k <= size; k += 1) {
      const box = screen.getByRole('group', { name: `Box ${k}` });
      expect(within(box).getAllByRole('button')).toHaveLength(boxRows * boxCols);
    }
    expect(screen.queryByRole('group', { name: `Box ${size + 1}` })).not.toBeInTheDocument();
  });

  it('places Row 1, column 3 of a 6x6 board in Box 1', () => {
    render(<Board size={6} boxRows={2} boxCols={3} cells={buildCells(makePuzzle(6))} onSelect={() => {}} />);
    const box1 = screen.getByRole('group', { name: 'Box 1' });
    expect(within(box1).getByRole('button', { name: /^Row 1, column 3,/ })).toBeInTheDocument();
    const box2 = screen.getByRole('group', { name: 'Box 2' });
    expect(within(box2).getByRole('button', { name: /^Row 1, column 4,/ })).toBeInTheDocument();
  });

  it('marks the selected cell and forwards selection', () => {
    const onSelect = jest.fn();
    render(
      <Board
        size={4}
        boxRows={2}
        boxCols={2}
        cells={buildCells(makePuzzle(4))}
        selected={{ row: 1, col: 1 }}
        onSelect={onSelect}
      />
    );
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /^Row 1, column 1,/ }));
    expect(onSelect).toHaveBeenCalledWith(0, 0);
  });
});
