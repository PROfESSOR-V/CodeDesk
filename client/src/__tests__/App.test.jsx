import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders CodeDesk brand name', () => {
  render(<App />);
  // There may be multiple 'Code' and 'Desk' elements, so use getAllByText
  const codeElements = screen.getAllByText(/code/i);
  const deskElements = screen.getAllByText(/desk/i);
  expect(codeElements.length).toBeGreaterThan(0);
  expect(deskElements.length).toBeGreaterThan(0);
});
