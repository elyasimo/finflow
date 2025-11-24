import axios from 'axios';

/**
 * Risk Metrics Service
 * Calculates professional risk metrics like VaR, Sharpe, Sortino, Beta, etc.
 */

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  currentPrice: number;
  averageCost?: number;
}

export interface RiskMetrics {
  // Value at Risk
  var95: number; // 95% confidence VaR (1-day)
  var99: number; // 99% confidence VaR (1-day)
  cvar95: number; // Conditional VaR (Expected Shortfall)

  // Risk-Adjusted Returns
  sharpeRatio: number; // (Return - RiskFree) / Volatility
  sortinoRatio: number; // (Return - RiskFree) / Downside Deviation
  calmarRatio: number; // Annual Return / Max Drawdown

  // Volatility Metrics
  volatility: number; // Annualized volatility
  downsideVolatility: number; // Only negative returns
  beta: number; // Volatility relative to market (BTC)

  // Drawdown Metrics
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentDrawdown: number;
  currentDrawdownPercent: number;

  // Portfolio Metrics
  portfolioValue: number;
  dailyReturn: number;
  dailyReturnPercent: number;

  // Time Period
  calculationPeriod: string;
  lastUpdated: string;
}

export class RiskMetricsService {
  private riskFreeRate = 0.02; // 2% annual risk-free rate

