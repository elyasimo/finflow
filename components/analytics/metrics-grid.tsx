'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeMetrics } from '@/types/analytics';
import { useCurrency } from '@/components/finflow/CurrencyContext';

interface MetricsGridProps {
  metrics: TradeMetrics | null;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const { currency } = useCurrency();
  console.log('MetricsGrid metrics:', metrics);
  if (!metrics) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const cards = [
    {
      title: 'Total P&L',
      value: formatCurrency(metrics.totalProfitLoss),
      description: 'Total profit/loss',
    },
    {
      title: 'Win Rate',
      value: formatPercentage(metrics.winRate),
      description: 'Percentage of winning trades',
    },
    {
      title: 'Max Drawdown',
      value: formatPercentage(metrics.maxDrawdown),
      description: 'Maximum drawdown',
    },
    {
      title: 'Profit Factor',
      value: metrics.profitFactor != null && typeof metrics.profitFactor === 'number' && !isNaN(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : '-',
      description: 'Profit factor',
    },
    {
      title: 'Expectancy',
      value: formatCurrency(metrics.expectancy),
      description: 'Average expected value per trade',
    },
    {
      title: 'Average Win',
      value: formatCurrency(metrics.averageWin),
      description: 'Average winning trade',
    },
    {
      title: 'Average Loss',
      value: formatCurrency(metrics.averageLoss),
      description: 'Average losing trade',
    },
    {
      title: 'Largest Win',
      value: formatCurrency(metrics.largestWin),
      description: 'Largest winning trade',
    },
    {
      title: 'Largest Loss',
      value: formatCurrency(metrics.largestLoss),
      description: 'Largest losing trade',
    },
  ];

  return (
    <>
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
    </>
  );
} 