import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../pages/Landing.jsx';

describe('Landing Page', () => {
  it('renders the brand name', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/code/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/desk/i).length).toBeGreaterThan(0);
  });

  it('renders Try Question Tracker button', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
  // There may be multiple Try Question Tracker buttons
  const trackerButtons = screen.getAllByRole('button', { name: /try question tracker/i });
  expect(trackerButtons.length).toBeGreaterThan(0);
  });
});
