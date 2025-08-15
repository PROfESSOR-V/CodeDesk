import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login.jsx';

describe('Login Page', () => {
  it('renders the login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  // The main sign in button is the first with name /sign in/i
  const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
  expect(signInButtons.length).toBeGreaterThan(0);
  });
});
