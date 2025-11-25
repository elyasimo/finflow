import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { AuthController } from './controllers/auth.controller.js';
import { AccountsController } from './controllers/accounts.controller.js';
import { TransactionsController } from './controllers/transactions.controller.js';
import { BudgetsController } from './controllers/budgets.controller.js';
import { CategoriesController } from './controllers/categories.controller.js';
import { MarketsController } from './controllers/markets.controller.js';
import { TradingAgentController } from './controllers/trading-agent.controller.js';
import { TranslationController } from './controllers/translation.controller.js';
import { currencyController } from './controllers/currency.controller.js';
import { apiKeysController } from './controllers/api-keys.controller.js';
import { backtestingController } from './controllers/backtesting.controller.js';
import { advancedOrdersController } from './controllers/advanced-orders.controller.js';
import { riskMetricsController } from './controllers/risk-metrics.controller.js';
import { stockTradingController } from './controllers/stock-trading.controller.js';
import { tradingPerformanceController } from './controllers/trading-performance.controller.js';
import { priceAlertsController } from './controllers/price-alerts.controller.js';
import { authMiddleware } from './middleware/auth.js';
import { tradingAgentService } from './services/trading-agent.service.js';
import { webSocketService } from './services/websocket.service.js';
import { alertsMonitorService } from './services/alerts-monitor.service.js';
import { db } from './db.js';
import { sql } from 'drizzle-orm';
import { runMigrations } from './utils/migrations.js';
import http from 'http';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 8080;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  }),
);
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
});

app.use('/auth', limiter);

// Controllers
const authController = new AuthController();
const accountsController = new AccountsController();
const transactionsController = new TransactionsController();
const budgetsController = new BudgetsController();
const categoriesController = new CategoriesController();
const marketsController = new MarketsController();
const tradingAgentController = new TradingAgentController();
const translationController = new TranslationController();

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// Auth routes (public)
app.post('/auth/register', (req, res) => authController.register(req, res));
app.post('/auth/login', (req, res) => authController.login(req, res));

