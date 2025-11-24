import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export function PortfolioSparkline({ data }: { data: number[] }) {
  // Prepare data for recharts: [{value: ...}, ...]
  const chartData = data.map((value, idx) => ({ value, idx }));
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#FFD600"
          strokeWidth={3}
          fill="#FFD600"
          fillOpacity={0.2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 