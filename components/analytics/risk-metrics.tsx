'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TradeMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
}

interface RiskMetricsProps {
  metrics: TradeMetrics | null;
}

export function RiskMetrics({ metrics }: RiskMetricsProps) {
  console.log('RiskMetrics metrics:', metrics);
  if (!metrics) return null;

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const formatRatio = (value: number | null | undefined) => {
    return value != null && typeof value === 'number' && !isNaN(value) ? value.toFixed(2) : '-';
  };

  const cards = [
    {
      title: 'Sharpe Ratio',
      value: formatRatio(metrics.sharpeRatio),
      description: 'Risk-adjusted return measure',
    },
    {
      title: 'Sortino Ratio',
      value: formatRatio(metrics.sortinoRatio),
      description: 'Downside risk-adjusted return',
    },
    {
      title: 'Calmar Ratio',
      value: formatRatio(metrics.calmarRatio),
      description: 'Return relative to drawdown',
    },
    {
      title: 'Max Drawdown',
      value: formatPercentage(metrics.maxDrawdown),
      description: 'Maximum observed drawdown',
    },
    {
      title: 'Max Consecutive Wins',
      value: metrics.maxConsecutiveWins.toString(),
      description: 'Longest winning streak',
    },
    {
      title: 'Max Consecutive Losses',
      value: metrics.maxConsecutiveLosses.toString(),
      description: 'Longest losing streak',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 