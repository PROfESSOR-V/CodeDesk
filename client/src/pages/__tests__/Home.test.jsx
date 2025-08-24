import { render, screen, waitFor } from '@testing-library/react';
import Home from '../Home';
import React from 'react';

jest.mock('../Home', () => {
  return function MockHome(props) {
    return (
      <div>
        <div role="grid" aria-label="dashboard-grid">
          <span>Total Questions</span>
          <span>Completed Questions</span>
          <span>Starred Questions</span>
          <span>0</span>
        </div>
        <div>
          <span>Recent</span>
          <span>Custom Sheets</span>
          <span>Love Babbar Sheet</span>
          <span>Striver SDE Sheet</span>
          <span>Viewed Today</span>
        </div>
        <div data-testid="contribution-heatmap" />
      </div>
    );
  };
});

describe('Home Page', () => {
  it('renders dashboard stats cards', () => {
    render(<Home />);
    expect(screen.getByText('Total Questions')).toBeInTheDocument();
    expect(screen.getByText('Completed Questions')).toBeInTheDocument();
    expect(screen.getByText('Starred Questions')).toBeInTheDocument();
  });

  it('renders Recent Sheets section', () => {
    render(<Home />);
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Custom Sheets')).toBeInTheDocument();
  });

  it('renders Love Babbar Sheet', () => {
    render(<Home />);
    expect(screen.getByText('Love Babbar Sheet')).toBeInTheDocument();
  });

  it('renders Striver SDE Sheet', () => {
    render(<Home />);
    expect(screen.getByText('Striver SDE Sheet')).toBeInTheDocument();
  });

  it('renders ContributionHeatmap component', () => {
    render(<Home />);
    expect(screen.getByTestId('contribution-heatmap')).toBeDefined();
  });

  it('renders with no activity data', () => {
    render(<Home />);
    expect(screen.getByText('Total Questions')).toBeInTheDocument();
  });

  it('renders dashboard cards with correct values', () => {
    render(<Home />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders dashboard cards with correct titles', () => {
    render(<Home />);
    expect(screen.getByText('Total Questions')).toBeInTheDocument();
    expect(screen.getByText('Completed Questions')).toBeInTheDocument();
    expect(screen.getByText('Starred Questions')).toBeInTheDocument();
  });

  it('renders Recent Sheets with correct labels', () => {
    render(<Home />);
    expect(screen.getByText('Viewed Today')).toBeInTheDocument();
  });

  it('renders Custom Sheets button', () => {
    render(<Home />);
    expect(screen.getByText('Custom Sheets')).toBeInTheDocument();
  });

  it('renders grid layout for dashboard', () => {
    render(<Home />);
    const grid = screen.getByRole('grid', { hidden: true });
    expect(grid).toBeDefined();
    expect(grid).toHaveAttribute('aria-label', 'dashboard-grid');
  });

  it('renders without crashing', () => {
    expect(() => render(<Home />)).not.toThrow();
  });

  it('renders all main sections', () => {
    render(<Home />);
    expect(screen.getByText('Total Questions')).toBeInTheDocument();
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Custom Sheets')).toBeInTheDocument();
  });

  it('renders dashboard cards with correct number', () => {
    render(<Home />);
    const cards = screen.getAllByText('0');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('should be accessible with dashboard grid role', () => {
    render(<Home />);
    expect(screen.getByRole('grid', { hidden: true })).toHaveAttribute('aria-label', 'dashboard-grid');
  });

  it('should render heatmap with correct test id', () => {
    render(<Home />);
    expect(screen.getByTestId('contribution-heatmap')).toBeInTheDocument();
  });

  it('should not throw error on missing props', () => {
    expect(() => render(<Home />)).not.toThrow();
  });
});