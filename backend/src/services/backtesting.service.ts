// @ts-nocheck
import axios from 'axios';
import { technicalIndicatorsService } from './technical-indicators.service';

/**
 * Backtesting Service - Test trading strategies with historical data
 */

export interface BacktestConfig {
  symbol: string;
  quoteCurrency: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  strategy: 'conservative' | 'moderate' | 'aggressive';
  stopLossPercent: number;
  takeProfitPercent: number;
  positionSize: number; // Percentage of capital per trade (0.05 = 5%)
}

export interface BacktestTrade {
  timestamp: number;
  action: 'buy' | 'sell';
  price: number;
  quantity: number;
  capital: number;
  reason: string;
  profitLoss?: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  trades: BacktestTrade[];
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
    averageTradeDuration: number; // in hours
  };
  equityCurve: Array<{ timestamp: number; equity: number }>;
  drawdownCurve: Array<{ timestamp: number; drawdown: number }>;
}

export class BacktestingService {
  /**
   * Fetch historical candle data from Binance
   */
  private async fetchHistoricalData(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number
  ): Promise<any[]> {
    try {
      const url = `https://api.binance.com/api/v3/klines`;
      const params = {
        symbol: `${symbol}${interval === '1d' ? 'USDT' : 'USDT'}`,
        interval,
        startTime,
        endTime,
        limit: 1000,
      };

      const response = await axios.get(url, { params });
      return response.data.map((candle: any) => ({
        openTime: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
        closeTime: candle[6],
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw new Error('Failed to fetch historical data from Binance');
    }
  }

  /**
   * Calculate technical indicators for a candle window
   */
  private async calculateIndicators(candles: any[]): Promise<any> {
    if (candles.length < 26) {
      return null; // Not enough data
    }

    const rsi = technicalIndicatorsService.calculateRSI(candles, 14);
    const macd = technicalIndicatorsService.calculateMACD(candles);
    const bb = technicalIndicatorsService.calculateBollingerBands(candles, 20, 2);
    const ema20 = technicalIndicatorsService.calculateEMA(candles, 20);
    const ema50 = technicalIndicatorsService.calculateEMA(candles, 50);

    return {
      rsi,
      macd,
      bollingerBands: bb,
      ema20,
      ema50,
    };
  }

  /**
   * Evaluate if we should buy based on strategy
   */
  private shouldBuy(indicators: any, strategy: string): { shouldBuy: boolean; reason: string } {
    if (!indicators) {
      return { shouldBuy: false, reason: 'Insufficient data' };
    }

    const { rsi, macd, bollingerBands, ema20, ema50 } = indicators;
    let score = 0;
    const reasons: string[] = [];

    // RSI signals
    if (rsi < 30) {
      score += 30;
      reasons.push('RSI oversold');
    } else if (rsi < 40) {
      score += 15;
      reasons.push('RSI low');
    }

    // MACD signals
    if (macd.histogram > 0) {
      score += 20;
      reasons.push('MACD bullish');
    }

    // Bollinger Bands
    const currentPrice = bollingerBands.current;
    if (currentPrice < bollingerBands.lower) {
      score += 25;
      reasons.push('Price below lower BB');
    }

    // EMA crossover
    if (ema20 > ema50) {
      score += 15;
      reasons.push('EMA20 > EMA50');
    }

    // Strategy thresholds
    const thresholds = {
      conservative: 75,
      moderate: 60,
      aggressive: 40,
    };

    const shouldBuy = score >= thresholds[strategy];
    return {
      shouldBuy,
      reason: shouldBuy ? reasons.join(', ') : 'Score too low',
    };
  }

  /**
   * Evaluate if we should sell based on strategy
   */
  private shouldSell(
    indicators: any,
    strategy: string,
    entryPrice: number,
    currentPrice: number,
    stopLoss: number,
    takeProfit: number
  ): { shouldSell: boolean; reason: string } {
    if (!indicators) {
      return { shouldSell: false, reason: 'Insufficient data' };
    }

    // Stop-loss check
    const lossPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    if (lossPercent <= -stopLoss) {
      return { shouldSell: true, reason: `Stop-loss triggered (${lossPercent.toFixed(2)}%)` };
    }

    // Take-profit check
    const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    if (profitPercent >= takeProfit) {
      return { shouldSell: true, reason: `Take-profit triggered (${profitPercent.toFixed(2)}%)` };
    }

    const { rsi, macd, bollingerBands } = indicators;
    let score = 0;
    const reasons: string[] = [];

    // RSI signals
    if (rsi > 70) {
      score += 30;
      reasons.push('RSI overbought');
    } else if (rsi > 60) {
      score += 15;
      reasons.push('RSI high');
    }

    // MACD signals
    if (macd.histogram < 0) {
      score += 20;
      reasons.push('MACD bearish');
    }

    // Bollinger Bands
    if (currentPrice > bollingerBands.upper) {
      score += 25;
      reasons.push('Price above upper BB');
    }

    // Strategy thresholds
    const thresholds = {
      conservative: 50,
      moderate: 60,
      aggressive: 70,
    };

    const shouldSell = score >= thresholds[strategy];
    return {
      shouldSell,
      reason: shouldSell ? reasons.join(', ') : 'Hold position',
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(
    trades: BacktestTrade[],
    equityCurve: Array<{ timestamp: number; equity: number }>,
    initialCapital: number
  ): BacktestResult['metrics'] {
    const buyTrades = trades.filter(t => t.action === 'buy');
    const sellTrades = trades.filter(t => t.action === 'sell');

    const profitableTrades = sellTrades.filter(t => t.profitLoss && t.profitLoss > 0);
    const losingTrades = sellTrades.filter(t => t.profitLoss && t.profitLoss < 0);

    const totalReturn = equityCurve[equityCurve.length - 1].equity - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;

    // Max Drawdown
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peak = initialCapital;

    equityCurve.forEach(point => {
      if (point.equity > peak) {
        peak = point.equity;
      }
      const drawdown = peak - point.equity;
      const drawdownPercent = (drawdown / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    });

    // Average win/loss
    const averageWin =
      profitableTrades.length > 0
        ? profitableTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / profitableTrades.length
        : 0;

    const averageLoss =
      losingTrades.length > 0
        ? losingTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / losingTrades.length
        : 0;

    // Largest win/loss
    const largestWin =
      profitableTrades.length > 0
        ? Math.max(...profitableTrades.map(t => t.profitLoss || 0))
        : 0;

    const largestLoss =
      losingTrades.length > 0
        ? Math.min(...losingTrades.map(t => t.profitLoss || 0))
        : 0;

    // Profit Factor
    const grossProfit = profitableTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Sharpe Ratio (simplified - assumes risk-free rate = 0)
    const returns = equityCurve.slice(1).map((point, i) => {
      const prevEquity = equityCurve[i].equity;
      return (point.equity - prevEquity) / prevEquity;
    });

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );

    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Average trade duration
    const tradeDurations: number[] = [];
    for (let i = 0; i < buyTrades.length && i < sellTrades.length; i++) {
      const duration = sellTrades[i].timestamp - buyTrades[i].timestamp;
      tradeDurations.push(duration / (1000 * 60 * 60)); // Convert to hours
    }
    const averageTradeDuration =
      tradeDurations.length > 0
        ? tradeDurations.reduce((sum, d) => sum + d, 0) / tradeDurations.length
        : 0;

    return {
      totalTrades: sellTrades.length,
      winningTrades: profitableTrades.length,
      losingTrades: losingTrades.length,
      winRate: sellTrades.length > 0 ? (profitableTrades.length / sellTrades.length) * 100 : 0,
      totalReturn,
      totalReturnPercent,
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      averageTradeDuration,
    };
  }

  /**
   * Run backtest simulation
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    console.log('Starting backtest:', config);

    // Fetch historical data
    const candles = await this.fetchHistoricalData(
      config.symbol,
      '1h', // 1-hour candles for more data points
      config.startDate.getTime(),
      config.endDate.getTime()
    );

    if (candles.length < 50) {
      throw new Error('Not enough historical data for backtesting (minimum 50 candles required)');
    }

    console.log(`Fetched ${candles.length} candles for backtest`);

    let capital = config.initialCapital;
    let position: { entryPrice: number; quantity: number; entryTime: number } | null = null;
    const trades: BacktestTrade[] = [];
    const equityCurve: Array<{ timestamp: number; equity: number }> = [];
    const drawdownCurve: Array<{ timestamp: number; drawdown: number }> = [];
    let peakEquity = capital;

    // Simulate trading
    for (let i = 50; i < candles.length; i++) {
      const currentCandle = candles[i];
      const currentPrice = currentCandle.close;
      const windowCandles = candles.slice(Math.max(0, i - 50), i);

      // Calculate indicators
      const indicators = await this.calculateIndicators(windowCandles);

      // Update equity curve
      const currentEquity = position
        ? capital + position.quantity * currentPrice
        : capital;

      equityCurve.push({
        timestamp: currentCandle.openTime,
        equity: currentEquity,
      });

      // Update drawdown curve
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }
      const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
      drawdownCurve.push({
        timestamp: currentCandle.openTime,
        drawdown,
      });

      // Check if we should sell (if we have a position)
      if (position) {
        const sellSignal = this.shouldSell(
          indicators,
          config.strategy,
          position.entryPrice,
          currentPrice,
          config.stopLossPercent,
          config.takeProfitPercent
        );

        if (sellSignal.shouldSell) {
          // Sell position
          const saleProceeds = position.quantity * currentPrice;
          const profitLoss = saleProceeds - position.quantity * position.entryPrice;
          capital = capital + saleProceeds;

          trades.push({
            timestamp: currentCandle.openTime,
            action: 'sell',
            price: currentPrice,
            quantity: position.quantity,
            capital,
            reason: sellSignal.reason,
            profitLoss,
          });

          position = null;
        }
      }
      // Check if we should buy (if we don't have a position)
      else {
        const buySignal = this.shouldBuy(indicators, config.strategy);

        if (buySignal.shouldBuy && capital > 0) {
          // Buy position
          const positionValue = capital * config.positionSize;
          const quantity = positionValue / currentPrice;

          position = {
            entryPrice: currentPrice,
            quantity,
            entryTime: currentCandle.openTime,
          };

          capital = capital - positionValue;

          trades.push({
            timestamp: currentCandle.openTime,
            action: 'buy',
            price: currentPrice,
            quantity,
            capital,
            reason: buySignal.reason,
          });
        }
      }
    }

    // Close any open position at the end
    if (position) {
      const finalPrice = candles[candles.length - 1].close;
      const saleProceeds = position.quantity * finalPrice;
      const profitLoss = saleProceeds - position.quantity * position.entryPrice;
      capital = capital + saleProceeds;

      trades.push({
        timestamp: candles[candles.length - 1].openTime,
        action: 'sell',
        price: finalPrice,
        quantity: position.quantity,
        capital,
        reason: 'Backtest ended',
        profitLoss,
      });
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(trades, equityCurve, config.initialCapital);

    return {
      config,
      trades,
      metrics,
      equityCurve,
      drawdownCurve,
    };
  }

  /**
   * Compare multiple strategies
   */
  async compareStrategies(
    symbol: string,
    quoteCurrency: string,
    startDate: Date,
    endDate: Date,
    initialCapital: number
  ): Promise<Record<string, BacktestResult>> {
    const strategies: Array<'conservative' | 'moderate' | 'aggressive'> = [
      'conservative',
      'moderate',
      'aggressive',
    ];

    const results: Record<string, BacktestResult> = {};

    for (const strategy of strategies) {
      const config: BacktestConfig = {
        symbol,
        quoteCurrency,
        startDate,
        endDate,
        initialCapital,
        strategy,
        stopLossPercent: strategy === 'conservative' ? 5 : strategy === 'moderate' ? 8 : 12,
        takeProfitPercent: strategy === 'conservative' ? 10 : strategy === 'moderate' ? 15 : 25,
        positionSize: strategy === 'conservative' ? 0.2 : strategy === 'moderate' ? 0.3 : 0.5,
      };

      results[strategy] = await this.runBacktest(config);
    }

    return results;
  }
}

export const backtestingService = new BacktestingService();
