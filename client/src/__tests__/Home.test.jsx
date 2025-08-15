import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home.jsx';

describe('Home Page', () => {
  it('renders Home heading', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
  // Look for a dashboard card or section that is always present on Home
  expect(screen.getByText(/total questions/i)).toBeInTheDocument();
  });
});
