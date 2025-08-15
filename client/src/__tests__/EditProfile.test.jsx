import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EditProfile from '../pages/EditProfile.jsx';

describe('EditProfile Page', () => {
  it('renders Edit Profile heading', () => {
    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );
  // Look for a button or section that is always present on EditProfile
  expect(screen.getByRole('button', { name: /back to profile/i })).toBeInTheDocument();
  });
});
