import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Portfolio from '../pages/Portfolio.jsx';

describe('Portfolio Page', () => {
  it('renders Portfolio heading', () => {
    render(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>
    );
    expect(screen.getByText(/portfolio|coding portfolio/i)).toBeInTheDocument();
  });
});
