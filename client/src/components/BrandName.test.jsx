import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrandName from './BrandName.jsx';

describe('BrandName component', () => {
  it('renders the project brand name', () => {
    render(<BrandName />);
    // Adjust the text below to match what your BrandName component actually renders
  // The brand is split as 'Code' and 'Desk' in separate spans
  expect(screen.getByText(/code/i)).toBeInTheDocument();
  expect(screen.getByText(/desk/i)).toBeInTheDocument();
  });
});