  /**
   * Fetch historical prices from Binance
   */
  private async fetchHistoricalPrices(
    symbol: string,
    interval: string = '1d',
    limit: number = 365
  ): Promise<number[]> {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
          symbol: `${symbol}USDT`,
          interval,
          limit,
        },
      });

      return response.data.map((candle: any) => parseFloat(candle[4])); // Close prices
    } catch (error) {
      console.error(`Error fetching prices for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical prices for ${symbol}`);
    }
  }

  /**
   * Calculate daily returns from prices
   */
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
      returns.push(dailyReturn);
    }
    return returns;
  }

  /**
   * Calculate Value at Risk using Historical Simulation
   */
  private calculateVaR(returns: number[], portfolioValue: number, confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const varReturn = sortedReturns[index];
    return Math.abs(varReturn * portfolioValue);
  }

  /**
   * Calculate Conditional VaR (Expected Shortfall)
   */
  private calculateCVaR(returns: number[], portfolioValue: number, confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const cutoffIndex = Math.floor((1 - confidence) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, cutoffIndex);
    const averageTailReturn = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    return Math.abs(averageTailReturn * portfolioValue);
  }

  /**
   * Calculate Sharpe Ratio
   */
  private calculateSharpeRatio(returns: number[]): number {
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Annualize
    const annualizedReturn = avgReturn * 252; // 252 trading days
    const annualizedVolatility = stdDev * Math.sqrt(252);
    const dailyRiskFreeRate = this.riskFreeRate / 252;

    return (annualizedReturn - this.riskFreeRate) / annualizedVolatility;
  }

  /**
   * Calculate Sortino Ratio (only penalizes downside volatility)
   */
  private calculateSortinoRatio(returns: number[]): number {
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downSideReturns = returns.filter(r => r < 0);

    if (downSideReturns.length === 0) {
      return Infinity;
    }

    const downSideVariance = downSideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downSideReturns.length;
    const downSideDeviation = Math.sqrt(downSideVariance);

    // Annualize
    const annualizedReturn = avgReturn * 252;
    const annualizedDownsideVolatility = downSideDeviation * Math.sqrt(252);

    return (annualizedReturn - this.riskFreeRate) / annualizedDownsideVolatility;
  }

  /**
   * Calculate Beta (volatility relative to market benchmark)
   */
  private async calculateBeta(assetReturns: number[], benchmarkSymbol: string = 'BTC'): Promise<number> {
    try {
      // Fetch benchmark (BTC) prices for same period
      const benchmarkPrices = await this.fetchHistoricalPrices(benchmarkSymbol, '1d', assetReturns.length + 1);
      const benchmarkReturns = this.calculateReturns(benchmarkPrices);

      // Calculate covariance and variance
      const n = Math.min(assetReturns.length, benchmarkReturns.length);
      const assetMean = assetReturns.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
      const benchmarkMean = benchmarkReturns.slice(0, n).reduce((sum, r) => sum + r, 0) / n;

      let covariance = 0;
      let benchmarkVariance = 0;

      for (let i = 0; i < n; i++) {
        covariance += (assetReturns[i] - assetMean) * (benchmarkReturns[i] - benchmarkMean);
        benchmarkVariance += Math.pow(benchmarkReturns[i] - benchmarkMean, 2);
      }

      covariance /= n;
      benchmarkVariance /= n;

      return covariance / benchmarkVariance;
    } catch (error) {
      console.error('Error calculating beta:', error);
      return 1.0; // Default to market beta
    }
  }

  /**
   * Calculate Maximum Drawdown
   */
  private calculateMaxDrawdown(prices: number[]): { maxDrawdown: number; maxDrawdownPercent: number } {
    let peak = prices[0];
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    for (const price of prices) {
      if (price > peak) {
        peak = price;
      }

      const drawdown = peak - price;
      const drawdownPercent = (drawdown / peak) * 100;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    return { maxDrawdown, maxDrawdownPercent };
  }

  /**
   * Calculate Current Drawdown
   */
  private calculateCurrentDrawdown(prices: number[]): { currentDrawdown: number; currentDrawdownPercent: number } {
    const peak = Math.max(...prices);
    const currentPrice = prices[prices.length - 1];
    const currentDrawdown = peak - currentPrice;
    const currentDrawdownPercent = (currentDrawdown / peak) * 100;

    return { currentDrawdown, currentDrawdownPercent };
  }

  /**
   * Calculate Calmar Ratio (Annual Return / Max Drawdown)
   */
  private calculateCalmarRatio(returns: number[], maxDrawdownPercent: number): number {
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const annualizedReturn = (avgReturn * 252) * 100; // Convert to percentage

    if (maxDrawdownPercent === 0) {
      return Infinity;
    }

    return annualizedReturn / maxDrawdownPercent;
  }

  /**
   * Calculate comprehensive risk metrics for a portfolio
   */
  async calculatePortfolioRiskMetrics(positions: PortfolioPosition[]): Promise<RiskMetrics> {
    if (positions.length === 0) {
      throw new Error('Portfolio is empty');
    }

    // Calculate total portfolio value
    const portfolioValue = positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0);

    // Fetch historical prices for all positions
    const historicalData = await Promise.all(
      positions.map(async (pos) => {
        const prices = await this.fetchHistoricalPrices(pos.symbol, '1d', 365);
        const returns = this.calculateReturns(prices);
        const weight = (pos.quantity * pos.currentPrice) / portfolioValue;
        return { symbol: pos.symbol, prices, returns, weight };
      })
    );

    // Calculate weighted portfolio returns
    const maxLength = Math.min(...historicalData.map(d => d.returns.length));
    const portfolioReturns: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      let weightedReturn = 0;
      for (const asset of historicalData) {
        weightedReturn += asset.returns[i] * asset.weight;
      }
      portfolioReturns.push(weightedReturn);
    }

    // Calculate all metrics
    const var95 = this.calculateVaR(portfolioReturns, portfolioValue, 0.95);
    const var99 = this.calculateVaR(portfolioReturns, portfolioValue, 0.99);
    const cvar95 = this.calculateCVaR(portfolioReturns, portfolioValue, 0.95);

    const sharpeRatio = this.calculateSharpeRatio(portfolioReturns);
    const sortinoRatio = this.calculateSortinoRatio(portfolioReturns);

    // Calculate volatility
    const avgReturn = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
    const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / portfolioReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized percentage

    // Downside volatility
    const downSideReturns = portfolioReturns.filter(r => r < 0);
    const downSideVariance = downSideReturns.length > 0
      ? downSideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downSideReturns.length
      : 0;
    const downsideVolatility = Math.sqrt(downSideVariance) * Math.sqrt(252) * 100;

    // Beta (use largest position's symbol as proxy for portfolio beta calculation)
    const largestPosition = positions.reduce((max, pos) =>
      (pos.quantity * pos.currentPrice) > (max.quantity * max.currentPrice) ? pos : max
    );
    const beta = await this.calculateBeta(portfolioReturns);

    // Calculate portfolio prices for drawdown
    const portfolioPrices: number[] = [];
    for (let i = 0; i < maxLength + 1; i++) {
      let totalValue = 0;
      for (const asset of historicalData) {
        if (i < asset.prices.length) {
          totalValue += asset.prices[i] * asset.weight * portfolioValue / asset.prices[asset.prices.length - 1];
        }
      }
      portfolioPrices.push(totalValue || portfolioValue);
    }

    const { maxDrawdown, maxDrawdownPercent } = this.calculateMaxDrawdown(portfolioPrices);
    const { currentDrawdown, currentDrawdownPercent } = this.calculateCurrentDrawdown(portfolioPrices);

    const calmarRatio = this.calculateCalmarRatio(portfolioReturns, maxDrawdownPercent);

    // Daily return
    const yesterdayValue = portfolioPrices[portfolioPrices.length - 2] || portfolioValue;
    const dailyReturn = portfolioValue - yesterdayValue;
    const dailyReturnPercent = (dailyReturn / yesterdayValue) * 100;

    return {
      var95,
      var99,
      cvar95,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      volatility,
      downsideVolatility,
      beta,
      maxDrawdown,
      maxDrawdownPercent,
      currentDrawdown,
      currentDrawdownPercent,
      portfolioValue,
      dailyReturn,
      dailyReturnPercent,
      calculationPeriod: `${maxLength} days`,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate risk metrics for a single asset
   */
  async calculateAssetRiskMetrics(symbol: string, quantity: number, currentPrice: number): Promise<RiskMetrics> {
    const positions: PortfolioPosition[] = [{
      symbol,
      quantity,
      currentPrice,
    }];

    return this.calculatePortfolioRiskMetrics(positions);
  }
}

export const riskMetricsService = new RiskMetricsService();
