import axios from 'axios';

// Determine API URL based on environment
function getApiUrl(): string {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In browser, check the current URL
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production domain (web or Capacitor WebView loading finflowapp.ch)
    if (hostname === 'finflowapp.ch' || hostname.endsWith('.finflowapp.ch')) {
      return 'https://api.finflowapp.ch';
    }
    
    // Capacitor native app with capacitor:// protocol
    if (protocol === 'capacitor:' || protocol === 'ionic:') {
      return 'https://api.finflowapp.ch';
    }
    
    // Check if we're in a WebView loading a remote URL
    try {
      // @ts-ignore - Capacitor may be available
      if (window.Capacitor?.isNativePlatform?.()) {
        return 'https://api.finflowapp.ch';
      }
    } catch {
      // Capacitor not available
    }
  }
  
  // Default to local development
  return 'http://localhost:8081';
}

// TypeScript interfaces for API responses
interface AccountApiResponse {
  id: string;
  name: string;
  type: string;
  currency: string;
  currentBalanceCents?: number;
  openingBalanceCents?: number;
  userId?: string;
  createdAt?: string;
}

interface TransactionApiResponse {
  id: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amountCents: number;
  currency: string;
  description?: string;
  categoryId?: string;
  date: string;
  createdAt?: string;
}

interface UpdatePayload {
  name?: string;
  type?: string;
  accountId?: string;
  budgetId?: string;
  amountCents?: number;
  currency?: string;
  description?: string;
  categoryId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  period?: string;
}

