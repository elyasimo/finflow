import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useLivePortfolioValue } from './useLivePortfolioValue';

interface PortfolioAsset {
  symbol: string;
  amount: string;
}

export function LivePortfolioValueChart({ assets }: { assets: PortfolioAsset[] }) {
  const history = useLivePortfolioValue(assets, 100);

  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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