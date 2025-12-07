// @ts-nocheck
import { Request, Response } from 'express';
import { tradingAgentService } from '../services/trading-agent.service';
import { binanceTradingService } from '../services/binance-trading.service';
import { apiKeysService } from '../services/api-keys.service.js';
import { SUPPORTED_CRYPTOCURRENCIES, getCryptocurrenciesByCategory, getCryptocurrenciesByRisk } from '../config/supported-cryptocurrencies';

export class TradingAgentController {
  /**
   * Create a new trading agent
   */
  async createAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const {
        name,
        assets,
        strategy,
        stopLossPercent,
        takeProfitPercent,
        trailingStopPercent,
        maxDailyTradesEur,
        maxSingleTradeEur,
      } = req.body;

      // Validation
      if (!name || !assets || !Array.isArray(assets) || assets.length === 0) {
        res.status(400).json({ error: 'Name and assets are required' });
        return;
      }

      // Validate stop-loss (5-20%)
      if (stopLossPercent && (stopLossPercent < 5 || stopLossPercent > 20)) {
        res.status(400).json({ error: 'Stop-loss must be between 5% and 20%' });
        return;
      }

      // Validate take-profit (10-50%)
      if (takeProfitPercent && (takeProfitPercent < 10 || takeProfitPercent > 50)) {
        res.status(400).json({ error: 'Take-profit must be between 10% and 50%' });
        return;
      }

      // Entry prices will be set when the agent first runs with valid API keys
      const entryPrices: Record<string, number> = {};

      // Try to get current prices (public API - no keys needed)
      try {
        const prices = await binanceTradingService.getPrices(assets, 'EUR');
        for (const asset of assets) {
          const priceData = prices.get(asset);
          if (priceData) {
            entryPrices[asset] = priceData.price;
          }
        }
      } catch (priceError) {
        console.log('Could not fetch initial prices, will be set on first run');
      }

      const agentId = await tradingAgentService.createAgent(userId, {
        name,
        assets,
        strategy: strategy || 'conservative',
        stopLossPercent: stopLossPercent || 8,
        takeProfitPercent: takeProfitPercent || 15,
        trailingStopPercent,
        maxDailyTradesCents: (maxDailyTradesEur || 100) * 100,
        maxSingleTradeCents: (maxSingleTradeEur || 50) * 100,
        entryPrices,
      });

      const agent = await tradingAgentService.getAgent(agentId);

