import { render, screen, fireEvent } from '@testing-library/react';
import ModeToggle from './ModeToggle';

describe('ModeToggle', () => {
  it('renders a group "Input mode" with exactly two radios, Pen checked', () => {
    render(<ModeToggle mode="pen" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Input mode' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Pen' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pencil' })).not.toBeChecked();
  });

  it('reflects pencil mode', () => {
    render(<ModeToggle mode="pencil" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Pencil' })).toBeChecked();
  });

  it('calls onChange with the chosen mode', () => {
    const onChange = jest.fn();
    render(<ModeToggle mode="pen" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Pencil' }));
    expect(onChange).toHaveBeenCalledWith('pencil');
  });

  it('calls onChange with pen when Pen is chosen from pencil', () => {
    const onChange = jest.fn();
    render(<ModeToggle mode="pencil" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Pen' }));
    expect(onChange).toHaveBeenCalledWith('pen');
  });
});
