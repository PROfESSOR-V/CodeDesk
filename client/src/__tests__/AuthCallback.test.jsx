import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthCallback from '../pages/AuthCallback.jsx';

describe('AuthCallback Page', () => {
  it('renders Auth Callback', () => {
    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );
  // The AuthCallback page shows 'Verifying...'
  expect(screen.getByText(/verifying/i)).toBeInTheDocument();
  });
});
