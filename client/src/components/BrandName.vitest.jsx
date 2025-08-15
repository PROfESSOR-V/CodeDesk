import { render, screen } from '@testing-library/react';
import BrandName from './BrandName.jsx';

describe('BrandName component (Vitest)', () => {
  it('renders the project brand name', () => {
    render(<BrandName />);
    expect(screen.getByText(/code/i)).toBeInTheDocument();
    expect(screen.getByText(/desk/i)).toBeInTheDocument();
  });
});
