import { render, screen, within, fireEvent } from '@testing-library/react';
import SetupScreen from './SetupScreen';

describe('SetupScreen', () => {
  it('offers exactly three sizes and three levels with defaults', () => {
    render(<SetupScreen onStart={() => {}} />);
    const sizes = within(screen.getByRole('group', { name: 'Grid size' })).getAllByRole('radio');
    expect(sizes.map((r) => r.labels[0].textContent)).toEqual(['4x4', '6x6', '9x9']);
    const levels = within(screen.getByRole('group', { name: 'Difficulty' })).getAllByRole('radio');
    expect(levels.map((r) => r.labels[0].textContent)).toEqual(['Easy', 'Medium', 'Hard']);
    expect(screen.getByRole('radio', { name: '9x9' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeChecked();
    expect(screen.getByRole('heading', { name: 'New game' })).toBeInTheDocument();
  });

  it('passes the chosen size and level to onStart', () => {
    const onStart = jest.fn();
    render(<SetupScreen onStart={onStart} />);
    fireEvent.click(screen.getByRole('radio', { name: '6x6' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Hard' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    expect(onStart).toHaveBeenCalledWith(6, 'hard');
  });

  it('disables everything and shows status while busy', () => {
    const onStart = jest.fn();
    render(<SetupScreen onStart={onStart} busy />);
    expect(screen.getAllByRole('radio')).toHaveLength(6);
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
    const start = screen.getByRole('button', { name: 'Start game' });
    expect(start).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Generating puzzle…');
    fireEvent.click(start);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('has an empty status and enabled controls when idle', () => {
    render(<SetupScreen onStart={() => {}} busy={false} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'Start game' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps selections when busy toggles', () => {
    const { rerender } = render(<SetupScreen onStart={() => {}} />);
    fireEvent.click(screen.getByRole('radio', { name: '4x4' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Medium' }));
    rerender(<SetupScreen onStart={() => {}} busy />);
    rerender(<SetupScreen onStart={() => {}} busy={false} />);
    expect(screen.getByRole('radio', { name: '4x4' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
  });

  it('renders the error as an alert', () => {
    render(<SetupScreen onStart={() => {}} error="Boom" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
  });
});
