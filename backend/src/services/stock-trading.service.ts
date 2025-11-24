import { AlpacaService, OrderRequest, AlpacaOrder, AlpacaPosition } from './alpaca.service';
import { SUPPORTED_STOCKS, getStockBySymbol } from '../config/stocks.config';

/**
 * Stock Trading Service
 * High-level service for stock trading operations
 * Using Alpaca for real trading with paper money (free)
 */

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  sector: string;
  riskLevel: string;
}

export interface TradingStrategy {
  type: 'conservative' | 'moderate' | 'aggressive';
  stopLossPercent: number;
  takeProfitPercent: number;
  maxPositionSize: number; // % of portfolio
}

export interface PortfolioSummary {
  totalValue: number;
  cash: number;
  buyingPower: number;
  dayChange: number;
  dayChangePercent: number;
  positions: Array<{
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    sector: string;
  }>;
  allocation: Array<{
    sector: string;
    value: number;
    percent: number;
  }>;
}

const STRATEGIES: { [key: string]: TradingStrategy } = {
  conservative: {
    type: 'conservative',
    stopLossPercent: 3,
    takeProfitPercent: 8,
    maxPositionSize: 10,
  },
  moderate: {
    type: 'moderate',
    stopLossPercent: 5,
    takeProfitPercent: 12,
    maxPositionSize: 15,
  },
  aggressive: {
    type: 'aggressive',
    stopLossPercent: 8,
    takeProfitPercent: 20,
    maxPositionSize: 25,
  },
};

export class StockTradingService {
  private alpaca: AlpacaService;

  constructor(apiKey?: string, apiSecret?: string, isPaper: boolean = true) {
    this.alpaca = new AlpacaService(apiKey, apiSecret, isPaper);
  }

  /**
   * Get all supported stocks
   */
  getSupportedStocks() {
    return SUPPORTED_STOCKS;
  }

  /**
   * Get stock quote with enriched data
   */
  async getStockQuote(symbol: string): Promise<StockQuote> {
    const stockConfig = getStockBySymbol(symbol);
    if (!stockConfig) {
      throw new Error(`Stock ${symbol} not supported`);
    }

    const snapshot = await this.alpaca.getLatestQuote(symbol);

    const currentPrice = snapshot.latestTrade.p;
    const prevClose = snapshot.prevDailyBar.c;
    const change = currentPrice - prevClose;
    const changePercent = (change / prevClose) * 100;

    return {
      symbol: stockConfig.symbol,
      name: stockConfig.name,
      price: currentPrice,
      change,
      changePercent,
      volume: snapshot.dailyBar.v,
      high: snapshot.dailyBar.h,
      low: snapshot.dailyBar.l,
      open: snapshot.dailyBar.o,
      previousClose: prevClose,
      sector: stockConfig.sector,
      riskLevel: stockConfig.riskLevel,
    };
  }

