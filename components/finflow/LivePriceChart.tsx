import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useBinanceLivePrice } from './useBinanceLivePrice';

export function LivePriceChart({ symbol = 'btcusdt' }: { symbol?: string }) {
  const prices = useBinanceLivePrice(symbol, 100);

  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={prices} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <Area
          type="monotone"
          dataKey="price"
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