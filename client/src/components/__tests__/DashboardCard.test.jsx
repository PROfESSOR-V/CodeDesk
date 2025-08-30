import { render, screen } from '@testing-library/react';
import DashboardCard from '../DashboardCard';

describe('DashboardCard', () => {
  it('renders card with title', () => {
    render(<DashboardCard title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});