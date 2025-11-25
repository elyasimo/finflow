// @ts-nocheck
import { Request, Response } from 'express';
import { stockTradingService, StockTradingService } from '../services/stock-trading.service';
import { apiKeysService } from '../services/api-keys.service';
import { db } from '../db.js';
import { accounts, transactions } from '../db/schema.js';
import { eq, and, sql, sum } from 'drizzle-orm';

/**
 * Stock Trading Controller
 * Handles stock trading operations via Alpaca API (Paper Trading - Free)
 */

export class StockTradingController {
  /**
   * Get user's stock trading service with their API keys or use environment keys
   */
  private async getUserStockService(userId: number): Promise<StockTradingService> {
    try {
      // Try to get user's personal API keys
      const keys = await apiKeysService.getApiKeys(userId.toString(), 'alpaca');
      
      if (keys && keys.apiKey && keys.apiSecret) {
        // Use paper trading by default for user keys
        return new StockTradingService(keys.apiKey, keys.apiSecret, true);
      }
    } catch (error) {
      // Fall through to environment keys
    }

    // Use environment API keys as fallback
    const envApiKey = process.env.ALPACA_API_KEY;
    const envApiSecret = process.env.ALPACA_API_SECRET;
    const envIsPaper = process.env.ALPACA_PAPER_TRADING !== 'false';

    if (envApiKey && envApiSecret) {
      return new StockTradingService(envApiKey, envApiSecret, envIsPaper);
    }

    throw new Error('No Alpaca API keys configured. Please add them to your environment or settings.');
  }

