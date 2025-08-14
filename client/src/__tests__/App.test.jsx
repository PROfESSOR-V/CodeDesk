import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders CodeDesk brand name', () => {
  render(<App />);
  expect(screen.getByText(/CodeDesk/i)).toBeInTheDocument();
});
