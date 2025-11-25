// @ts-nocheck
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, Percent, Target } from 'lucide-react';
import { useCurrency } from '@/components/finflow/CurrencyContext';
import Layout from '@/components/finflow/layout';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface BacktestResult {
  config: {
    symbol: string;
    strategy: string;
    initialCapital: number;
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalReturn: number;
    totalReturnPercent: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    averageTradeDuration: number;
  };
  equityCurve: Array<{ timestamp: number; equity: number }>;
  drawdownCurve: Array<{ timestamp: number; drawdown: number }>;
  trades: Array<{
    timestamp: number;
    action: 'buy' | 'sell';
    price: number;
    quantity: number;
    capital: number;
    reason: string;
    profitLoss?: number;
  }>;
}

export default function BacktestingPage() {
  const { currency } = useCurrency();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [symbol, setSymbol] = useState('BTC');
  const [strategy, setStrategy] = useState('moderate');
  const [initialCapital, setInitialCapital] = useState(1000);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/backtesting/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol,
          quoteCurrency: currency,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          initialCapital,
          strategy,
          stopLossPercent: strategy === 'conservative' ? 5 : strategy === 'moderate' ? 8 : 12,
          takeProfitPercent: strategy === 'conservative' ? 10 : strategy === 'moderate' ? 15 : 25,
          positionSize: strategy === 'conservative' ? 0.2 : strategy === 'moderate' ? 0.25 : 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run backtest');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Layout user={user}>
      <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Backtesting Engine</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Test your trading strategies with historical data before risking real money
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Backtest Configuration</CardTitle>
          <CardDescription>Configure your backtest parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="symbol">Cryptocurrency</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger id="symbol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                  <SelectItem value="SOL">Solana (SOL)</SelectItem>
                  <SelectItem value="ADA">Cardano (ADA)</SelectItem>
                  <SelectItem value="DOT">Polkadot (DOT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="strategy">Strategy</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger id="strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative (Low Risk)</SelectItem>
                  <SelectItem value="moderate">Moderate (Medium Risk)</SelectItem>
                  <SelectItem value="aggressive">Aggressive (High Risk)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="capital">Initial Capital ({currency})</Label>
              <Input
                id="capital"
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                min={100}
                step={100}
              />
            </div>

            <div>
              <Label htmlFor="days">Time Period (Days)</Label>
              <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger id="days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="14">Last 14 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="60">Last 60 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 lg:col-span-1 flex items-end">
              <Button
                onClick={runBacktest}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Running Backtest...' : 'Run Backtest'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${result.metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(result.metrics.totalReturn)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatPercent(result.metrics.totalReturnPercent)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {result.metrics.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {result.metrics.winningTrades} wins / {result.metrics.losingTrades} losses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Sharpe Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {result.metrics.sharpeRatio.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Risk-adjusted return
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  -{result.metrics.maxDrawdownPercent.toFixed(2)}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatCurrency(result.metrics.maxDrawdown)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="equity">
                <TabsList>
                  <TabsTrigger value="equity">Equity Curve</TabsTrigger>
                  <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
                  <TabsTrigger value="trades">Trade History</TabsTrigger>
                </TabsList>

                <TabsContent value="equity" className="mt-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.equityCurve.map(p => ({
                        ...p,
                        date: new Date(p.timestamp).toLocaleDateString()
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="equity"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="drawdown" className="mt-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.drawdownCurve.map(p => ({
                        ...p,
                        date: new Date(p.timestamp).toLocaleDateString()
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${value.toFixed(1)}%`}
                        />
                        <Tooltip
                          formatter={(value: number) => `${value.toFixed(2)}%`}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="drawdown"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="trades" className="mt-6">
                  <div className="max-h-[400px] overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white dark:bg-gray-800 border-b">
                        <tr>
                          <th className="text-left p-2 text-sm font-medium">Date</th>
                          <th className="text-left p-2 text-sm font-medium">Action</th>
                          <th className="text-right p-2 text-sm font-medium">Price</th>
                          <th className="text-right p-2 text-sm font-medium">Quantity</th>
                          <th className="text-right p-2 text-sm font-medium">P&L</th>
                          <th className="text-left p-2 text-sm font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trades.map((trade, i) => (
                          <tr key={i} className="border-b dark:border-gray-700">
                            <td className="p-2 text-sm">
                              {new Date(trade.timestamp).toLocaleString()}
                            </td>
                            <td className="p-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                trade.action === 'buy'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {trade.action.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-2 text-sm text-right">{formatCurrency(trade.price)}</td>
                            <td className="p-2 text-sm text-right">{trade.quantity.toFixed(6)}</td>
                            <td className={`p-2 text-sm text-right font-semibold ${
                              trade.profitLoss && trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {trade.profitLoss ? formatCurrency(trade.profitLoss) : '-'}
                            </td>
                            <td className="p-2 text-sm text-gray-600 dark:text-gray-400">{trade.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Trading Activity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Trades</span>
                      <span className="text-sm font-semibold">{result.metrics.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Duration</span>
                      <span className="text-sm font-semibold">{result.metrics.averageTradeDuration.toFixed(1)}h</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Win/Loss Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Average Win</span>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(result.metrics.averageWin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Loss</span>
                      <span className="text-sm font-semibold text-red-600">{formatCurrency(result.metrics.averageLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Largest Win</span>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(result.metrics.largestWin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Largest Loss</span>
                      <span className="text-sm font-semibold text-red-600">{formatCurrency(result.metrics.largestLoss)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Risk Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Profit Factor</span>
                      <span className="text-sm font-semibold">{result.metrics.profitFactor.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sharpe Ratio</span>
                      <span className="text-sm font-semibold">{result.metrics.sharpeRatio.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </Layout>
  );
}
