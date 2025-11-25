// @ts-nocheck
import { eq, and, gte, sql, desc, or } from 'drizzle-orm';
import { db } from '../db';
import { tradingAgents, tradingLogs } from '../db/schema.js';
import { binanceTradingService } from './binance-trading.service';

interface AgentConfig {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  assets: string[];
  strategy: string;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopPercent: number | null;
  maxDailyTradesCents: number;
  maxSingleTradeCents: number;
  entryPrices: Record<string, number>;
}

interface TradeDecision {
  action: 'hold' | 'buy' | 'sell' | 'stop_loss' | 'take_profit';
  asset: string;
  reason: string;
  quantity?: number;
  percentage?: number;
}

export class TradingAgentService {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the trading agent monitoring loop
   */
  async start(intervalMs: number = 60000): Promise<void> {
    if (this.isRunning) {
      console.log('Trading agent is already running');
      return;
    }

    console.log('Starting trading agent...');
    this.isRunning = true;

    // Run immediately
    await this.runCycle();

    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.runCycle();
    }, intervalMs);
  }

  /**
   * Stop the trading agent
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Trading agent stopped');
  }

  /**
   * Run one cycle of checking all active agents
   */
  async runCycle(): Promise<void> {
    try {
      // Get all enabled agents
      const agents = await db
        .select()
        .from(tradingAgents)
        .where(eq(tradingAgents.enabled, true));

      for (const agent of agents) {
        await this.processAgent(agent as any);
      }
    } catch (error) {
      console.error('Trading agent cycle error:', error);
    }
  }

  /**
   * Process a single agent's trading logic
   */
  private async processAgent(agent: AgentConfig): Promise<void> {
    try {
      // Check daily trade limit
      const dailyTraded = await this.getDailyTradedAmount(agent.id);
      if (dailyTraded >= agent.maxDailyTradesCents) {
        console.log(`Agent ${agent.name}: Daily limit reached (${dailyTraded / 100}€)`);
        return;
      }

      // Get current prices
      const prices = await binanceTradingService.getPrices(agent.assets, 'EUR');
      const balances = await binanceTradingService.getBalances();

      // Analyze each asset
      for (const asset of agent.assets) {
        const priceData = prices.get(asset);
        if (!priceData) continue;

        const balance = balances.find(b => b.asset === asset);
        const holdings = balance ? parseFloat(balance.free) : 0;

        const decision = this.analyzeAsset(
          agent,
          asset,
          priceData.price,
          priceData.priceChange24h,
          holdings
        );

        if (decision.action !== 'hold') {
          await this.executeDecision(agent, decision, priceData.price);
        }
      }
    } catch (error) {
      console.error(`Error processing agent ${agent.name}:`, error);
      await this.logTrade(agent.id, {
        action: 'error',
        asset: 'SYSTEM',
        reason: `Processing error: ${(error as Error).message}`,
        status: 'failed',
        errorMessage: (error as Error).message,
      });
    }
  }

  /**
   * Analyze an asset and decide on action
   */
  private analyzeAsset(
    agent: AgentConfig,
    asset: string,
    currentPrice: number,
    priceChange24h: number,
    holdings: number
  ): TradeDecision {
    const entryPrice = agent.entryPrices?.[asset];

    // If we have holdings and entry price, check stop-loss and take-profit
    if (holdings > 0 && entryPrice) {
      const priceChangeFromEntry = ((currentPrice - entryPrice) / entryPrice) * 100;

      // STOP-LOSS: Sell if price dropped below threshold
      if (priceChangeFromEntry <= -agent.stopLossPercent) {
        return {
          action: 'stop_loss',
          asset,
          reason: `Stop-loss triggered: Price dropped ${priceChangeFromEntry.toFixed(2)}% from entry (threshold: -${agent.stopLossPercent}%)`,
          percentage: 100, // Sell all on stop-loss
        };
      }

      // TAKE-PROFIT: Sell portion if price increased above threshold
      if (priceChangeFromEntry >= agent.takeProfitPercent) {
        // Sell 50% on first take-profit
        return {
          action: 'take_profit',
          asset,
          reason: `Take-profit triggered: Price up ${priceChangeFromEntry.toFixed(2)}% from entry (threshold: +${agent.takeProfitPercent}%)`,
          percentage: 50, // Sell half to secure profits
        };
      }

      // TRAILING STOP: If configured and in profit
      if (agent.trailingStopPercent && priceChangeFromEntry > 0) {
        // This would need high watermark tracking - simplified version
        const trailingTrigger = priceChangeFromEntry - agent.trailingStopPercent;
        if (trailingTrigger < 0 && priceChangeFromEntry > agent.trailingStopPercent) {
          return {
            action: 'sell',
            asset,
            reason: `Trailing stop: Price retraced ${agent.trailingStopPercent}% from highs`,
            percentage: 100,
          };
        }
      }
    }

    // Strategy-based decisions for buying
    if (agent.strategy === 'conservative') {
      // Only buy on significant dips (>5% in 24h)
      if (priceChange24h < -5 && holdings === 0) {
        return {
          action: 'buy',
          asset,
          reason: `Conservative buy: 24h dip of ${priceChange24h.toFixed(2)}%`,
        };
      }
    } else if (agent.strategy === 'moderate') {
      // Buy on moderate dips (>3%)
      if (priceChange24h < -3 && holdings === 0) {
        return {
          action: 'buy',
          asset,
          reason: `Moderate buy: 24h dip of ${priceChange24h.toFixed(2)}%`,
        };
      }
    }

    return {
      action: 'hold',
      asset,
      reason: 'No action needed',
    };
  }

  /**
   * Execute a trading decision
   */
  private async executeDecision(
    agent: AgentConfig,
    decision: TradeDecision,
    currentPrice: number
  ): Promise<void> {
    console.log(`Agent ${agent.name}: ${decision.action} ${decision.asset} - ${decision.reason}`);

    let result;
    let totalValueCents = 0;

    try {
      if (decision.action === 'buy') {
        // Buy with max single trade amount
        const amountEur = Math.min(
          agent.maxSingleTradeCents / 100,
          (agent.maxDailyTradesCents - await this.getDailyTradedAmount(agent.id)) / 100
        );

        if (amountEur < 10) {
          await this.logTrade(agent.id, {
            action: decision.action,
            asset: decision.asset,
            reason: 'Insufficient daily limit remaining',
            status: 'cancelled',
          });
          return;
        }

        result = await binanceTradingService.marketBuy(decision.asset, 'EUR', amountEur);
        totalValueCents = amountEur * 100;

        // Update entry price
        if (result.success) {
          await this.updateEntryPrice(agent.id, decision.asset, currentPrice);
        }
      } else if (['sell', 'stop_loss', 'take_profit'].includes(decision.action)) {
        // Sell percentage of holdings
        result = await binanceTradingService.sellPercentage(
          decision.asset,
          'EUR',
          decision.percentage || 100
        );

        if (result.success && result.executedQty) {
          totalValueCents = parseFloat(result.executedQty) * currentPrice * 100;
        }
      }

      // Log the trade
      await this.logTrade(agent.id, {
        action: decision.action,
        asset: decision.asset,
        quantity: result?.executedQty ? parseFloat(result.executedQty) : undefined,
        priceAtAction: currentPrice,
        totalValueCents,
        reason: decision.reason,
        orderId: result?.orderId,
        status: result?.success ? 'executed' : 'failed',
        errorMessage: result?.error,
      });

      // Update agent stats
      if (result?.success) {
        await db
          .update(tradingAgents)
          .set({
            totalTradesExecuted: sql`${tradingAgents.totalTradesExecuted} + 1`,
            lastTradeAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(tradingAgents.id, agent.id));
      }
    } catch (error) {
      await this.logTrade(agent.id, {
        action: decision.action,
        asset: decision.asset,
        reason: decision.reason,
        status: 'failed',
        errorMessage: (error as Error).message,
      });
    }
  }

  /**
   * Get total traded amount today for an agent
   */
  private async getDailyTradedAmount(agentId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${tradingLogs.totalValueCents}), 0)`,
      })
      .from(tradingLogs)
      .where(
        and(
          eq(tradingLogs.agentId, agentId),
          eq(tradingLogs.status, 'executed'),
          gte(tradingLogs.createdAt, today)
        )
      );

    return result[0]?.total || 0;
  }

  /**
   * Update entry price for an asset
   */
  private async updateEntryPrice(agentId: string, asset: string, price: number): Promise<void> {
    const agent = await db
      .select({ entryPrices: tradingAgents.entryPrices })
      .from(tradingAgents)
      .where(eq(tradingAgents.id, agentId))
      .limit(1);

    const currentPrices = (agent[0]?.entryPrices as Record<string, number>) || {};
    currentPrices[asset] = price;

    await db
      .update(tradingAgents)
      .set({
        entryPrices: currentPrices,
        updatedAt: new Date(),
      })
      .where(eq(tradingAgents.id, agentId));
  }

  /**
   * Log a trade action
   */
  private async logTrade(
    agentId: string,
    data: {
      action: string;
      asset: string;
      quantity?: number;
      priceAtAction?: number;
      totalValueCents?: number;
      reason: string;
      orderId?: string;
      status: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    await db.insert(tradingLogs).values({
      agentId,
      action: data.action,
      asset: data.asset,
      quantity: data.quantity?.toString(),
      priceAtAction: data.priceAtAction?.toString(),
      totalValueCents: data.totalValueCents || 0,
      reason: data.reason,
      orderId: data.orderId,
      status: data.status,
      errorMessage: data.errorMessage,
    });
  }

  /**
   * Create a new trading agent
   */
  async createAgent(
    userId: string,
    config: {
      name: string;
      assets: string[];
      strategy?: string;
      stopLossPercent?: number;
      takeProfitPercent?: number;
      trailingStopPercent?: number;
      maxDailyTradesCents?: number;
      maxSingleTradeCents?: number;
      entryPrices?: Record<string, number>;
    }
  ): Promise<string> {
    const result = await db
      .insert(tradingAgents)
      .values({
        userId,
        name: config.name,
        assets: config.assets,
        strategy: config.strategy || 'conservative',
        stopLossPercent: config.stopLossPercent?.toString() || '8.0',
        takeProfitPercent: config.takeProfitPercent?.toString() || '15.0',
        trailingStopPercent: config.trailingStopPercent?.toString(),
        maxDailyTradesCents: config.maxDailyTradesCents || 10000,
        maxSingleTradeCents: config.maxSingleTradeCents || 5000,
        entryPrices: config.entryPrices || {},
      })
      .returning({ id: tradingAgents.id });

    return result[0].id;
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<any> {
    const result = await db
      .select()
      .from(tradingAgents)
      .where(eq(tradingAgents.id, agentId))
      .limit(1);

    return result[0];
  }

  /**
   * Get all agents for a user
   */
  async getUserAgents(userId: string): Promise<any[]> {
    return db
      .select()
      .from(tradingAgents)
      .where(eq(tradingAgents.userId, userId));
  }

  /**
   * Toggle agent enabled state
   */
  async toggleAgent(agentId: string, enabled: boolean): Promise<void> {
    await db
      .update(tradingAgents)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(tradingAgents.id, agentId));
  }

  /**
   * Get trade logs for an agent
   */
  async getAgentLogs(agentId: string, limit: number = 50): Promise<any[]> {
    return db
      .select()
      .from(tradingLogs)
      .where(eq(tradingLogs.agentId, agentId))
      .orderBy(sql`${tradingLogs.createdAt} DESC`)
      .limit(limit);
  }

  /**
   * Get all trading history for a user (across all agents)
   */
  async getAllTradingHistory(
    userId: string,
    filters: {
      limit: number;
      offset: number;
      status?: string;
      asset?: string;
      action?: string;
    }
  ): Promise<{
    logs: any[];
    total: number;
    stats: {
      totalTrades: number;
      executedTrades: number;
      failedTrades: number;
      totalVolumeEur: number;
      profitLossEur: number;
    };
  }> {
    // Get user's agents
    const userAgents = await db
      .select()
      .from(tradingAgents)
      .where(eq(tradingAgents.userId, userId));

    const agentIds = userAgents.map(a => a.id);

    if (agentIds.length === 0) {
      return {
        logs: [],
        total: 0,
        stats: {
          totalTrades: 0,
          executedTrades: 0,
          failedTrades: 0,
          totalVolumeEur: 0,
          profitLossEur: 0,
        },
      };
    }

    // Build filters
    const conditions: any[] = [
      or(...agentIds.map(id => eq(tradingLogs.agentId, id)))
    ];

    if (filters.status) {
      conditions.push(eq(tradingLogs.status, filters.status));
    }
    if (filters.asset) {
      conditions.push(eq(tradingLogs.asset, filters.asset));
    }
    if (filters.action) {
      conditions.push(eq(tradingLogs.action, filters.action));
    }

    // Get logs with pagination
    const logs = await db
      .select({
        id: tradingLogs.id,
        agentId: tradingLogs.agentId,
        agentName: tradingAgents.name,
        action: tradingLogs.action,
        asset: tradingLogs.asset,
        quantity: tradingLogs.quantity,
        priceAtAction: tradingLogs.priceAtAction,
        totalValueCents: tradingLogs.totalValueCents,
        reason: tradingLogs.reason,
        orderId: tradingLogs.orderId,
        status: tradingLogs.status,
        errorMessage: tradingLogs.errorMessage,
        createdAt: tradingLogs.createdAt,
      })
      .from(tradingLogs)
      .leftJoin(tradingAgents, eq(tradingLogs.agentId, tradingAgents.id))
      .where(and(...conditions))
      .orderBy(desc(tradingLogs.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tradingLogs)
      .where(and(...conditions));

    const total = Number(totalResult[0]?.count || 0);

    // Calculate stats
    const allLogs = await db
      .select()
      .from(tradingLogs)
      .where(or(...agentIds.map(id => eq(tradingLogs.agentId, id))));

    const stats = {
      totalTrades: allLogs.length,
      executedTrades: allLogs.filter(l => l.status === 'executed').length,
      failedTrades: allLogs.filter(l => l.status === 'failed').length,
      totalVolumeEur: allLogs
        .filter(l => l.status === 'executed' && l.totalValueCents)
        .reduce((sum, l) => sum + (Number(l.totalValueCents) / 100), 0),
      profitLossEur: this.calculateProfitLoss(allLogs),
    };

    return { logs, total, stats };
  }

  /**
   * Calculate profit/loss from trade logs
   */
  private calculateProfitLoss(logs: any[]): number {
    const executed = logs.filter(l => l.status === 'executed');
    let profitLoss = 0;

    // Group by asset
    const assetTrades = new Map<string, any[]>();
    executed.forEach(log => {
      if (!assetTrades.has(log.asset)) {
        assetTrades.set(log.asset, []);
      }
      assetTrades.get(log.asset)!.push(log);
    });

    // Calculate P/L for each asset
    assetTrades.forEach((trades, asset) => {
      const buys = trades.filter(t => t.action === 'buy');
      const sells = trades.filter(t => t.action === 'sell' || t.action === 'stop_loss' || t.action === 'take_profit');

      const totalBuyValue = buys.reduce((sum, t) => sum + (Number(t.totalValueCents) || 0), 0);
      const totalSellValue = sells.reduce((sum, t) => sum + (Number(t.totalValueCents) || 0), 0);

      profitLoss += (totalSellValue - totalBuyValue) / 100;
    });

    return profitLoss;
  }

  /**
   * Update agent configuration
   */
  async updateAgent(
    agentId: string,
    updates: Partial<{
      name: string;
      assets: string[];
      strategy: string;
      stopLossPercent: number;
      takeProfitPercent: number;
      trailingStopPercent: number;
      maxDailyTradesCents: number;
      maxSingleTradeCents: number;
      entryPrices: Record<string, number>;
      enabled: boolean;
    }>
  ): Promise<void> {
    const updateData: any = { updatedAt: new Date() };

    if (updates.name) updateData.name = updates.name;
    if (updates.assets) updateData.assets = updates.assets;
    if (updates.strategy) updateData.strategy = updates.strategy;
    if (updates.stopLossPercent) updateData.stopLossPercent = updates.stopLossPercent.toString();
    if (updates.takeProfitPercent) updateData.takeProfitPercent = updates.takeProfitPercent.toString();
    if (updates.trailingStopPercent) updateData.trailingStopPercent = updates.trailingStopPercent.toString();
    if (updates.maxDailyTradesCents) updateData.maxDailyTradesCents = updates.maxDailyTradesCents;
    if (updates.maxSingleTradeCents) updateData.maxSingleTradeCents = updates.maxSingleTradeCents;
    if (updates.entryPrices) updateData.entryPrices = updates.entryPrices;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;

    await db
      .update(tradingAgents)
      .set(updateData)
      .where(eq(tradingAgents.id, agentId));
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    await db.delete(tradingAgents).where(eq(tradingAgents.id, agentId));
  }
}

export const tradingAgentService = new TradingAgentService();
