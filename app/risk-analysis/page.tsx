'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Target, Activity } from 'lucide-react';
import { useCurrency } from '@/components/finflow/CurrencyContext';
import useBinancePortfolio from '@/hooks/use-binance-portfolio';
import Layout from '@/components/finflow/layout';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface RiskMetrics {
  var95: number;
  var99: number;
  cvar95: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  volatility: number;
  downsideVolatility: number;
  beta: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentDrawdown: number;
  currentDrawdownPercent: number;
  portfolioValue: number;
  dailyReturn: number;
  dailyReturnPercent: number;
  calculationPeriod: string;
  lastUpdated: string;
}

export default function RiskAnalysisPage() {
  const { currency } = useCurrency();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { portfolio, loading: portfolioLoading } = useBinancePortfolio();
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRisk = async () => {
    if (!portfolio || portfolio.length === 0) {
      setError('No portfolio data available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');

      // Prepare positions
      const positions = portfolio
        .filter(asset => parseFloat(asset.free) > 0)
        .map(asset => ({
          symbol: asset.asset,
          quantity: parseFloat(asset.free),
          currentPrice: asset.currentPrice || 0,
        }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/risk-metrics/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ positions }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to calculate risk metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate risk metrics');
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

  const getRiskRating = (sharpeRatio: number): { label: string; color: string } => {
    if (sharpeRatio > 2) return { label: 'Excellent', color: 'text-green-600' };
    if (sharpeRatio > 1) return { label: 'Good', color: 'text-blue-600' };
    if (sharpeRatio > 0) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  const getVolatilityRating = (vol: number): { label: string; color: string } => {
    if (vol < 20) return { label: 'Low', color: 'text-green-600' };
    if (vol < 40) return { label: 'Moderate', color: 'text-yellow-600' };
    if (vol < 60) return { label: 'High', color: 'text-orange-600' };
    return { label: 'Very High', color: 'text-red-600' };
  };

  return (
    <Layout user={user}>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Risk Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Professional risk metrics for your cryptocurrency portfolio
          </p>
        </div>
        <Button
          onClick={calculateRisk}
          disabled={loading || portfolioLoading || !portfolio || portfolio.length === 0}
        >
          {loading ? 'Calculating...' : 'Calculate Risk Metrics'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {!metrics && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Risk Analysis Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
              Click &ldquo;Calculate Risk Metrics&rdquo; to analyze your portfolio&apos;s risk profile using professional metrics.
            </p>
          </CardContent>
        </Card>
      )}

      {metrics && (
        <>
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(metrics.portfolioValue)}
                </div>
                <p className={`text-xs mt-1 ${metrics.dailyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.dailyReturn >= 0 ? '+' : ''}{formatCurrency(metrics.dailyReturn)} ({metrics.dailyReturnPercent.toFixed(2)}%) today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Sharpe Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.sharpeRatio.toFixed(2)}
                </div>
                <p className={`text-xs mt-1 ${getRiskRating(metrics.sharpeRatio).color}`}>
                  {getRiskRating(metrics.sharpeRatio).label} risk-adjusted return
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Volatility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.volatility.toFixed(1)}%
                </div>
                <p className={`text-xs mt-1 ${getVolatilityRating(metrics.volatility).color}`}>
                  {getVolatilityRating(metrics.volatility).label} annualized volatility
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  -{metrics.maxDrawdownPercent.toFixed(2)}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatCurrency(metrics.maxDrawdown)} worst decline
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Metrics</CardTitle>
              <CardDescription>Calculated over {metrics.calculationPeriod}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="var">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="var">Value at Risk</TabsTrigger>
                  <TabsTrigger value="ratios">Risk Ratios</TabsTrigger>
                  <TabsTrigger value="volatility">Volatility</TabsTrigger>
                  <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
                </TabsList>

                <TabsContent value="var" className="space-y-4 mt-6">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                          Value at Risk (VaR)
                        </h3>
                        <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                          VaR estimates the maximum potential loss with a given confidence level over a 1-day period.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">VaR (95% confidence)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(metrics.var95)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          95% chance losses won&apos;t exceed this in 1 day
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">VaR (99% confidence)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(metrics.var99)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          99% chance losses won&apos;t exceed this in 1 day
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">CVaR (Expected Shortfall)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(metrics.cvar95)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Expected loss if VaR is exceeded
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="ratios" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sharpe Ratio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getRiskRating(metrics.sharpeRatio).color}`}>
                          {metrics.sharpeRatio.toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Return per unit of total risk. Higher is better.
                        </p>
                        <div className="mt-3 text-xs">
                          <div className="flex justify-between mb-1">
                            <span>&lt; 0</span>
                            <span>&gt; 2</span>
                          </div>
                          <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded"></div>
                          <div className="flex justify-between mt-1">
                            <span className="text-red-600">Poor</span>
                            <span className="text-green-600">Excellent</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Sortino Ratio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {metrics.sortinoRatio.toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Return per unit of downside risk. Focuses on negative volatility.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Calmar Ratio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {metrics.calmarRatio.toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Annual return divided by max drawdown. Higher is better.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Understanding Risk Ratios</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• <strong>Sharpe Ratio:</strong> Measures return relative to total volatility</li>
                        <li>• <strong>Sortino Ratio:</strong> Like Sharpe, but only penalizes downside volatility</li>
                        <li>• <strong>Calmar Ratio:</strong> Return relative to worst drawdown</li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="volatility" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Volatility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getVolatilityRating(metrics.volatility).color}`}>
                          {metrics.volatility.toFixed(2)}%
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Annualized standard deviation of returns
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Downside Volatility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {metrics.downsideVolatility.toFixed(2)}%
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Volatility of negative returns only
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Beta (vs BTC)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {metrics.beta.toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {metrics.beta > 1 ? 'More volatile' : 'Less volatile'} than Bitcoin
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="drawdown" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Maximum Drawdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-red-600 mb-2">
                          -{metrics.maxDrawdownPercent.toFixed(2)}%
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(metrics.maxDrawdown)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                          Worst peak-to-trough decline in portfolio history
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Current Drawdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-orange-600 mb-2">
                          -{metrics.currentDrawdownPercent.toFixed(2)}%
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(metrics.currentDrawdown)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                          Current decline from recent peak
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-amber-50 dark:bg-amber-900/20">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Drawdown Analysis
                      </h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        A drawdown measures the decline from a historical peak. The maximum drawdown shows the worst loss
                        you would have experienced. Lower drawdowns indicate better capital preservation.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Last calculated: {new Date(metrics.lastUpdated).toLocaleString()}
          </div>
        </>
      )}
      </div>
    </Layout>
  );
}
