import { render, screen } from '@testing-library/react';
import HelloWorld from './HelloWorld';

describe('HelloWorld', () => {
  it('greets the world by default', () => {
    render(<HelloWorld />);
    expect(screen.getByRole('heading', { name: 'Hello, World!' })).toBeInTheDocument();
  });

  it('greets the given name', () => {
    render(<HelloWorld name="React" />);
    expect(screen.getByRole('heading', { name: 'Hello, React!' })).toBeInTheDocument();
  });
});
