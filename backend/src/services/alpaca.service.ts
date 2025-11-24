import axios, { AxiosInstance } from 'axios';

/**
 * Alpaca Trading Service
 * Professional stock trading API integration
 * Docs: https://alpaca.markets/docs/
 */

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  replaced_at: string | null;
  replaced_by: string | null;
  replaces: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional: string | null;
  qty: string;
  filled_qty: string;
  filled_avg_price: string | null;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  status: string;
  extended_hours: boolean;
  legs: any | null;
  trail_percent: string | null;
  trail_price: string | null;
  hwm: string | null;
}

export interface AlpacaBar {
  t: string; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  n: number; // number of trades
  vw: number; // volume weighted average price
}

export interface AlpacaQuote {
  symbol: string;
  latestTrade: {
    t: string;
    x: string;
    p: number;
    s: number;
    c: string[];
    i: number;
    z: string;
  };
  latestQuote: {
    t: string;
    ax: string;
    ap: number;
    as: number;
    bx: string;
    bp: number;
    bs: number;
    c: string[];
  };
  minuteBar: {
    t: string;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    n: number;
    vw: number;
  };
  dailyBar: {
    t: string;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    n: number;
    vw: number;
  };
  prevDailyBar: {
    t: string;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    n: number;
    vw: number;
  };
}

export interface OrderRequest {
  symbol: string;
  qty?: number;
  notional?: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
  trail_price?: number;
  trail_percent?: number;
  extended_hours?: boolean;
  client_order_id?: string;
  order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
  take_profit?: {
    limit_price: number;
  };
  stop_loss?: {
    stop_price: number;
    limit_price?: number;
  };
}

export class AlpacaService {
  private tradingClient: AxiosInstance;
  private dataClient: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private dataUrl: string;

