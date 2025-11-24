import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface RollingMetricPoint {
  time: number;
  value: number;
}

interface RollingMetricsChartProps {
  data: RollingMetricPoint[];
  metricType: 'sharpe' | 'maxDrawdown';
  windowSize: number;
}

export function RollingMetricsChart({ data, metricType, windowSize }: RollingMetricsChartProps) {
  const formattedData = data.map(point => ({
    ...point,
    time: format(new Date(point.time), 'MMM dd, yyyy'),
  }));
  const yLabel = metricType === 'sharpe' ? 'Sharpe Ratio' : 'Max Drawdown (%)';
  const color = metricType === 'sharpe' ? '#16a34a' : '#eab308';
  return (
    <div className="h-[400px] w-full">
      <h3 className="font-semibold mb-2">
        Rolling {yLabel} (window: {windowSize})
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={metricType === 'sharpe' ? (v) => v.toFixed(2) : (v) => `${v.toFixed(2)}%`}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), yLabel]}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 