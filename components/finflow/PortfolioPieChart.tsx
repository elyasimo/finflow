'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from './CurrencyContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#845EC2', '#D65DB1', '#F9A602', '#A259FF'];

export interface PortfolioPieChartData {
  asset: string;
  value: number;
}

export function PortfolioPieChart({ data }: { data: PortfolioPieChartData[] }) {
  const { currency } = useCurrency();
  // Filter out zero values for cleaner chart
  const filtered = data.filter(d => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="asset"
          cx="50%"
          cy="50%"
          outerRadius={70}
          fill="#8884d8"
          label={({ name }) => name}
        >
          {filtered.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => new Intl.NumberFormat('en', { style: 'currency', currency: currency }).format(value)} />
      </PieChart>
    </ResponsiveContainer>
  );
} 