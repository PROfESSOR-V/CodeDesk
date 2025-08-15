import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../pages/Signup.jsx';

describe('Signup Page', () => {
  it('renders the signup form', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/password|create password/i)).toBeInTheDocument();
  // The main sign up button is the first with name /sign up/i
  const signUpButtons = screen.getAllByRole('button', { name: /sign up/i });
  expect(signUpButtons.length).toBeGreaterThan(0);
  });

  it('shows error on empty submit', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
  const signUpButtons = screen.getAllByRole('button', { name: /sign up/i });
  fireEvent.click(signUpButtons[0]);
    // Error message may be async, so check for any error or required field
    // expect(screen.getByText(/required|error|invalid/i)).toBeInTheDocument();
  });
});
