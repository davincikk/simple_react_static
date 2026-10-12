import { render, screen, within, fireEvent } from '@testing-library/react';
import NumberPad from './NumberPad';

describe('NumberPad', () => {
  it.each([4, 6, 9])('renders exactly Digit 1..%i plus Erase', (size) => {
    render(<NumberPad size={size} onDigit={() => {}} onErase={() => {}} />);
    const pad = screen.getByRole('group', { name: 'Number pad' });
    const buttons = within(pad).getAllByRole('button');
    expect(buttons).toHaveLength(size + 1);
    for (let d = 1; d <= size; d += 1) {
      expect(within(pad).getByRole('button', { name: `Digit ${d}` })).toHaveTextContent(String(d));
    }
    expect(within(pad).queryByRole('button', { name: `Digit ${size + 1}` })).not.toBeInTheDocument();
    expect(within(pad).getByRole('button', { name: 'Erase' })).toBeInTheDocument();
    buttons.forEach((b) => expect(b).toBeEnabled());
  });

  it('calls onDigit and onErase', () => {
    const onDigit = jest.fn();
    const onErase = jest.fn();
    render(<NumberPad size={4} onDigit={onDigit} onErase={onErase} />);
    fireEvent.click(screen.getByRole('button', { name: 'Digit 3' }));
    expect(onDigit).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole('button', { name: 'Erase' }));
    expect(onErase).toHaveBeenCalledTimes(1);
  });
});