// Protected routes
app.get('/auth/me', authMiddleware, (req, res) => authController.getMe(req, res));
app.put('/auth/preferences', authMiddleware, (req, res) => authController.updatePreferences(req, res));
app.put('/auth/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));
app.post('/auth/seed-categories', authMiddleware, (req, res) => authController.seedDefaultCategories(req, res));

// Accounts routes
app.get('/accounts', authMiddleware, (req, res) => accountsController.list(req, res));
app.post('/accounts', authMiddleware, (req, res) => accountsController.create(req, res));
app.put('/accounts/:id', authMiddleware, (req, res) => accountsController.update(req, res));
app.delete('/accounts/:id', authMiddleware, (req, res) => accountsController.archive(req, res));

// Transactions routes
app.get('/transactions', authMiddleware, (req, res) => transactionsController.list(req, res));
app.post('/transactions', authMiddleware, (req, res) => transactionsController.create(req, res));
app.post('/transactions/import', authMiddleware, (req, res) => transactionsController.importCsv(req, res));
app.put('/transactions/:id', authMiddleware, (req, res) => transactionsController.update(req, res));
app.delete('/transactions/:id', authMiddleware, (req, res) => transactionsController.delete(req, res));

// Budgets routes
app.get('/budgets', authMiddleware, (req, res) => budgetsController.list(req, res));
app.get('/budgets/suggestions', authMiddleware, (req, res) => budgetsController.getSuggestions(req, res));
app.get('/budgets/:id', authMiddleware, (req, res) => budgetsController.getById(req, res));
app.get('/budgets/:id/usage', authMiddleware, (req, res) => budgetsController.getBudgetUsage(req, res));
app.post('/budgets', authMiddleware, (req, res) => budgetsController.create(req, res));
app.put('/budgets/:id', authMiddleware, (req, res) => budgetsController.update(req, res));
app.delete('/budgets/:id', authMiddleware, (req, res) => budgetsController.delete(req, res));

// Categories routes
app.get('/categories', authMiddleware, (req, res) => categoriesController.list(req, res));
app.get('/categories/:id', authMiddleware, (req, res) => categoriesController.getById(req, res));
app.post('/categories', authMiddleware, (req, res) => categoriesController.create(req, res));
app.put('/categories/:id', authMiddleware, (req, res) => categoriesController.update(req, res));
app.delete('/categories/:id', authMiddleware, (req, res) => categoriesController.delete(req, res));

// Markets routes
app.get('/markets/financial', authMiddleware, (req, res) => marketsController.getFinancialMarkets(req, res));
app.get('/markets/crypto', authMiddleware, (req, res) => marketsController.getCryptoMarkets(req, res));
app.get('/markets/portfolio', authMiddleware, (req, res) => marketsController.getBinancePortfolio(req, res));

// Trading Agent routes
app.get('/trading-agents', authMiddleware, (req, res) => tradingAgentController.getAgents(req, res));
app.post('/trading-agents', authMiddleware, (req, res) => tradingAgentController.createAgent(req, res));
app.get('/trading-agents/portfolio-analysis', authMiddleware, (req, res) => tradingAgentController.getPortfolioAnalysis(req, res));
app.get('/trading-agents/supported-cryptocurrencies', authMiddleware, (req, res) => tradingAgentController.getSupportedCryptocurrencies(req, res));
app.get('/trading-agents/crypto-prices', authMiddleware, (req, res) => tradingAgentController.getAllCryptoPrices(req, res));
app.get('/trading-agents/trading-history', authMiddleware, (req, res) => tradingAgentController.getAllTradingHistory(req, res));
app.get('/trading-agents/performance', authMiddleware, (req, res) => tradingPerformanceController.getPerformance(req, res));
app.get('/trading-agents/technical-analysis/:symbol', authMiddleware, (req, res) => tradingAgentController.getTechnicalAnalysis(req, res));
app.get('/trading-agents/:id', authMiddleware, (req, res) => tradingAgentController.getAgent(req, res));
app.put('/trading-agents/:id', authMiddleware, (req, res) => tradingAgentController.updateAgent(req, res));
app.delete('/trading-agents/:id', authMiddleware, (req, res) => tradingAgentController.deleteAgent(req, res));
app.post('/trading-agents/:id/toggle', authMiddleware, (req, res) => tradingAgentController.toggleAgent(req, res));
app.get('/trading-agents/:id/logs', authMiddleware, (req, res) => tradingAgentController.getAgentLogs(req, res));
app.post('/trading-agents/trigger-cycle', authMiddleware, (req, res) => tradingAgentController.triggerCycle(req, res));

// Translation routes
app.post('/translations/translate-all', authMiddleware, (req, res) => translationController.translateAll(req, res));
app.post('/translations/translate-text', authMiddleware, (req, res) => translationController.translateText(req, res));

// Currency routes
app.get('/currency/rates', authMiddleware, (req, res) => currencyController.getExchangeRates(req, res));
app.post('/currency/convert', authMiddleware, (req, res) => currencyController.convertCurrency(req, res));
app.get('/currency/supported', authMiddleware, (req, res) => currencyController.getSupportedCurrencies(req, res));

// API Keys routes (encrypted storage)
app.post('/api-keys/:provider', authMiddleware, (req, res) => apiKeysController.storeKeys(req, res));
app.get('/api-keys/:provider/status', authMiddleware, (req, res) => apiKeysController.checkStatus(req, res));
app.delete('/api-keys/:provider', authMiddleware, (req, res) => apiKeysController.deleteKeys(req, res));
app.get('/api-keys/providers', authMiddleware, (req, res) => apiKeysController.listProviders(req, res));

// Backtesting routes
app.post('/backtesting/run', authMiddleware, (req, res) => backtestingController.runBacktest(req, res));
app.post('/backtesting/compare', authMiddleware, (req, res) => backtestingController.compareStrategies(req, res));
app.get('/backtesting/quick/:symbol', authMiddleware, (req, res) => backtestingController.quickBacktest(req, res));

// Advanced Orders routes
app.post('/orders/market', authMiddleware, (req, res) => advancedOrdersController.placeMarketOrder(req, res));
app.post('/orders/limit', authMiddleware, (req, res) => advancedOrdersController.placeLimitOrder(req, res));
app.post('/orders/stop-loss', authMiddleware, (req, res) => advancedOrdersController.placeStopLossOrder(req, res));
app.post('/orders/take-profit', authMiddleware, (req, res) => advancedOrdersController.placeTakeProfitOrder(req, res));
app.post('/orders/oco', authMiddleware, (req, res) => advancedOrdersController.placeOCOOrder(req, res));
app.get('/orders/:symbol/:orderId', authMiddleware, (req, res) => advancedOrdersController.getOrderStatus(req, res));
app.delete('/orders/:symbol/:orderId', authMiddleware, (req, res) => advancedOrdersController.cancelOrder(req, res));
app.get('/orders/open/:symbol?', authMiddleware, (req, res) => advancedOrdersController.getOpenOrders(req, res));

// Risk Metrics routes
app.post('/risk-metrics/portfolio', authMiddleware, (req, res) => riskMetricsController.calculatePortfolioRisk(req, res));
app.get('/risk-metrics/asset/:symbol', authMiddleware, (req, res) => riskMetricsController.calculateAssetRisk(req, res));
app.get('/risk-metrics/binance-portfolio', authMiddleware, (req, res) => riskMetricsController.calculateBinancePortfolioRisk(req, res));

// Stock Trading routes
app.get('/stock-trading/stocks', authMiddleware, (req, res) => stockTradingController.getSupportedStocks(req, res));
app.get('/stock-trading/quote/:symbol', authMiddleware, (req, res) => stockTradingController.getStockQuote(req, res));
app.post('/stock-trading/quotes', authMiddleware, (req, res) => stockTradingController.getStockQuotes(req, res));
app.get('/stock-trading/portfolio', authMiddleware, (req, res) => stockTradingController.getPortfolio(req, res));
app.post('/stock-trading/order/market', authMiddleware, (req, res) => stockTradingController.placeMarketOrder(req, res));
app.post('/stock-trading/order/limit', authMiddleware, (req, res) => stockTradingController.placeLimitOrder(req, res));
app.get('/stock-trading/orders/history', authMiddleware, (req, res) => stockTradingController.getOrderHistory(req, res));
app.get('/stock-trading/orders/open', authMiddleware, (req, res) => stockTradingController.getOpenOrders(req, res));
app.delete('/stock-trading/orders/:orderId', authMiddleware, (req, res) => stockTradingController.cancelOrder(req, res));
app.get('/stock-trading/history/:symbol', authMiddleware, (req, res) => stockTradingController.getHistoricalPrices(req, res));
app.get('/stock-trading/market/status', authMiddleware, (req, res) => stockTradingController.getMarketStatus(req, res));
app.get('/stock-trading/strategies', authMiddleware, (req, res) => stockTradingController.getTradingStrategies(req, res));
app.post('/stock-trading/calculate-position', authMiddleware, (req, res) => stockTradingController.calculatePositionSize(req, res));
app.delete('/stock-trading/positions/:symbol', authMiddleware, (req, res) => stockTradingController.liquidatePosition(req, res));
app.get('/stock-trading/account', authMiddleware, (req, res) => stockTradingController.getAccountInfo(req, res));

// Trading Performance routes
app.get('/trading-agents/performance', authMiddleware, (req, res) => tradingPerformanceController.getPerformance(req, res));

// Price Alerts routes
app.get('/price-alerts', authMiddleware, (req, res) => priceAlertsController.getUserAlerts(req, res));
app.post('/price-alerts', authMiddleware, (req, res) => priceAlertsController.createAlert(req, res));
app.delete('/price-alerts/:id', authMiddleware, (req, res) => priceAlertsController.deleteAlert(req, res));
app.put('/price-alerts/:id/toggle', authMiddleware, (req, res) => priceAlertsController.toggleAlert(req, res));
app.post('/price-alerts/check', authMiddleware, (req, res) => priceAlertsController.checkAlerts(req, res));

// Users/Profile routes
app.get('/users/profile', authMiddleware, (req, res) => authController.getMe(req, res));
app.put('/users/profile', authMiddleware, (req, res) => {
  res.json({ message: 'Profile update coming soon' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method 
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(500).json({ 
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
webSocketService.initialize(server);

// Start server
server.listen(port, async () => {
  console.log(`🚀 Finflow API running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔌 WebSocket available at ws://localhost:${port}/ws`);

  // Run migrations on startup
  await runMigrations();

  // Start trading agent service (checks every 60 seconds)
  if (process.env.ENABLE_TRADING_AGENT === 'true') {
    tradingAgentService.start(60000);
    console.log(`🤖 Trading agent service started`);
  }

  // Start price alerts monitor (checks every 60 seconds)
  alertsMonitorService.start(60000);
  console.log(`🔔 Price alerts monitor started`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Stop background services
    if (process.env.ENABLE_TRADING_AGENT === 'true') {
      tradingAgentService.stop();
      console.log('Trading agent service stopped');
    }
    
    alertsMonitorService.stop();
    console.log('Price alerts monitor stopped');
    
    webSocketService.stop();
    console.log('WebSocket service stopped');
    
    // Close database connections
    try {
      // Add database cleanup if needed
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
    
    console.log('Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
});

export default app;