// Set the Express backend as the base URL
const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true, // Enable cookies for refresh tokens
  timeout: 30000, // 30 second timeout
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue: { resolve: (token: string | null) => void; reject: (error: Error) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await axios.post(`${getApiUrl()}/auth/refresh`, {}, {
          withCredentials: true,
        });
        
        const { accessToken } = response.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }
        
        processQueue(null, accessToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        // Refresh failed - clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          // Only redirect if not already on login/register/admin page
          const pathname = window.location.pathname;
          if (!pathname.includes('/login') && !pathname.includes('/register') && !pathname.includes('/admin')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    // Save JWT token to localStorage
    if (response.data.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data;
  },
  register: async (email: string, password: string, fullName?: string) => {
    const response = await api.post('/auth/register', { email, password, fullName });
    // Save JWT token to localStorage
    if (response.data.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data;
  },
  logout: async () => {
    try {
      // Call backend to revoke refresh token
      await api.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  },
  
  /**
   * Send OTP to email for verification (real SendGrid implementation)
   * @param email - Email address
   * @returns { success: boolean, message: string }
   */
  sendEmailOtp: async (email: string) => {
    const response = await api.post('/auth/otp/send', { email });
    return response.data;
  },
  
  /**
   * Verify email OTP code (real verification)
   * @param email - Email address
   * @param code - 6-digit verification code
   * @returns { success: boolean, message: string }
   */
  verifyEmailOtp: async (email: string, code: string) => {
    const response = await api.post('/auth/otp/verify', { email, code });
    return response.data;
  },
  
  /**
   * Send OTP to phone for verification (mock for now)
   * @param phone - Phone number
   * @returns { otp_id: string, expires_at: string }
   */
  sendPhoneOtp: async (phone: string) => {
    // Mock for phone OTP until we integrate SMS provider
    return {
      otp_id: `phone_${Date.now()}`,
      expires_at: new Date(Date.now() + 5 * 60000).toISOString()
    };
  },
  
  /**
   * Verify phone OTP code (mock for now)
   * @param phone - Phone number
   * @param code - 6-digit verification code
   * @returns { verified: boolean }
   */
  verifyPhoneOtp: async (phone: string, code: string) => {
    // Mock for phone OTP - accept any 6-digit code
    if (code.length === 6) {
      return { verified: true };
    }
    throw new Error('Invalid OTP code');
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    const userData = response.data;
    
    // Ensure camelCase for consistency
    const user = {
      id: userData.id,
      email: userData.email,
      fullName: userData.fullName || userData.full_name,
      name: userData.name,
      phone: userData.phone,
      role: userData.role || 'user',
      isAdmin: userData.isAdmin || userData.role === 'admin',
      isActive: userData.isActive !== false,
      defaultCurrency: userData.defaultCurrency || userData.default_currency || 'CHF',
      createdAt: userData.createdAt || userData.created_at,
    };
    
    return user;
  },
  updateProfile: async (data: { fullName?: string; email?: string; phone?: string; defaultCurrency?: string }) => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },
};

// Accounts API
export const accountsApi = {
  list: async () => {
    const response = await api.get('/accounts');
    // Transform backend data to frontend format
    return { accounts: response.data.map((account: AccountApiResponse) => ({
      ...account,
      // Convert cents to currency units (divide by 100)
      balance: (account.currentBalanceCents || account.openingBalanceCents || 0) / 100,
      // Map backend type to frontend display type
      type: account.type === 'creditCard' ? 'Credit Card' :
            account.type.charAt(0).toUpperCase() + account.type.slice(1),
    }))};
  },
  getAll: async () => {
    const response = await api.get('/accounts');
    // Transform backend data to frontend format
    return response.data.map((account: AccountApiResponse) => ({
      ...account,
      // Convert cents to currency units (divide by 100)
      balance: (account.currentBalanceCents || account.openingBalanceCents || 0) / 100,
      // Map backend type to frontend display type
      type: account.type === 'creditCard' ? 'Credit Card' :
            account.type === 'savings' ? 'Savings' :
            account.type.charAt(0).toUpperCase() + account.type.slice(1),
    }));
  },
  getById: async (id: string) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },
  create: async (data: { name: string; type: string; balance?: number; currency?: string }) => {
    // Map frontend account types to backend enum values
    const typeMap: Record<string, string> = {
      'Bank': 'bank',
      'Credit Card': 'creditCard',
      'Cash': 'cash',
      'Investment': 'investment',
      'Savings': 'savings', // Map Savings to savings
      // Also support lowercase values
      'bank': 'bank',
      'creditCard': 'creditCard',
      'cash': 'cash',
      'investment': 'investment',
      'crypto': 'crypto',
      'savings': 'savings',
    };

    // Convert balance to cents for backend
    const payload = {
      name: data.name,
      type: typeMap[data.type] || 'bank',
      currency: data.currency || 'EUR',
      openingBalanceCents: Math.round((data.balance || 0) * 100),
    };
    const response = await api.post('/accounts', payload);
    return response.data;
  },
  update: async (id: string, data: { name?: string; type?: string }) => {
    // Map frontend account types to backend enum values
    const typeMap: Record<string, string> = {
      'Bank': 'bank',
      'Credit Card': 'creditCard',
      'Cash': 'cash',
      'Investment': 'investment',
      'Savings': 'savings',
    };

    const payload: UpdatePayload = {};
    if (data.name) payload.name = data.name;
    if (data.type) payload.type = typeMap[data.type] || data.type;

    const response = await api.put(`/accounts/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },
};

// Budgets API
export const budgetsApi = {
  getAll: async () => {
    const response = await api.get('/budgets');
    // Backend already transforms amountCents to amount, just return the data
    return response.data;
  },
  getSuggestions: async () => {
    const response = await api.get('/budgets/suggestions');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/budgets/${id}`);
    // Backend already transforms amountCents to amount, just return the data
    return response.data;
  },
  getBudgetUsage: async (id: string) => {
    const response = await api.get(`/budgets/${id}/usage`);
    return response.data;
  },
  create: async (data: { name?: string; amount: number; currency?: string; startDate?: Date; endDate?: Date; categoryId?: string; period?: string }) => {
    // Convert to backend format
    const payload: UpdatePayload = {
      amountCents: Math.round(data.amount * 100),
      currency: data.currency || 'EUR',
      period: data.period || 'monthly', // Default to monthly
    };

    // Optional fields
    if (data.name) payload.name = data.name;
    if (data.categoryId) payload.categoryId = data.categoryId;
    if (data.startDate) payload.startDate = data.startDate.toISOString();
    if (data.endDate) payload.endDate = data.endDate.toISOString();

    const response = await api.post('/budgets', payload);
    return response.data;
  },
  update: async (id: string, data: { name?: string; amount?: number; currency?: string; startDate?: Date; endDate?: Date; categoryId?: string }) => {
    // Convert to backend format
    const payload: UpdatePayload = {};
    if (data.name) payload.name = data.name;
    if (data.amount !== undefined) payload.amountCents = Math.round(data.amount * 100);
    if (data.currency) payload.currency = data.currency;
    if (data.categoryId) payload.categoryId = data.categoryId;
    if (data.startDate) payload.startDate = data.startDate.toISOString();
    if (data.endDate) payload.endDate = data.endDate.toISOString();

    const response = await api.put(`/budgets/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};

// Transactions API
export const transactionsApi = {
  list: async (params?: { startDate?: string; endDate?: string; accountId?: string }) => {
    const response = await api.get('/transactions', { params });
    // Transform backend data to frontend format
    return { transactions: response.data.map((tx: TransactionApiResponse) => ({
      ...tx,
      // Convert cents to currency units
      amount: (tx.amountCents || 0) / 100,
      // Map date to transactionDate for frontend compatibility
      transactionDate: tx.date,
    }))};
  },
  getAll: async () => {
    const response = await api.get('/transactions');
    // Transform backend data to frontend format
    return response.data.map((tx: TransactionApiResponse) => ({
      ...tx,
      // Convert cents to currency units
      amount: (tx.amountCents || 0) / 100,
      // Map date to transactionDate for frontend compatibility
      transactionDate: tx.date,
    }));
  },
  getById: async (id: string) => {
    const response = await api.get(`/transactions/${id}`);
    const tx = response.data;
    return {
      ...tx,
      amount: (tx.amountCents || 0) / 100,
      transactionDate: tx.date,
    };
  },
  create: async (data: {
    accountId: string;
    budgetId?: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency?: string;
    description?: string;
    categoryId?: string;
    transactionDate: Date;
  }) => {
    // Transform frontend data to backend format
    const payload = {
      accountId: data.accountId,
      type: data.type,
      amountCents: Math.round(data.amount * 100),
      currency: data.currency || 'EUR',
      date: data.transactionDate.toISOString(),
      description: data.description,
      categoryId: data.categoryId,
    };
    const response = await api.post('/transactions', payload);
    return response.data;
  },
  update: async (
    id: string,
    data: {
      accountId?: string;
      budgetId?: string;
      type?: 'income' | 'expense' | 'transfer';
      amount?: number;
      currency?: string;
      description?: string;
      categoryId?: string;
      transactionDate?: Date;
    }
  ) => {
    // Transform frontend data to backend format
    const payload: UpdatePayload = {};
    if (data.accountId) payload.accountId = data.accountId;
    if (data.type) payload.type = data.type;
    if (data.amount !== undefined) payload.amountCents = Math.round(data.amount * 100);
    if (data.currency) payload.currency = data.currency;
    if (data.description !== undefined) payload.description = data.description;
    if (data.categoryId) payload.categoryId = data.categoryId;
    if (data.transactionDate) payload.date = data.transactionDate.toISOString();

    const response = await api.put(`/transactions/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
  importCsv: async (data: { data: string; accountId?: string }) => {
    const response = await api.post('/transactions/import', data);
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
  create: async (data: { name: string }) => {
    const response = await api.post('/categories', data);
    return response.data;
  },
  update: async (id: string, data: { name: string }) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export type Market = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  lastUpdated: string;
};

// Binance Portfolio Response interface
export interface BinancePortfolioResponse {
  portfolio: Array<{
    asset: string;
    free: string;
    locked: string;
    currentPrice: number | null;
    priceChange24h: number | null;
    logo: string;
  }>;
  totalValue: number;
  lastUpdated?: string;
  error?: string;
  needsConfiguration?: boolean;
}

// Export getPortfolio function for direct use
export const getPortfolio = async (): Promise<BinancePortfolioResponse> => {
  const response = await api.get('/markets/portfolio');
  return response.data;
};

export const marketsApi = {
  getPortfolio,
  
  getFinancialMarkets: async () => {
    const response = await api.get('/markets/financial');
    return response.data;
  },

  getCryptoMarkets: async () => {
    const response = await api.get('/markets/crypto');
    return response.data;
  },

  getMarketHistory: async (id: string, period: 'day' | 'week' | 'month' | 'year') => {
    const response = await api.get(`/markets/${id}/history/${period}`);
    return response.data;
  }
};

// Trading Agent API
export const tradingAgentApi = {
  getAgents: async () => {
    const response = await api.get('/trading-agents');
    return response.data;
  },

  createAgent: async (config: {
    name: string;
    assets: string[];
    strategy?: string;
    stopLossPercent?: number;
    takeProfitPercent?: number;
    trailingStopPercent?: number;
    maxDailyTradesEur?: number;
    maxSingleTradeEur?: number;
  }) => {
    const response = await api.post('/trading-agents', config);
    return response.data;
  },

  getAgent: async (id: string) => {
    const response = await api.get(`/trading-agents/${id}`);
    return response.data;
  },

  updateAgent: async (id: string, updates: Record<string, unknown>) => {
    const response = await api.put(`/trading-agents/${id}`, updates);
    return response.data;
  },

  toggleAgent: async (id: string, enabled: boolean) => {
    const response = await api.post(`/trading-agents/${id}/toggle`, { enabled });
    return response.data;
  },

  deleteAgent: async (id: string) => {
    const response = await api.delete(`/trading-agents/${id}`);
    return response.data;
  },

  getAgentLogs: async (id: string, limit?: number) => {
    const response = await api.get(`/trading-agents/${id}/logs`, { params: { limit } });
    return response.data;
  },

  getPortfolioAnalysis: async () => {
    const response = await api.get('/trading-agents/portfolio-analysis');
    return response.data;
  },

  triggerCycle: async () => {
    const response = await api.post('/trading-agents/trigger-cycle');
    return response.data;
  },

  // NEW: Get supported cryptocurrencies
  getSupportedCryptocurrencies: async (filters?: { category?: string; riskLevel?: string }) => {
    const response = await api.get('/trading-agents/supported-cryptocurrencies', { params: filters });
    return response.data;
  },

  // NEW: Get technical analysis for a symbol
  getTechnicalAnalysis: async (symbol: string) => {
    const response = await api.get(`/trading-agents/technical-analysis/${symbol}`);
    return response.data;
  },

  // NEW: Get all trading history
  getTradingHistory: async (filters?: {
    limit?: number;
    offset?: number;
    status?: string;
    asset?: string;
    action?: string;
  }) => {
    const response = await api.get('/trading-agents/trading-history', { params: filters });
    return response.data;
  },
};

// Currency API
export const currencyApi = {
  getExchangeRates: async (baseCurrency: string = 'EUR') => {
    const response = await api.get('/currency/rates', {
      params: { base: baseCurrency }
    });
    return response.data;
  },

  convertCurrency: async (amount: number, from: string, to: string) => {
    const response = await api.post('/currency/convert', {
      amount,
      from,
      to
    });
    return response.data;
  },

  getSupportedCurrencies: async () => {
    const response = await api.get('/currency/supported');
    return response.data;
  },
};

// Backtesting API
export const backtestingApi = {
  runBacktest: async (config: {
    symbol: string;
    quoteCurrency: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
    strategy: string;
    stopLossPercent: number;
    takeProfitPercent: number;
    positionSize: number;
  }) => {
    const response = await api.post('/backtesting/run', config);
    return response.data;
  },

  compareStrategies: async (config: {
    symbol: string;
    quoteCurrency: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
  }) => {
    const response = await api.post('/backtesting/compare', config);
    return response.data;
  },

  quickBacktest: async (symbol: string, days: number = 30, initialCapital: number = 1000) => {
    const response = await api.get(`/backtesting/quick/${symbol}`, {
      params: { days, initialCapital }
    });
    return response.data;
  },
};

// API Keys Management API
export const apiKeysApi = {
  storeKeys: async (provider: string, apiKey: string, apiSecret: string, permissions?: Record<string, boolean>) => {
    const response = await api.post(`/api-keys/${provider}`, {
      apiKey,
      apiSecret,
      permissions,
    });
    return response.data;
  },

  checkStatus: async (provider: string) => {
    const response = await api.get(`/api-keys/${provider}/status`);
    return response.data;
  },

  deleteKeys: async (provider: string) => {
    const response = await api.delete(`/api-keys/${provider}`);
    return response.data;
  },

  listProviders: async () => {
    const response = await api.get('/api-keys/providers');
    return response.data;
  },
};

// Advanced Orders API
export const advancedOrdersApi = {
  placeMarketOrder: async (params: {
    agentId?: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity?: number;
    quoteOrderQty?: number;
  }) => {
    const response = await api.post('/orders/market', params);
    return response.data;
  },

  placeLimitOrder: async (params: {
    agentId?: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
  }) => {
    const response = await api.post('/orders/limit', params);
    return response.data;
  },

  placeStopLossOrder: async (params: {
    agentId?: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    stopPrice: number;
  }) => {
    const response = await api.post('/orders/stop-loss', params);
    return response.data;
  },

  placeTakeProfitOrder: async (params: {
    agentId?: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    stopPrice: number;
  }) => {
    const response = await api.post('/orders/take-profit', params);
    return response.data;
  },

  placeOCOOrder: async (params: {
    agentId?: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    stopPrice: number;
    stopLimitPrice?: number;
  }) => {
    const response = await api.post('/orders/oco', params);
    return response.data;
  },

  getOrderStatus: async (symbol: string, orderId: string) => {
    const response = await api.get(`/orders/${symbol}/${orderId}`);
    return response.data;
  },

  cancelOrder: async (symbol: string, orderId: string) => {
    const response = await api.delete(`/orders/${symbol}/${orderId}`);
    return response.data;
  },

  getOpenOrders: async (symbol?: string) => {
    const response = await api.get(`/orders/open/${symbol || ''}`);
    return response.data;
  },
};

// Risk Metrics API
export const riskMetricsApi = {
  calculatePortfolioRisk: async (positions: Array<{
    symbol: string;
    quantity: number;
    currentPrice: number;
    averageCost?: number;
  }>) => {
    const response = await api.post('/risk-metrics/portfolio', { positions });
    return response.data;
  },

  calculateAssetRisk: async (symbol: string, quantity: number, currentPrice: number) => {
    const response = await api.get(`/risk-metrics/asset/${symbol}`, {
      params: { quantity, currentPrice }
    });
    return response.data;
  },

  calculateBinancePortfolioRisk: async () => {
    const response = await api.get('/risk-metrics/binance-portfolio');
    return response.data;
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async (unreadOnly: boolean = false, limit: number = 50) => {
    const response = await api.get(`/notifications?unreadOnly=${unreadOnly}&limit=${limit}`);
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  getPreferences: async () => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (preferences: {
    budgetAlerts?: boolean;
    priceAlerts?: boolean;
    recurringReminders?: boolean;
    weeklyReport?: boolean;
    marketUpdates?: boolean;
  }) => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },

  registerPushToken: async (token: string, platform: string, deviceName?: string) => {
    const response = await api.post('/notifications/push-token', {
      token,
      platform,
      deviceName,
    });
    return response.data;
  },

  unregisterPushToken: async (token: string) => {
    const response = await api.delete('/notifications/push-token', {
      data: { token },
    });
    return response.data;
  },
};

export default {
  auth: authApi,
  categories: categoriesApi,
  markets: marketsApi,
  transactions: transactionsApi,
  accounts: accountsApi,
  budgets: budgetsApi,
  currency: currencyApi,
  backtesting: backtestingApi,
  apiKeys: apiKeysApi,
  advancedOrders: advancedOrdersApi,
  riskMetrics: riskMetricsApi,
  notifications: notificationsApi,
};
