import { render, screen, fireEvent } from '@testing-library/react';
import Cell from './Cell';

describe('Cell', () => {
  it('names a given cell', () => {
    render(<Cell row={0} col={1} value={5} given onSelect={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Row 1, column 2, given 5' });
    expect(btn).toHaveTextContent('5');
    expect(btn).toHaveClass('cell--given');
    expect(btn).not.toHaveClass('cell--player');
  });

  it('names a player-filled cell', () => {
    render(<Cell row={2} col={2} value={7} given={false} onSelect={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Row 3, column 3, 7' });
    expect(btn).toHaveClass('cell--player');
  });

  it('names an empty cell', () => {
    render(<Cell row={3} col={0} value={0} given={false} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'Row 4, column 1, empty' })).toHaveTextContent('');
  });

  it('calls onSelect with the zero-based row and column', () => {
    const onSelect = jest.fn();
    render(<Cell row={1} col={2} value={0} given={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(1, 2);
  });

  it('reflects selected in aria-pressed', () => {
    const { rerender } = render(<Cell row={0} col={0} value={0} given={false} onSelect={() => {}} />);
    expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument();
    rerender(<Cell row={0} col={0} value={0} given={false} selected onSelect={() => {}} />);
    const btn = screen.getByRole('button', { pressed: true });
    expect(btn).toHaveClass('cell--selected');
  });

  it('marks a filled non-given cell as pen', () => {
    render(<Cell row={0} col={0} value={4} given={false} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'Row 1, column 1, 4' })).toHaveClass('cell--pen');
  });

  it('does not mark empty or given cells as pen', () => {
    const { rerender } = render(<Cell row={0} col={0} value={0} given={false} onSelect={() => {}} />);
    expect(screen.getByRole('button')).not.toHaveClass('cell--pen');
    rerender(<Cell row={0} col={0} value={4} given onSelect={() => {}} />);
    expect(screen.getByRole('button')).not.toHaveClass('cell--pen');
  });
});
