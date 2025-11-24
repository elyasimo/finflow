'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useCurrency } from '@/components/finflow/CurrencyContext';

interface EquityPoint {
  time: number;
  equity: number;
}

interface EquityCurveChartProps {
  data: EquityPoint[];
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  const { currency } = useCurrency();
  console.log('EquityCurveChart data:', data);
  const formattedData = data.map(point => ({
    ...point,
    time: format(new Date(point.time), 'MMM dd, yyyy'),
  }));

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Intl.NumberFormat('en', { style: 'currency', currency: currency, minimumFractionDigits: 0 }).format(value)}
          />
          <Tooltip
            formatter={(value: number) => [new Intl.NumberFormat('en', { style: 'currency', currency: currency }).format(value), 'Equity']}
            labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
          />
          <Line
            type="monotone"
            dataKey="equity"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 