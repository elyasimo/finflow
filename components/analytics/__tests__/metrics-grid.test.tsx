import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MetricsGrid } from '../metrics-grid';

const mockMetrics = {
  totalPnL: 1234.56,
  winRate: 55.5,
  profitFactor: 1.8,
  expectancy: 12.3,
  averageWin: 100,
  averageLoss: -50,
  largestWin: 300,
  largestLoss: -200,
  sharpeRatio: 1.2,
  sortinoRatio: 1.5,
  calmarRatio: 0.8,
  maxDrawdown: 10,
  maxConsecutiveWins: 4,
  maxConsecutiveLosses: 2,
};

describe('MetricsGrid', () => {
  it('renders key metrics', () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    expect(screen.getByText('Total P&L')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Profit Factor')).toBeInTheDocument();
    expect(screen.getByText('1.80')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });
}); 