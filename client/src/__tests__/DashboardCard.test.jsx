import { render, screen } from '@testing-library/react';
import DashboardCard from '../components/DashboardCard';

test('renders dashboard card with title', () => {
  render(<DashboardCard title="Test Card" />);
  expect(screen.getByText(/Test Card/i)).toBeInTheDocument();
});