  constructor(apiKey?: string, apiSecret?: string, isPaper: boolean = true) {
    this.apiKey = apiKey || process.env.ALPACA_API_KEY || '';
    this.apiSecret = apiSecret || process.env.ALPACA_API_SECRET || '';

    // Use paper trading or live trading
    this.baseUrl = isPaper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';

    this.dataUrl = 'https://data.alpaca.markets';

    // Trading API client
    this.tradingClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'APCA-API-KEY-ID': this.apiKey,
        'APCA-API-SECRET-KEY': this.apiSecret,
      },
    });

    // Data API client
    this.dataClient = axios.create({
      baseURL: this.dataUrl,
      headers: {
        'APCA-API-KEY-ID': this.apiKey,
        'APCA-API-SECRET-KEY': this.apiSecret,
      },
    });
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<AlpacaAccount> {
    try {
      // Return mock account if no API keys configured
      if (!this.apiKey || !this.apiSecret) {
        console.warn('Alpaca API keys not configured, returning mock account');
        return this.getMockAccount();
      }

      const response = await this.tradingClient.get('/v2/account');
      return response.data;
    } catch (error) {
      console.error('Error fetching account:', error);
      // Return mock account on error
      return this.getMockAccount();
    }
  }

  /**
   * Get mock account for when API keys are not configured
   */
  private getMockAccount(): AlpacaAccount {
    return {
      id: 'mock-account',
      account_number: '000000000',
      status: 'INACTIVE',
      currency: 'USD',
      buying_power: '0',
      cash: '0',
      portfolio_value: '0',
      pattern_day_trader: false,
      trading_blocked: true,
      transfers_blocked: true,
      account_blocked: true,
      created_at: new Date().toISOString(),
      equity: '0',
      last_equity: '0',
      long_market_value: '0',
      short_market_value: '0',
      initial_margin: '0',
      maintenance_margin: '0',
    };
  }

  /**
   * Get all positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    try {
      // Return empty array if no API keys configured
      if (!this.apiKey || !this.apiSecret) {
        console.warn('Alpaca API keys not configured, returning empty positions');
        return [];
      }

      const response = await this.tradingClient.get('/v2/positions');
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get position for a specific symbol
   */
  async getPosition(symbol: string): Promise<AlpacaPosition> {
    const response = await this.tradingClient.get(`/v2/positions/${symbol}`);
    return response.data;
  }

  /**
   * Place an order
   */
  async placeOrder(orderRequest: OrderRequest): Promise<AlpacaOrder> {
    const response = await this.tradingClient.post('/v2/orders', orderRequest);
    return response.data;
  }

  /**
   * Get all orders
   */
  async getOrders(status?: string, limit: number = 100): Promise<AlpacaOrder[]> {
    try {
      // Return empty array if no API keys configured
      if (!this.apiKey || !this.apiSecret) {
        console.warn('Alpaca API keys not configured, returning empty orders');
        return [];
      }

      const params: any = { limit };
      if (status) {
        params.status = status;
      }
      const response = await this.tradingClient.get('/v2/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<AlpacaOrder> {
    const response = await this.tradingClient.get(`/v2/orders/${orderId}`);
    return response.data;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    await this.tradingClient.delete(`/v2/orders/${orderId}`);
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(): Promise<void> {
    await this.tradingClient.delete('/v2/orders');
  }

  /**
   * Get latest quote for a symbol
   */
  async getLatestQuote(symbol: string): Promise<AlpacaQuote> {
    const response = await this.dataClient.get(`/v2/stocks/${symbol}/snapshot`);
    return response.data;
  }

  /**
   * Get latest quotes for multiple symbols
   */
  async getLatestQuotes(symbols: string[]): Promise<{ [symbol: string]: AlpacaQuote }> {
    const response = await this.dataClient.get('/v2/stocks/snapshots', {
      params: {
        symbols: symbols.join(','),
      },
    });
    return response.data;
  }

  /**
   * Get historical bars (candles)
   */
  async getHistoricalBars(
    symbol: string,
    timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day',
    start: string,
    end?: string,
    limit?: number
  ): Promise<AlpacaBar[]> {
    const params: any = {
      start,
      timeframe,
    };

    if (end) {
      params.end = end;
    }

    if (limit) {
      params.limit = limit;
    }

    const response = await this.dataClient.get(`/v2/stocks/${symbol}/bars`, { params });
    return response.data.bars || [];
  }

  /**
   * Check if market is open
   */
  async isMarketOpen(): Promise<boolean> {
    try {
      // Return false if no API keys configured
      if (!this.apiKey || !this.apiSecret) {
        console.warn('Alpaca API keys not configured, assuming market closed');
        return false;
      }

      const response = await this.tradingClient.get('/v2/clock');
      return response.data.is_open;
    } catch (error) {
      console.error('Error checking market status:', error);
      // Default to closed if API call fails
      return false;
    }
  }

  /**
   * Get market calendar
   */
  async getCalendar(start?: string, end?: string): Promise<any[]> {
    const params: any = {};
    if (start) params.start = start;
    if (end) params.end = end;

    const response = await this.tradingClient.get('/v2/calendar', { params });
    return response.data;
  }

  /**
   * Liquidate position
   */
  async liquidatePosition(symbol: string): Promise<AlpacaOrder> {
    const response = await this.tradingClient.delete(`/v2/positions/${symbol}`);
    return response.data;
  }

  /**
   * Liquidate all positions
   */
  async liquidateAllPositions(): Promise<AlpacaOrder[]> {
    const response = await this.tradingClient.delete('/v2/positions');
    return response.data;
  }

  /**
   * Market Order - Buy
   */
  async marketBuy(symbol: string, qty: number): Promise<AlpacaOrder> {
    return this.placeOrder({
      symbol,
      qty,
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    });
  }

  /**
   * Market Order - Sell
   */
  async marketSell(symbol: string, qty: number): Promise<AlpacaOrder> {
    return this.placeOrder({
      symbol,
      qty,
      side: 'sell',
      type: 'market',
      time_in_force: 'day',
    });
  }

  /**
   * Limit Order - Buy
   */
  async limitBuy(symbol: string, qty: number, limitPrice: number): Promise<AlpacaOrder> {
    return this.placeOrder({
      symbol,
      qty,
      side: 'buy',
      type: 'limit',
      limit_price: limitPrice,
      time_in_force: 'gtc',
    });
  }

  /**
   * Limit Order - Sell
   */
  async limitSell(symbol: string, qty: number, limitPrice: number): Promise<AlpacaOrder> {
    return this.placeOrder({
      symbol,
      qty,
      side: 'sell',
      type: 'limit',
      limit_price: limitPrice,
      time_in_force: 'gtc',
    });
  }

  /**
   * Stop Loss Order
   */
  async stopLoss(symbol: string, qty: number, stopPrice: number): Promise<AlpacaOrder> {
    return this.placeOrder({
      symbol,
      qty,
      side: 'sell',
      type: 'stop',
      stop_price: stopPrice,
      time_in_force: 'gtc',
    });
  }

  /**
   * Take Profit Order
   */
  async takeProfit(symbol: string, qty: number, limitPrice: number): Promise<AlpacaOrder> {
    return this.placeOrder({
      symbol,
      qty,
      side: 'sell',
      type: 'limit',
      limit_price: limitPrice,
      time_in_force: 'gtc',
    });
  }

  /**
   * Bracket Order (Entry + Take Profit + Stop Loss)
   */
  async bracketOrder(
    symbol: string,
    qty: number,
    side: 'buy' | 'sell',
    takeProfitPrice: number,
    stopLossPrice: number
  ): Promise<AlpacaOrder> {
    return this.placeOrder({
      symbol,
      qty,
      side,
      type: 'market',
      time_in_force: 'gtc',
      order_class: 'bracket',
      take_profit: {
        limit_price: takeProfitPrice,
      },
      stop_loss: {
        stop_price: stopLossPrice,
      },
    });
  }
}

export const alpacaService = new AlpacaService();