  /**
   * Get multiple stock quotes
   */
  async getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          return await this.getStockQuote(symbol);
        } catch (error) {
          console.error(`Error fetching quote for ${symbol}:`, error);
          return null;
        }
      })
    );

    return quotes.filter((q) => q !== null) as StockQuote[];
  }

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const account = await this.alpaca.getAccount();
    const positions = await this.alpaca.getPositions();

    const portfolioValue = parseFloat(account.portfolio_value);
    const cash = parseFloat(account.cash);
    const buyingPower = parseFloat(account.buying_power);
    const equity = parseFloat(account.equity);
    const lastEquity = parseFloat(account.last_equity);
    const dayChange = equity - lastEquity;
    const dayChangePercent = lastEquity !== 0 ? (dayChange / lastEquity) * 100 : 0;

    // Enrich positions with stock metadata
    const enrichedPositions = positions.map((pos) => {
      const stockConfig = getStockBySymbol(pos.symbol);
      return {
        symbol: pos.symbol,
        name: stockConfig?.name || pos.symbol,
        quantity: parseFloat(pos.qty),
        avgPrice: parseFloat(pos.avg_entry_price),
        currentPrice: parseFloat(pos.current_price),
        marketValue: parseFloat(pos.market_value),
        unrealizedPL: parseFloat(pos.unrealized_pl),
        unrealizedPLPercent: parseFloat(pos.unrealized_plpc) * 100,
        sector: stockConfig?.sector || 'Unknown',
      };
    });

    // Calculate sector allocation
    const sectorMap = new Map<string, number>();
    enrichedPositions.forEach((pos) => {
      const current = sectorMap.get(pos.sector) || 0;
      sectorMap.set(pos.sector, current + pos.marketValue);
    });

    const allocation = Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      value,
      percent: portfolioValue !== 0 ? (value / portfolioValue) * 100 : 0,
    }));

    return {
      totalValue: portfolioValue,
      cash,
      buyingPower,
      dayChange,
      dayChangePercent,
      positions: enrichedPositions,
      allocation,
    };
  }

  /**
   * Place market order with strategy
   */
  async placeMarketOrderWithStrategy(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    strategyType?: 'conservative' | 'moderate' | 'aggressive'
  ): Promise<AlpacaOrder> {
    // If no strategy, place simple market order
    if (!strategyType) {
      return this.alpaca.placeOrder({
        symbol,
        qty: quantity,
        side,
        type: 'market',
        time_in_force: 'day',
      });
    }

    // Place bracket order with strategy
    const strategy = STRATEGIES[strategyType];
    const quote = await this.getStockQuote(symbol);
    const currentPrice = quote.price;

    if (side === 'buy') {
      const takeProfitPrice = currentPrice * (1 + strategy.takeProfitPercent / 100);
      const stopLossPrice = currentPrice * (1 - strategy.stopLossPercent / 100);

      return this.alpaca.bracketOrder(
        symbol,
        quantity,
        'buy',
        takeProfitPrice,
        stopLossPrice
      );
    } else {
      // For sell, just execute market order
      return this.alpaca.marketSell(symbol, quantity);
    }
  }

  /**
   * Place limit order
   */
  async placeLimitOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    limitPrice: number
  ): Promise<AlpacaOrder> {
    return this.alpaca.placeOrder({
      symbol,
      qty: quantity,
      side,
      type: 'limit',
      limit_price: limitPrice,
      time_in_force: 'gtc',
    });
  }

  /**
   * Get order history
   */
  async getOrderHistory(limit: number = 50): Promise<AlpacaOrder[]> {
    return this.alpaca.getOrders('all', limit);
  }

  /**
   * Get open orders
   */
  async getOpenOrders(): Promise<AlpacaOrder[]> {
    return this.alpaca.getOrders('open');
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<void> {
    return this.alpaca.cancelOrder(orderId);
  }

  /**
   * Get historical prices
   */
  async getHistoricalPrices(
    symbol: string,
    timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day',
    days: number = 30
  ) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const bars = await this.alpaca.getHistoricalBars(
      symbol,
      timeframe,
      start.toISOString(),
      end.toISOString()
    );

    return bars.map((bar) => ({
      timestamp: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));
  }

  /**
   * Check if market is open
   */
  async isMarketOpen(): Promise<boolean> {
    return this.alpaca.isMarketOpen();
  }

  /**
   * Calculate position size based on strategy
   */
  calculatePositionSize(
    portfolioValue: number,
    stockPrice: number,
    strategyType: 'conservative' | 'moderate' | 'aggressive'
  ): number {
    const strategy = STRATEGIES[strategyType];
    const maxInvestment = portfolioValue * (strategy.maxPositionSize / 100);
    const shares = Math.floor(maxInvestment / stockPrice);
    return shares;
  }

  /**
   * Get trading strategies
   */
  getTradingStrategies() {
    return STRATEGIES;
  }

  /**
   * Liquidate position
   */
  async liquidatePosition(symbol: string): Promise<AlpacaOrder> {
    return this.alpaca.liquidatePosition(symbol);
  }

  /**
   * Get account info
   */
  async getAccountInfo() {
    return this.alpaca.getAccount();
  }
}

// Initialize with environment variables
const envApiKey = process.env.ALPACA_API_KEY;
const envApiSecret = process.env.ALPACA_API_SECRET;
const envIsPaper = process.env.ALPACA_PAPER_TRADING !== 'false';

export const stockTradingService = new StockTradingService(envApiKey, envApiSecret, envIsPaper);