      res.status(201).json({
        message: 'Trading agent created successfully',
        agent,
      });
    } catch (error: any) {
      console.error('Create agent error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all agents for the authenticated user
   */
  async getAgents(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const agents = await tradingAgentService.getUserAgents(userId);

      res.json({ agents });
    } catch (error: any) {
      console.error('Get agents error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get a specific agent
   */
  async getAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const agent = await tradingAgentService.getAgent(id);

      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }

      // Authorization check: ensure agent belongs to user
      if (agent.userId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({ agent });
    } catch (error: any) {
      console.error('Get agent error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update agent configuration
   */
  async updateAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const updates = req.body;

      // Authorization check: ensure agent belongs to user
      const existingAgent = await tradingAgentService.getAgent(id);
      if (!existingAgent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }
      if (existingAgent.userId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Validate stop-loss if provided
      if (updates.stopLossPercent && (updates.stopLossPercent < 5 || updates.stopLossPercent > 20)) {
        res.status(400).json({ error: 'Stop-loss must be between 5% and 20%' });
        return;
      }

      // Validate take-profit if provided
      if (updates.takeProfitPercent && (updates.takeProfitPercent < 10 || updates.takeProfitPercent > 50)) {
        res.status(400).json({ error: 'Take-profit must be between 10% and 50%' });
        return;
      }

      // Convert EUR to cents if provided
      if (updates.maxDailyTradesEur) {
        updates.maxDailyTradesCents = updates.maxDailyTradesEur * 100;
        delete updates.maxDailyTradesEur;
      }
      if (updates.maxSingleTradeEur) {
        updates.maxSingleTradeCents = updates.maxSingleTradeEur * 100;
        delete updates.maxSingleTradeEur;
      }

      await tradingAgentService.updateAgent(id, updates);
      const agent = await tradingAgentService.getAgent(id);

      res.json({
        message: 'Agent updated successfully',
        agent,
      });
    } catch (error: any) {
      console.error('Update agent error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Toggle agent on/off
   */
  async toggleAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const { enabled } = req.body;

      // Authorization check: ensure agent belongs to user
      const existingAgent = await tradingAgentService.getAgent(id);
      if (!existingAgent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }
      if (existingAgent.userId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (typeof enabled !== 'boolean') {
        res.status(400).json({ error: 'enabled must be a boolean' });
        return;
      }

      await tradingAgentService.toggleAgent(id, enabled);
      const agent = await tradingAgentService.getAgent(id);

      res.json({
        message: `Agent ${enabled ? 'enabled' : 'disabled'} successfully`,
        agent,
      });
    } catch (error: any) {
      console.error('Toggle agent error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete an agent
   */
  async deleteAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      // Authorization check: ensure agent belongs to user
      const existingAgent = await tradingAgentService.getAgent(id);
      if (!existingAgent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }
      if (existingAgent.userId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await tradingAgentService.deleteAgent(id);

      res.json({ message: 'Agent deleted successfully' });
    } catch (error: any) {
      console.error('Delete agent error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get trade logs for an agent
   */
  async getAgentLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const logs = await tradingAgentService.getAgentLogs(id, limit);

      res.json({ logs });
    } catch (error: any) {
      console.error('Get agent logs error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all trading history for user (across all agents)
   */
  async getAllTradingHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string; // executed, failed, pending
      const asset = req.query.asset as string;
      const action = req.query.action as string; // buy, sell, stop_loss, take_profit

      const history = await tradingAgentService.getAllTradingHistory(userId, {
        limit,
        offset,
        status,
        asset,
        action,
      });

      res.json(history);
    } catch (error: any) {
      console.error('Get all trading history error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Manually trigger agent cycle (for testing)
   */
  async triggerCycle(req: Request, res: Response): Promise<void> {
    try {
      await tradingAgentService.runCycle();
      res.json({ message: 'Agent cycle triggered successfully' });
    } catch (error: any) {
      console.error('Trigger cycle error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get current portfolio status with agent analysis
   */
  async getPortfolioAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      // Get user's agents first
      const agents = await tradingAgentService.getUserAgents(userId);

      // Try to get balances using user-specific API keys
      let balances: Array<{ asset: string; free: string; locked: string }> = [];
      let hasApiKeys = false;

      try {
        // Check if user has API keys configured
        const userApiKeys = await apiKeysService.getUserApiKeys(userId, 'binance');
        if (userApiKeys) {
          hasApiKeys = true;
          // Create a temporary service with user's keys
          const { BinanceTradingService } = await import('../services/binance-trading.service.js');
          const userBinanceService = new BinanceTradingService(userApiKeys.apiKey, userApiKeys.apiSecret);
          balances = await userBinanceService.getBalances();
        }
      } catch (apiKeyError) {
        console.log('Could not fetch balances - user may not have API keys configured');
      }

      // If no balances, return empty portfolio with just agents info
      if (balances.length === 0) {
        res.json({
          portfolio: [],
          totalValueEur: 0,
          agents: agents.map(a => ({
            id: a.id,
            name: a.name,
            enabled: a.enabled,
            assets: a.assets,
            strategy: a.strategy,
          })),
          hasApiKeys,
        });
        return;
      }

      const assets = balances
        .filter(b => !['EUR', 'USDT', 'BUSD'].includes(b.asset))
        .map(b => b.asset);

      if (assets.length === 0) {
        res.json({
          portfolio: [],
          totalValueEur: 0,
          agents: agents.map(a => ({
            id: a.id,
            name: a.name,
            enabled: a.enabled,
            assets: a.assets,
            strategy: a.strategy,
          })),
          hasApiKeys,
        });
        return;
      }

      const prices = await binanceTradingService.getPrices(assets, 'EUR');

      const portfolio = balances
        .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map(balance => {
          const priceData = prices.get(balance.asset);
          const quantity = parseFloat(balance.free) + parseFloat(balance.locked);
          const valueEur = priceData ? quantity * priceData.price : 0;

          // Find agent monitoring this asset
          const monitoringAgent = agents.find(a =>
            a.assets.includes(balance.asset) && a.enabled
          );

          return {
            asset: balance.asset,
            quantity,
            free: parseFloat(balance.free),
            locked: parseFloat(balance.locked),
            priceEur: priceData?.price || 0,
            priceChange24h: priceData?.priceChange24h || 0,
            valueEur,
            monitoredBy: monitoringAgent?.name || null,
          };
        });

      const totalValueEur = portfolio.reduce((sum, p) => sum + p.valueEur, 0);

      res.json({
        portfolio,
        totalValueEur,
        agents: agents.map(a => ({
          id: a.id,
          name: a.name,
          enabled: a.enabled,
          assets: a.assets,
          strategy: a.strategy,
        })),
        hasApiKeys,
      });
    } catch (error: any) {
      console.error('Portfolio analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get list of supported cryptocurrencies
   */
  async getSupportedCryptocurrencies(req: Request, res: Response): Promise<void> {
    try {
      const { category, riskLevel } = req.query;

      let cryptos = SUPPORTED_CRYPTOCURRENCIES;

      if (category) {
        cryptos = getCryptocurrenciesByCategory(category as any);
      }

      if (riskLevel) {
        cryptos = getCryptocurrenciesByRisk(riskLevel as any);
      }

      // Group by category for easier frontend consumption
      const grouped = cryptos.reduce((acc, crypto) => {
        if (!acc[crypto.category]) {
          acc[crypto.category] = [];
        }
        acc[crypto.category].push(crypto);
        return acc;
      }, {} as Record<string, typeof SUPPORTED_CRYPTOCURRENCIES>);

      res.json({
        total: cryptos.length,
        cryptocurrencies: cryptos,
        grouped,
        categories: ['major', 'defi', 'layer1', 'layer2', 'meme', 'stablecoin', 'ai', 'gaming'],
        riskLevels: ['low', 'medium', 'high', 'very-high'],
      });
    } catch (error: any) {
      console.error('Get supported cryptocurrencies error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get current prices for all supported cryptocurrencies
   */
  async getAllCryptoPrices(req: Request, res: Response): Promise<void> {
    try {
      // Get all supported crypto symbols, excluding stablecoins (they don't need prices)
      const assets = SUPPORTED_CRYPTOCURRENCIES
        .filter(c => c.category !== 'stablecoin')
        .map(c => c.symbol);

      // Fetch prices from Binance (via USDT pairs, converted to EUR)
      const prices = await binanceTradingService.getPrices(assets, 'EUR');

      // Convert to simple object format
      const pricesObject: Record<string, { price: number; priceChange24h: number }> = {};
      prices.forEach((priceData, asset) => {
        pricesObject[asset] = {
          price: priceData.price,
          priceChange24h: priceData.priceChange24h,
        };
      });

      res.json({
        prices: pricesObject,
        timestamp: new Date().toISOString(),
        count: Object.keys(pricesObject).length,
      });
    } catch (error: any) {
      console.error('Get all crypto prices error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get technical analysis for an asset
   */
  async getTechnicalAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const { technicalIndicatorsService } = await import('../services/technical-indicators.service');

      const analysis = await technicalIndicatorsService.analyze(symbol, 'EUR');
      const sentiment = technicalIndicatorsService.getMarketSentiment(analysis);

      res.json({
        symbol,
        analysis,
        sentiment,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Technical analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const tradingAgentController = new TradingAgentController();
