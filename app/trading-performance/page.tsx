// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, Percent, Target, Award, AlertCircle } from 'lucide-react';
import Layout from '@/components/finflow/layout';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/hooks/use-currency';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { tradingAgentApi } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileTradingPerformance from '@/components/finflow/mobile-trading-performance';

interface PerformanceData {
  equityCurve: Array<{ date: string; equity: number }>;
  profitLoss: Array<{ date: string; profit: number; loss: number }>;
  winRate: Array<{ date: string; wins: number; losses: number }>;
  assetPerformance: Array<{ asset: string; profit: number; trades: number; winRate: number }>;
  monthlyReturns: Array<{ month: string; return: number }>;
  stats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalProfit: number;
    totalLoss: number;
    netProfit: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function TradingPerformancePage() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState('30'); // days
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/trading-agents/performance?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load performance data');
      }

      const data = await response.json();
      setPerformanceData(data);
    } catch (err: unknown) {
      setError(err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (!user) {
    return null;
  }

  // Render mobile version
  if (isMobile) {
    return <MobileTradingPerformance user={user} />;
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trading Performance</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Comprehensive analysis of your trading activity and results
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 6 Months</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading performance data...</p>
            </div>
          </div>
        ) : performanceData ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${performanceData.stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(performanceData.stats.netProfit)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {performanceData.stats.netProfit >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Profit Factor: {performanceData.stats.profitFactor.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performanceData.stats.winRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {performanceData.stats.winningTrades} wins / {performanceData.stats.losingTrades} losses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Win/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Avg Win:</span>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(performanceData.stats.averageWin)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Avg Loss:</span>
                      <span className="text-sm font-semibold text-red-600">{formatCurrency(Math.abs(performanceData.stats.averageLoss))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Sharpe Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performanceData.stats.sharpeRatio.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Max Drawdown: {performanceData.stats.maxDrawdown.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="equity" className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="equity">Equity Curve</TabsTrigger>
                <TabsTrigger value="pnl">P&L Trend</TabsTrigger>
                <TabsTrigger value="winrate">Win Rate</TabsTrigger>
                <TabsTrigger value="assets">By Asset</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>

              {/* Equity Curve */}
              <TabsContent value="equity">
                <Card>
                  <CardHeader>
                    <CardTitle>Equity Curve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData.equityCurve}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="equity"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            name="Portfolio Value"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profit & Loss Trend */}
              <TabsContent value="pnl">
                <Card>
                  <CardHeader>
                    <CardTitle>Profit & Loss Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData.profitLoss}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="profit" fill="#10b981" name="Profit" />
                          <Bar dataKey="loss" fill="#ef4444" name="Loss" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Win Rate Trend */}
              <TabsContent value="winrate">
                <Card>
                  <CardHeader>
                    <CardTitle>Win Rate Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData.winRate}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="wins" stroke="#10b981" strokeWidth={2} name="Winning Trades" />
                          <Line type="monotone" dataKey="losses" stroke="#ef4444" strokeWidth={2} name="Losing Trades" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance by Asset */}
              <TabsContent value="assets">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Asset</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceData.assetPerformance} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                            <YAxis dataKey="asset" type="category" width={80} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="profit" fill="#10b981" name="Profit/Loss" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b">
                            <tr>
                              <th className="text-left p-2 text-sm font-medium">Asset</th>
                              <th className="text-right p-2 text-sm font-medium">Trades</th>
                              <th className="text-right p-2 text-sm font-medium">Win Rate</th>
                              <th className="text-right p-2 text-sm font-medium">Profit/Loss</th>
                            </tr>
                          </thead>
                          <tbody>
                            {performanceData.assetPerformance.map((asset, i) => (
                              <tr key={i} className="border-b dark:border-gray-700">
                                <td className="p-2 text-sm font-semibold">{asset.asset}</td>
                                <td className="p-2 text-sm text-right">{asset.trades}</td>
                                <td className="p-2 text-sm text-right">{asset.winRate.toFixed(1)}%</td>
                                <td className={`p-2 text-sm text-right font-semibold ${asset.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(asset.profit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Monthly Returns */}
              <TabsContent value="monthly">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData.monthlyReturns}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value.toFixed(1)}%`} />
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                          <Bar dataKey="return" fill="#3b82f6" name="Monthly Return %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Trading Activity</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Trades</span>
                        <span className="text-sm font-semibold">{performanceData.stats.totalTrades}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Winning</span>
                        <span className="text-sm font-semibold text-green-600">{performanceData.stats.winningTrades}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-600">Losing</span>
                        <span className="text-sm font-semibold text-red-600">{performanceData.stats.losingTrades}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Profit & Loss</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Profit</span>
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(performanceData.stats.totalProfit)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Loss</span>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(Math.abs(performanceData.stats.totalLoss))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Net P&L</span>
                        <span className={`text-sm font-bold ${performanceData.stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(performanceData.stats.netProfit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Win/Loss Ratio</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Win Rate</span>
                        <span className="text-sm font-semibold">{performanceData.stats.winRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg Win</span>
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(performanceData.stats.averageWin)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg Loss</span>
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(Math.abs(performanceData.stats.averageLoss))}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Risk Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Profit Factor</span>
                        <span className="text-sm font-semibold">{performanceData.stats.profitFactor.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Sharpe Ratio</span>
                        <span className="text-sm font-semibold">{performanceData.stats.sharpeRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Max Drawdown</span>
                        <span className="text-sm font-semibold text-red-600">-{performanceData.stats.maxDrawdown.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Activity className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Trading Data Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                Start trading to see your performance metrics and charts here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
