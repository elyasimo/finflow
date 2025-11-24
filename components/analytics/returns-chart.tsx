'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from '@/components/finflow/CurrencyContext';

interface ReturnPoint {
  month: string;
  return: number;
}

interface ReturnsChartProps {
  data: ReturnPoint[];
}

export function ReturnsChart({ data }: ReturnsChartProps) {
  const { currency } = useCurrency();
  console.log('ReturnsChart data:', data);
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Intl.NumberFormat('en', { style: 'currency', currency: currency, minimumFractionDigits: 0 }).format(value)}
          />
          <Tooltip
            formatter={(value: number) => [new Intl.NumberFormat('en', { style: 'currency', currency: currency }).format(value), 'Return']}
          />
          <Bar
            dataKey="return"
            fill="#2563eb"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 