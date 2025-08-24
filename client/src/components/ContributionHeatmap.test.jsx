import { render, screen } from '@testing-library/react';
import ContributionHeatmap from './ContributionHeatmap.jsx';

describe('ContributionHeatmap component', () => {
  it('renders without crashing', () => {
    render(<ContributionHeatmap data={[]} />);
    expect(screen.getByTestId('contribution-heatmap')).toBeInTheDocument();
  });

  it('renders correct number of cells for given data', () => {
    const mockData = [
      { date: '2023-01-01', count: 2 },
      { date: '2023-01-02', count: 5 },
      { date: '2023-01-03', count: 0 }
    ];
    render(<ContributionHeatmap data={mockData} />);
    // Adjust selector below to match your cell rendering logic
    const cells = screen.getAllByTestId('contribution-cell');
    expect(cells.length).toBe(mockData.length);
  });

  it('displays tooltip or count on hover (if implemented)', () => {
    // This test assumes you show a tooltip or count on hover
    // You may need to adjust based on your implementation
    const mockData = [{ date: '2023-01-01', count: 2 }];
    render(<ContributionHeatmap data={mockData} />);
    const cell = screen.getByTestId('contribution-cell');
    // Simulate hover and check for tooltip/count
    // fireEvent.mouseOver(cell);
    // expect(screen.getByText(/2/)).toBeInTheDocument();
  });
});