import { render, screen } from '@testing-library/react';
import App from './App';

it('renders the HelloWorld component', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Hello, World!' })).toBeInTheDocument();
});