  /**
   * Get all supported stocks
   * GET /stock-trading/stocks
   */
  async getSupportedStocks(req: Request, res: Response): Promise<void> {
    try {
      const stocks = stockTradingService.getSupportedStocks();
      res.status(200).json(stocks);
    } catch (error: any) {
      console.error('Get supported stocks error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch supported stocks',
      });
    }
  }

  /**
   * Get stock quote
   * GET /stock-trading/quote/:symbol
   */
  async getStockQuote(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { symbol } = req.params;

      if (!symbol) {
        res.status(400).json({ error: 'Symbol is required' });
        return;
      }

      const service = await this.getUserStockService(userId);
      const quote = await service.getStockQuote(symbol);

      res.status(200).json(quote);
    } catch (error: any) {
      console.error('Get stock quote error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch stock quote',
      });
    }
  }

  /**
   * Get multiple stock quotes
   * POST /stock-trading/quotes
   */
  async getStockQuotes(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { symbols } = req.body;

      if (!symbols || !Array.isArray(symbols)) {
        res.status(400).json({ error: 'Symbols array is required' });
        return;
      }

      const service = await this.getUserStockService(userId);
      const quotes = await service.getStockQuotes(symbols);

      res.status(200).json(quotes);
    } catch (error: any) {
      console.error('Get stock quotes error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch stock quotes',
      });
    }
  }

  /**
   * Get portfolio summary based on user's real accounts from database
   * GET /stock-trading/portfolio
   */
  async getPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      
      // Calculate portfolio from user's actual accounts in database
      // Get all user's investment accounts
      const investmentAccounts = await db.select()
        .from(accounts)
        .where(and(
          eq(accounts.userId, userId),
          eq(accounts.type, 'investment')
        ));
      
      // Calculate balance for each investment account
      let totalValue = 0;
      
      for (const account of investmentAccounts) {
        // Get sum of all transactions for this account
        const transactionSum = await db
          .select({ sum: sql<number>`COALESCE(SUM(amount_cents), 0)` })
          .from(transactions)
          .where(eq(transactions.accountId, account.id));
        
        const transactionBalance = Number(transactionSum[0]?.sum || 0);
        
        // Investment account balance = opening balance + transactions
        const balance = (account.openingBalanceCents + transactionBalance) / 100;
        totalValue += balance;
      }
      
      // Buying power = same as total value (all investment account balance)
      // This represents the liquid cash available for trading within investments
      const availableCash = totalValue;
      
      const portfolio = {
        totalValue: totalValue,
        cash: availableCash,
        buyingPower: availableCash,
        dayChange: 0,
        dayChangePercent: 0,
        positions: [],
        allocation: []
      };

      res.status(200).json(portfolio);
    } catch (error: any) {
      console.error('Get portfolio error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch portfolio',
      });
    }
  }

  /**
   * Place market order
   * POST /stock-trading/order/market
   */
  async placeMarketOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { symbol, side, quantity, strategy } = req.body;

      if (!symbol || !side || !quantity) {
        res.status(400).json({
          error: 'Symbol, side, and quantity are required',
        });
        return;
      }

      if (side !== 'buy' && side !== 'sell') {
        res.status(400).json({
          error: 'Side must be "buy" or "sell"',
        });
        return;
      }

      const service = await this.getUserStockService(userId);
      const order = await service.placeMarketOrderWithStrategy(
        symbol,
        side,
        quantity,
        strategy
      );

      res.status(200).json(order);
    } catch (error: any) {
      console.error('Place market order error:', error);
      res.status(500).json({
        error: error.message || 'Failed to place market order',
      });
    }
  }

  /**
   * Place limit order
   * POST /stock-trading/order/limit
   */
  async placeLimitOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { symbol, side, quantity, limitPrice } = req.body;

      if (!symbol || !side || !quantity || !limitPrice) {
        res.status(400).json({
          error: 'Symbol, side, quantity, and limitPrice are required',
        });
        return;
      }

      if (side !== 'buy' && side !== 'sell') {
        res.status(400).json({
          error: 'Side must be "buy" or "sell"',
        });
        return;
      }

      const service = await this.getUserStockService(userId);
      const order = await service.placeLimitOrder(symbol, side, quantity, limitPrice);

      res.status(200).json(order);
    } catch (error: any) {
      console.error('Place limit order error:', error);
      res.status(500).json({
        error: error.message || 'Failed to place limit order',
      });
    }
  }

  /**
   * Get order history
   * GET /stock-trading/orders/history
   */
  async getOrderHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const service = await this.getUserStockService(userId);
      const orders = await service.getOrderHistory(limit);

      res.status(200).json(orders);
    } catch (error: any) {
      console.error('Get order history error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch order history',
      });
    }
  }

  /**
   * Get open orders
   * GET /stock-trading/orders/open
   */
  async getOpenOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const service = await this.getUserStockService(userId);
      const orders = await service.getOpenOrders();

      res.status(200).json(orders);
    } catch (error: any) {
      console.error('Get open orders error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch open orders',
      });
    }
  }

  /**
   * Cancel order
   * DELETE /stock-trading/orders/:orderId
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const service = await this.getUserStockService(userId);
      await service.cancelOrder(orderId);

      res.status(200).json({ message: 'Order cancelled successfully' });
    } catch (error: any) {
      console.error('Cancel order error:', error);
      res.status(500).json({
        error: error.message || 'Failed to cancel order',
      });
    }
  }

  /**
   * Get historical prices
   * GET /stock-trading/history/:symbol
   */
  async getHistoricalPrices(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { symbol } = req.params;
      const timeframe = (req.query.timeframe as any) || '1Day';
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      if (!symbol) {
        res.status(400).json({ error: 'Symbol is required' });
        return;
      }

      const service = await this.getUserStockService(userId);
      const prices = await service.getHistoricalPrices(symbol, timeframe, days);

      res.status(200).json(prices);
    } catch (error: any) {
      console.error('Get historical prices error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch historical prices',
      });
    }
  }

  /**
   * Check if market is open
   * GET /stock-trading/market/status
   */
  async getMarketStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const service = await this.getUserStockService(userId);
      const isOpen = await service.isMarketOpen();

      res.status(200).json({ isOpen });
    } catch (error: any) {
      console.error('Get market status error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch market status',
      });
    }
  }

  /**
   * Get trading strategies
   * GET /stock-trading/strategies
   */
  async getTradingStrategies(req: Request, res: Response): Promise<void> {
    try {
      const strategies = stockTradingService.getTradingStrategies();
      res.status(200).json(strategies);
    } catch (error: any) {
      console.error('Get trading strategies error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch trading strategies',
      });
    }
  }

  /**
   * Calculate position size
   * POST /stock-trading/calculate-position
   */
  async calculatePositionSize(req: Request, res: Response): Promise<void> {
    try {
      const { portfolioValue, stockPrice, strategy } = req.body;

      if (!portfolioValue || !stockPrice || !strategy) {
        res.status(400).json({
          error: 'portfolioValue, stockPrice, and strategy are required',
        });
        return;
      }

      const positionSize = stockTradingService.calculatePositionSize(
        portfolioValue,
        stockPrice,
        strategy
      );

      res.status(200).json({ positionSize });
    } catch (error: any) {
      console.error('Calculate position size error:', error);
      res.status(500).json({
        error: error.message || 'Failed to calculate position size',
      });
    }
  }

  /**
   * Liquidate position
   * DELETE /stock-trading/positions/:symbol
   */
  async liquidatePosition(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { symbol } = req.params;

      if (!symbol) {
        res.status(400).json({ error: 'Symbol is required' });
        return;
      }

      const service = await this.getUserStockService(userId);
      const order = await service.liquidatePosition(symbol);

      res.status(200).json(order);
    } catch (error: any) {
      console.error('Liquidate position error:', error);
      res.status(500).json({
        error: error.message || 'Failed to liquidate position',
      });
    }
  }

  /**
   * Get account info
   * GET /stock-trading/account
   */
  async getAccountInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const service = await this.getUserStockService(userId);
      const account = await service.getAccountInfo();

      res.status(200).json(account);
    } catch (error: any) {
      console.error('Get account info error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch account info',
      });
    }
  }
}

export const stockTradingController = new StockTradingController();
