/**
 * Technical Indicators Service
 * Professional trading indicators for crypto analysis
 */

import axios from 'axios';

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalAnalysis {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  ema: {
    ema12: number;
    ema26: number;
    ema50: number;
    ema200: number;
  };
  momentum: number;
  volumeRatio: number;
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  score: number; // -100 to +100
}

export class TechnicalIndicatorsService {
  private baseURL: string;

  constructor() {
    const useTestnet = process.env.BINANCE_USE_TESTNET === 'true';
    this.baseURL = useTestnet
      ? process.env.BINANCE_API_TESTNET_BASE || 'https://testnet.binance.vision'
      : process.env.BINANCE_API_BASE || 'https://api.binance.com';
  }

  /**
   * Get historical klines (candlestick) data
   */
  async getKlines(
    symbol: string,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
    limit: number = 100
  ): Promise<Candle[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/v3/klines`, {
        params: {
          symbol,
          interval,
          limit,
        },
      });

      return response.data.map((k: any[]) => ({
        timestamp: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
    } catch (error) {
      console.error('Error fetching klines:', error);
      return [];
    }
  }

  /**
   * Calculate RSI (Relative Strength Index)
   * RSI < 30 = Oversold (potential buy)
   * RSI > 70 = Overbought (potential sell)
   */
  calculateRSI(candles: Candle[], period: number = 14): number {
    if (candles.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = candles.length - period; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  calculateEMA(candles: Candle[], period: number): number {
    if (candles.length === 0) return 0;

    const k = 2 / (period + 1);
    let ema = candles[0].close;

    for (let i = 1; i < candles.length; i++) {
      ema = candles[i].close * k + ema * (1 - k);
    }

    return ema;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   * MACD line crossing above signal = Buy signal
   * MACD line crossing below signal = Sell signal
   */
  calculateMACD(candles: Candle[]): { macd: number; signal: number; histogram: number } {
    if (candles.length < 26) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const ema12 = this.calculateEMA(candles, 12);
    const ema26 = this.calculateEMA(candles, 26);
    const macd = ema12 - ema26;

    // Calculate signal line (9-period EMA of MACD)
    // Simplified: using the MACD value directly as we don't have historical MACD
    const signal = macd * 0.9; // Approximation

    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  /**
   * Calculate Bollinger Bands
   * Price touching lower band = Oversold
   * Price touching upper band = Overbought
   */
  calculateBollingerBands(
    candles: Candle[],
    period: number = 20,
    stdDev: number = 2
  ): { upper: number; middle: number; lower: number } {
    if (candles.length < period) {
      const currentPrice = candles[candles.length - 1]?.close || 0;
      return { upper: currentPrice, middle: currentPrice, lower: currentPrice };
    }

    // Calculate SMA (middle band)
    const recentCandles = candles.slice(-period);
    const middle = recentCandles.reduce((sum, c) => sum + c.close, 0) / period;

    // Calculate standard deviation
    const squaredDiffs = recentCandles.map(c => Math.pow(c.close - middle, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    const upper = middle + stdDev * standardDeviation;
    const lower = middle - stdDev * standardDeviation;

    return { upper, middle, lower };
  }

  /**
   * Calculate momentum indicator
   */
  calculateMomentum(candles: Candle[], period: number = 10): number {
    if (candles.length < period + 1) return 0;

    const current = candles[candles.length - 1].close;
    const past = candles[candles.length - period - 1].close;

    return ((current - past) / past) * 100;
  }

  /**
   * Calculate volume ratio (current vs average)
   */
  calculateVolumeRatio(candles: Candle[], period: number = 20): number {
    if (candles.length < period) return 1;

    const recentCandles = candles.slice(-period);
    const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / period;
    const currentVolume = candles[candles.length - 1].volume;

    return currentVolume / avgVolume;
  }

  /**
   * Perform comprehensive technical analysis
   */
  async analyze(symbol: string, quoteCurrency: string = 'EUR'): Promise<TechnicalAnalysis> {
    const tradingPair = `${symbol}${quoteCurrency}`;
    const candles = await this.getKlines(tradingPair, '1h', 200);

    if (candles.length === 0) {
      return {
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollingerBands: { upper: 0, middle: 0, lower: 0 },
        ema: { ema12: 0, ema26: 0, ema50: 0, ema200: 0 },
        momentum: 0,
        volumeRatio: 1,
        signal: 'neutral',
        score: 0,
      };
    }

    const currentPrice = candles[candles.length - 1].close;

    // Calculate all indicators
    const rsi = this.calculateRSI(candles);
    const macd = this.calculateMACD(candles);
    const bollingerBands = this.calculateBollingerBands(candles);
    const ema12 = this.calculateEMA(candles, 12);
    const ema26 = this.calculateEMA(candles, 26);
    const ema50 = this.calculateEMA(candles, 50);
    const ema200 = this.calculateEMA(candles, 200);
    const momentum = this.calculateMomentum(candles);
    const volumeRatio = this.calculateVolumeRatio(candles);

    // Calculate overall score
    let score = 0;

    // RSI scoring
    if (rsi < 30) score += 25; // Oversold - strong buy
    else if (rsi < 40) score += 15; // Slightly oversold - buy
    else if (rsi > 70) score -= 25; // Overbought - strong sell
    else if (rsi > 60) score -= 15; // Slightly overbought - sell

    // MACD scoring
    if (macd.histogram > 0 && macd.macd > macd.signal) score += 20; // Bullish
    else if (macd.histogram < 0 && macd.macd < macd.signal) score -= 20; // Bearish

    // Bollinger Bands scoring
    const bbPosition = (currentPrice - bollingerBands.lower) / (bollingerBands.upper - bollingerBands.lower);
    if (bbPosition < 0.2) score += 15; // Near lower band - oversold
    else if (bbPosition > 0.8) score -= 15; // Near upper band - overbought

    // EMA trend scoring
    if (ema12 > ema26 && ema26 > ema50 && ema50 > ema200) score += 20; // Strong uptrend
    else if (ema12 < ema26 && ema26 < ema50 && ema50 < ema200) score -= 20; // Strong downtrend
    else if (ema12 > ema26) score += 10; // Short-term uptrend
    else if (ema12 < ema26) score -= 10; // Short-term downtrend

    // Momentum scoring
    if (momentum > 5) score += 10; // Strong momentum
    else if (momentum < -5) score -= 10; // Negative momentum

    // Volume scoring
    if (volumeRatio > 1.5 && score > 0) score += 10; // High volume on uptrend
    else if (volumeRatio > 1.5 && score < 0) score -= 10; // High volume on downtrend

    // Determine signal
    let signal: TechnicalAnalysis['signal'];
    if (score >= 50) signal = 'strong_buy';
    else if (score >= 20) signal = 'buy';
    else if (score <= -50) signal = 'strong_sell';
    else if (score <= -20) signal = 'sell';
    else signal = 'neutral';

    return {
      rsi,
      macd,
      bollingerBands,
      ema: { ema12, ema26, ema50, ema200 },
      momentum,
      volumeRatio,
      signal,
      score,
    };
  }

  /**
   * Get market sentiment (Fear & Greed simplified)
   */
  getMarketSentiment(analysis: TechnicalAnalysis): string {
    if (analysis.rsi < 25) return 'Extreme Fear';
    if (analysis.rsi < 35) return 'Fear';
    if (analysis.rsi > 75) return 'Extreme Greed';
    if (analysis.rsi > 65) return 'Greed';
    return 'Neutral';
  }
}

export const technicalIndicatorsService = new TechnicalIndicatorsService();
