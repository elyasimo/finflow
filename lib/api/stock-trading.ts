const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const stockTradingApi = {
  /**
   * Get all supported stocks
   */
  async getSupportedStocks() {
    const response = await fetch(`${API_BASE_URL}/stock-trading/stocks`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch supported stocks');
    }

    return response.json();
  },

  /**
   * Get stock quote
   */
  async getStockQuote(symbol: string) {
    const response = await fetch(`${API_BASE_URL}/stock-trading/quote/${symbol}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }

    return response.json();
  },

  /**
   * Get multiple stock quotes
   */
  async getStockQuotes(symbols: string[]) {
    const response = await fetch(`${API_BASE_URL}/stock-trading/quotes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ symbols }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stock quotes');
    }

    return response.json();
  },

  /**
   * Get portfolio summary
   */
  async getPortfolio() {
    const response = await fetch(`${API_BASE_URL}/stock-trading/portfolio`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch portfolio');
    }

    return response.json();
  },

  /**
   * Place market order
   */
  async placeMarketOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    strategy?: 'conservative' | 'moderate' | 'aggressive'
  ) {
    const response = await fetch(`${API_BASE_URL}/stock-trading/order/market`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ symbol, side, quantity, strategy }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to place market order');
    }

    return response.json();
  },

  /**
   * Place limit order
   */
  async placeLimitOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    limitPrice: number
  ) {
    const response = await fetch(`${API_BASE_URL}/stock-trading/order/limit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ symbol, side, quantity, limitPrice }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to place limit order');
    }

    return response.json();
  },

  /**
   * Get order history
   */
  async getOrderHistory(limit: number = 50) {
    const response = await fetch(
      `${API_BASE_URL}/stock-trading/orders/history?limit=${limit}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch order history');
    }

    return response.json();
  },

  /**
   * Get open orders
   */
  async getOpenOrders() {
    const response = await fetch(`${API_BASE_URL}/stock-trading/orders/open`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch open orders');
    }

    return response.json();
  },

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string) {
    const response = await fetch(`${API_BASE_URL}/stock-trading/orders/${orderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }

    return response.json();
  },

  /**
   * Get historical prices
   */
  async getHistoricalPrices(
    symbol: string,
    timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day' = '1Day',
    days: number = 30
  ) {
    const response = await fetch(
      `${API_BASE_URL}/stock-trading/history/${symbol}?timeframe=${timeframe}&days=${days}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch historical prices for ${symbol}`);
    }

    return response.json();
  },

  /**
   * Check if market is open
   */
  async getMarketStatus() {
    const response = await fetch(`${API_BASE_URL}/stock-trading/market/status`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch market status');
    }

    return response.json();
  },

  /**
   * Get trading strategies
   */
  async getTradingStrategies() {
    const response = await fetch(`${API_BASE_URL}/stock-trading/strategies`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trading strategies');
    }

    return response.json();
  },

  /**
   * Calculate position size
   */
  async calculatePositionSize(
    portfolioValue: number,
    stockPrice: number,
    strategy: 'conservative' | 'moderate' | 'aggressive'
  ) {
    const response = await fetch(`${API_BASE_URL}/stock-trading/calculate-position`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ portfolioValue, stockPrice, strategy }),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate position size');
    }

    return response.json();
  },

  /**
   * Liquidate position
   */
  async liquidatePosition(symbol: string) {
    const response = await fetch(`${API_BASE_URL}/stock-trading/positions/${symbol}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to liquidate position for ${symbol}`);
    }

    return response.json();
  },

  /**
   * Get account info
   */
  async getAccountInfo() {
    const response = await fetch(`${API_BASE_URL}/stock-trading/account`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch account info');
    }

    return response.json();
  },
};
