// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from "@/components/finflow/layout";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import ScenarioComparison from '@/components/analytics/ScenarioComparison';

interface AITraderConfig {
  symbol: string;
  investment: number;
  shortWindow: number;
  longWindow: number;
  strategy: 'ma-crossover' | 'rsi' | 'macd' | 'bollinger';
  simulation: boolean;
  intervalMs: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  maxDrawdownPercentage: number;
  maxOpenTrades: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  macdFastPeriod: number;
  macdSlowPeriod: number;
  macdSignalPeriod: number;
  bollingerPeriod: number;
  bollingerStdDev: number;
}

interface Trade {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  amount: number;
  price: number;
  time: string;
  reason: string;
  simulated: boolean;
  profitLoss?: number;
}

interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitLoss: number;
  currentBalance: number;
  maxDrawdown: number;
  openPositions: number;
}

interface BacktestResult {
  trades: {
    time: number;
    side: 'BUY' | 'SELL';
    price: number;
    amount: number;
    reason: string;
    profitLoss?: number;
  }[];
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalProfitLoss: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    averageHoldingTime: number;
  };
  equity: {
    time: number;
    value: number;
  }[];
}

export default function AITraderPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<AITraderConfig>({
    symbol: 'BTCUSDT',
    investment: 10,
    shortWindow: 7,
    longWindow: 25,
    strategy: 'ma-crossover',
    simulation: true,
    intervalMs: 30000,
    stopLossPercentage: 2,
    takeProfitPercentage: 4,
    maxDrawdownPercentage: 10,
    maxOpenTrades: 3,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    macdFastPeriod: 12,
    macdSlowPeriod: 26,
    macdSignalPeriod: 9,
    bollingerPeriod: 20,
    bollingerStdDev: 2,
  });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ time: string; price: number }[]>([]);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optStrategy, setOptStrategy] = useState<'ma-crossover' | 'rsi' | 'macd' | 'bollinger'>('ma-crossover');
  const [optMetric, setOptMetric] = useState('sharpeRatio');
  const [optParamRanges, setOptParamRanges] = useState<any>({
    shortWindow: [5, 7, 10],
    longWindow: [20, 25, 30],
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

  // Poll for status updates
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`${apiUrl}/ai-trader/status`);
        if (res.ok) {
          const data = await res.json();
          setIsRunning(data.running);
          if (data.running) {
            setConfig(data.config);
            setPerformance(data.performance);
          }
        }
      } catch {
        // Status fetch failed silently
      }
    };

    // Poll every 2 seconds instead of continuously
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const fetchTrades = async () => {
    try {
      const res = await fetch(`${apiUrl}/ai-trader/trades`);
      const data = await res.json();
      setTrades(data);
    } catch {
      // Trades fetch failed silently
    }
  };

  const handleStart = async () => {
    try {
      const res = await fetch(`${apiUrl}/ai-trader/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to start AI Trader');
      toast.success('AI Trader started successfully');
      setIsRunning(true);
    } catch (error) {
      toast.error((error as Error).message || "An error occurred");
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch(`${apiUrl}/ai-trader/stop`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to stop AI Trader');
      toast.success('AI Trader stopped successfully');
      setIsRunning(false);
    } catch (error) {
      toast.error((error as Error).message || "An error occurred");
    }
  };

  const handleConfigUpdate = async () => {
    try {
      const res = await fetch(`${apiUrl}/ai-trader/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to update configuration');
      toast.success('Configuration updated successfully');
    } catch (error) {
      toast.error((error as Error).message || "An error occurred");
    }
  };

  const handleBacktest = async () => {
    try {
      setIsBacktesting(true);
      const res = await fetch(`${apiUrl}/backtest/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
          interval: '1h'
        }),
      });

      if (!res.ok) throw new Error('Failed to run backtest');
      const result = await res.json();
      setBacktestResult(result);
      toast.success('Backtest completed successfully');
    } catch (error) {
      toast.error((error as Error).message || "An error occurred");
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizationResults([]);
    try {
      const res = await fetch(`${apiUrl}/ai-trader/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: optStrategy,
          paramRanges: optParamRanges,
          config,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
          metric: optMetric,
          maxResults: 20
        })
      });
      const data = await res.json();
      setOptimizationResults(data.results || []);
      toast.success('Optimization complete');
    } catch (e) {
      toast.error((e as Error).message || "An error occurred");
    } finally {
      setIsOptimizing(false);
    }
  };

  // Prepare data for scatter/heatmap
  const scatterData = useMemo(() => {
    if (optStrategy === 'ma-crossover') {
      return optimizationResults.map(r => ({
        shortWindow: r.config.shortWindow,
        longWindow: r.config.longWindow,
        metric: r.metrics[optMetric]
      }));
    }
    // Add more for other strategies
    return [];
  }, [optimizationResults, optStrategy, optMetric]);

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">AI Trader Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Control Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status: {isRunning ? 'Running' : 'Stopped'}</span>
                  <div className="space-x-2">
                    <Button
                      onClick={handleStart}
                      disabled={isRunning}
                      variant="default"
                    >
                      Start
                    </Button>
                    <Button
                      onClick={handleStop}
                      disabled={!isRunning}
                      variant="destructive"
                    >
                      Stop
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.simulation}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, simulation: checked })
                    }
                  />
                  <Label>Simulation Mode</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {performance && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold">{performance.totalTrades}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold">{performance.winRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total P/L</p>
                    <p className={`text-2xl font-bold ${performance.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {performance.totalProfitLoss.toFixed(2)} USDT
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                    <p className="text-2xl font-bold text-red-500">
                      {performance.maxDrawdown.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="config" className="space-y-4">
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
            <TabsTrigger value="chart">Price Chart</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="optimize">Optimization</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      value={config.symbol}
                      onChange={(e) =>
                        setConfig({ ...config, symbol: e.target.value.toUpperCase() })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Investment (USDT)</Label>
                    <Input
                      type="number"
                      value={config.investment}
                      onChange={(e) =>
                        setConfig({ ...config, investment: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Strategy</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={config.strategy}
                      onChange={(e) =>
                        setConfig({ ...config, strategy: e.target.value as any })
                      }
                    >
                      <option value="ma-crossover">Moving Average Crossover</option>
                      <option value="rsi">RSI</option>
                      <option value="macd">MACD</option>
                      <option value="bollinger">Bollinger Bands</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Interval (ms)</Label>
                    <Input
                      type="number"
                      value={config.intervalMs}
                      onChange={(e) =>
                        setConfig({ ...config, intervalMs: Number(e.target.value) })
                      }
                    />
                  </div>

                  {/* Risk Management */}
                  <div className="space-y-2">
                    <Label>Stop Loss (%)</Label>
                    <Input
                      type="number"
                      value={config.stopLossPercentage}
                      onChange={(e) =>
                        setConfig({ ...config, stopLossPercentage: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Take Profit (%)</Label>
                    <Input
                      type="number"
                      value={config.takeProfitPercentage}
                      onChange={(e) =>
                        setConfig({ ...config, takeProfitPercentage: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Drawdown (%)</Label>
                    <Input
                      type="number"
                      value={config.maxDrawdownPercentage}
                      onChange={(e) =>
                        setConfig({ ...config, maxDrawdownPercentage: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Open Trades</Label>
                    <Input
                      type="number"
                      value={config.maxOpenTrades}
                      onChange={(e) =>
                        setConfig({ ...config, maxOpenTrades: Number(e.target.value) })
                      }
                    />
                  </div>

                  {/* Strategy-specific parameters */}
                  {config.strategy === 'ma-crossover' && (
                    <>
                      <div className="space-y-2">
                        <Label>Short Window</Label>
                        <Input
                          type="number"
                          value={config.shortWindow}
                          onChange={(e) =>
                            setConfig({ ...config, shortWindow: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Long Window</Label>
                        <Input
                          type="number"
                          value={config.longWindow}
                          onChange={(e) =>
                            setConfig({ ...config, longWindow: Number(e.target.value) })
                          }
                        />
                      </div>
                    </>
                  )}

                  {config.strategy === 'rsi' && (
                    <>
                      <div className="space-y-2">
                        <Label>RSI Period</Label>
                        <Input
                          type="number"
                          value={config.rsiPeriod}
                          onChange={(e) =>
                            setConfig({ ...config, rsiPeriod: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Overbought Level</Label>
                        <Input
                          type="number"
                          value={config.rsiOverbought}
                          onChange={(e) =>
                            setConfig({ ...config, rsiOverbought: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Oversold Level</Label>
                        <Input
                          type="number"
                          value={config.rsiOversold}
                          onChange={(e) =>
                            setConfig({ ...config, rsiOversold: Number(e.target.value) })
                          }
                        />
                      </div>
                    </>
                  )}

                  {config.strategy === 'macd' && (
                    <>
                      <div className="space-y-2">
                        <Label>Fast Period</Label>
                        <Input
                          type="number"
                          value={config.macdFastPeriod}
                          onChange={(e) =>
                            setConfig({ ...config, macdFastPeriod: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slow Period</Label>
                        <Input
                          type="number"
                          value={config.macdSlowPeriod}
                          onChange={(e) =>
                            setConfig({ ...config, macdSlowPeriod: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Signal Period</Label>
                        <Input
                          type="number"
                          value={config.macdSignalPeriod}
                          onChange={(e) =>
                            setConfig({ ...config, macdSignalPeriod: Number(e.target.value) })
                          }
                        />
                      </div>
                    </>
                  )}

                  {config.strategy === 'bollinger' && (
                    <>
                      <div className="space-y-2">
                        <Label>Period</Label>
                        <Input
                          type="number"
                          value={config.bollingerPeriod}
                          onChange={(e) =>
                            setConfig({ ...config, bollingerPeriod: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Standard Deviation</Label>
                        <Input
                          type="number"
                          value={config.bollingerStdDev}
                          onChange={(e) =>
                            setConfig({ ...config, bollingerStdDev: Number(e.target.value) })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <Button onClick={handleConfigUpdate}>Update Configuration</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>P/L</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>{new Date(trade.time).toLocaleString()}</TableCell>
                        <TableCell>{trade.symbol}</TableCell>
                        <TableCell className={trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                          {trade.side}
                        </TableCell>
                        <TableCell>{trade.amount.toFixed(6)}</TableCell>
                        <TableCell>{trade.price.toFixed(2)}</TableCell>
                        <TableCell className={trade.profitLoss && trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {trade.profitLoss ? trade.profitLoss.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell>{trade.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                      />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip
                        labelFormatter={(time) => new Date(time).toLocaleString()}
                        formatter={(value: number) => [value.toFixed(2), 'Price']}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#8884d8"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backtest">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Backtesting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <DatePicker
                        date={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <DatePicker
                        date={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleBacktest}
                    disabled={isBacktesting}
                    className="w-full"
                  >
                    {isBacktesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Backtest...
                      </>
                    ) : (
                      'Run Backtest'
                    )}
                  </Button>

                  {backtestResult && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className={`text-2xl font-bold ${backtestResult.metrics.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {backtestResult.metrics.totalProfitLoss.toFixed(2)} USDT
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {((backtestResult.metrics.totalProfitLoss / config.investment) * 100).toFixed(1)}%
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              {backtestResult.metrics.winRate.toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {backtestResult.metrics.winningTrades} / {backtestResult.metrics.totalTrades} trades
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-red-500">
                              {backtestResult.metrics.maxDrawdown.toFixed(1)}%
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              {backtestResult.metrics.sharpeRatio.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Equity Curve</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={backtestResult.equity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="time"
                                  tickFormatter={(time) => format(new Date(time), 'MMM d, yyyy')}
                                />
                                <YAxis domain={['auto', 'auto']} />
                                <Tooltip
                                  labelFormatter={(time) => format(new Date(time), 'MMM d, yyyy HH:mm')}
                                  formatter={(value: number) => [value.toFixed(2), 'Equity']}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#8884d8"
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Trade History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Side</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>P/L</TableHead>
                                <TableHead>Reason</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {backtestResult.trades.map((trade, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {format(new Date(trade.time), 'MMM d, yyyy HH:mm')}
                                  </TableCell>
                                  <TableCell className={trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                                    {trade.side}
                                  </TableCell>
                                  <TableCell>{trade.price.toFixed(2)}</TableCell>
                                  <TableCell>{trade.amount.toFixed(6)}</TableCell>
                                  <TableCell className={trade.profitLoss && trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    {trade.profitLoss ? trade.profitLoss.toFixed(2) : '-'}
                                  </TableCell>
                                  <TableCell>{trade.reason}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimize">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Strategy</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={optStrategy}
                        onChange={e => setOptStrategy(e.target.value as any)}
                      >
                        <option value="ma-crossover">Moving Average Crossover</option>
                        <option value="rsi">RSI</option>
                        <option value="macd">MACD</option>
                        <option value="bollinger">Bollinger Bands</option>
                      </select>
                    </div>
                    <div>
                      <Label>Metric</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={optMetric}
                        onChange={e => setOptMetric(e.target.value)}
                      >
                        <option value="sharpeRatio">Sharpe Ratio</option>
                        <option value="totalProfitLoss">Total Profit/Loss</option>
                        <option value="winRate">Win Rate</option>
                        <option value="cagr">CAGR</option>
                        <option value="maxDrawdown">Max Drawdown</option>
                      </select>
                    </div>
                    <div>
                      <Label>Parameter Ranges</Label>
                      {/* Expanded for all strategies */}
                      {optStrategy === 'ma-crossover' && (
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            value={optParamRanges.shortWindow.join(',')}
                            onChange={e => setOptParamRanges({ ...optParamRanges, shortWindow: e.target.value.split(',').map(Number) })}
                            placeholder="Short Window (comma separated)"
                          />
                          <Input
                            type="text"
                            value={optParamRanges.longWindow.join(',')}
                            onChange={e => setOptParamRanges({ ...optParamRanges, longWindow: e.target.value.split(',').map(Number) })}
                            placeholder="Long Window (comma separated)"
                          />
                        </div>
                      )}
                      {optStrategy === 'rsi' && (
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            value={optParamRanges.rsiPeriod?.join(',') || ''}
                            onChange={e => setOptParamRanges({ ...optParamRanges, rsiPeriod: e.target.value.split(',').map(Number) })}
                            placeholder="RSI Period (comma separated)"
                          />
                          <Input
                            type="text"
                            value={optParamRanges.rsiOverbought?.join(',') || ''}
                            onChange={e => setOptParamRanges({ ...optParamRanges, rsiOverbought: e.target.value.split(',').map(Number) })}
                            placeholder="RSI Overbought (comma separated)"
                          />
                          <Input
                            type="text"
                            value={optParamRanges.rsiOversold?.join(',') || ''}
                            onChange={e => setOptParamRanges({ ...optParamRanges, rsiOversold: e.target.value.split(',').map(Number) })}
                            placeholder="RSI Oversold (comma separated)"
                          />
                        </div>
                      )}
                      {optStrategy === 'macd' && (
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            value={optParamRanges.macdFastPeriod?.join(',') || ''}
                            onChange={e => setOptParamRanges({ ...optParamRanges, macdFastPeriod: e.target.value.split(',').map(Number) })}
                            placeholder="MACD Fast (comma separated)"
                          />
                          <Input
                            type="text"
                            value={optParamRanges.macdSlowPeriod?.join(',') || ''}
                            onChange={e => setOptParamRanges({ ...optParamRanges, macdSlowPeriod: e.target.value.split(',').map(Number) })}
                            placeholder="MACD Slow (comma separated)"
                          />
                          <Input
                            type="text"
                            value={optParamRanges.macdSignalPeriod?.join(',') || ''}
                            onChange={e => setOptParamRanges({ ...optParamRanges, macdSignalPeriod: e.target.value.split(',').map(Number) })}
                            placeholder="MACD Signal (comma separated)"
                          />
                        </div>
                      )}
                      {optStrategy === 'bollinger' && (
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            value={optParamRanges.bollingerPeriod?.join(',') || ''}
                            onChange={e => setOptParamRanges({ ...optParamRanges, bollingerPeriod: e.target.value.split(',').map(Number) })}
                            placeholder="Bollinger Period (comma separated)"
                          />
                          <Input
                            type="text"
                            value={optParamRanges.bollingerStdDev?.join(',') || ''}
                            onChange={e => setOptParamRanges({ ...optParamRanges, bollingerStdDev: e.target.value.split(',').map(Number) })}
                            placeholder="Bollinger StdDev (comma separated)"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleOptimize} disabled={isOptimizing} className="w-full">
                    {isOptimizing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Optimizing...</> : 'Run Optimization'}
                  </Button>
                  {optimizationResults.length > 0 && (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Short Window</TableHead>
                              <TableHead>Long Window</TableHead>
                              <TableHead>{optMetric}</TableHead>
                              <TableHead>Sharpe</TableHead>
                              <TableHead>P/L</TableHead>
                              <TableHead>Win Rate</TableHead>
                              <TableHead>Drawdown</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {optimizationResults.map((r, i) => (
                              <TableRow key={i}>
                                <TableCell>{r.config.shortWindow}</TableCell>
                                <TableCell>{r.config.longWindow}</TableCell>
                                <TableCell>{r.metrics[optMetric]?.toFixed(3)}</TableCell>
                                <TableCell>{r.metrics.sharpeRatio?.toFixed(2)}</TableCell>
                                <TableCell>{r.metrics.totalProfitLoss?.toFixed(2)}</TableCell>
                                <TableCell>{r.metrics.winRate?.toFixed(1)}%</TableCell>
                                <TableCell>{r.metrics.maxDrawdown?.toFixed(1)}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid />
                            <XAxis dataKey="shortWindow" name="Short Window" />
                            <YAxis dataKey="longWindow" name="Long Window" />
                            <ZAxis dataKey="metric" range={[0, 400]} name={optMetric} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Configs" data={scatterData} fill="#8884d8" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ScenarioComparison />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 