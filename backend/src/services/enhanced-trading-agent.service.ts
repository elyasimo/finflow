// @ts-nocheck
/**
 * Enhanced Trading Agent Service
 * Professional trading with technical indicators, portfolio management, and advanced risk controls
 */

import { eq, and, gte, sql } from 'drizzle-orm';
import { db } from '../db';
import { tradingAgents, tradingLogs } from '../db/schema.js';
import { binanceTradingService } from './binance-trading.service';
import { technicalIndicatorsService } from './technical-indicators.service';
import { SUPPORTED_CRYPTOCURRENCIES, validateSymbols } from '../config/supported-cryptocurrencies';

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
  confidence: number; // 0-100
  technicalScore?: number;
}

interface PortfolioPosition {
  asset: string;
  holdings: number;
  valueEur: number;
  percentOfPortfolio: number;
}

export class EnhancedTradingAgentService {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly MAX_POSITION_SIZE = 0.25; // Max 25% of portfolio per asset
  private readonly MIN_POSITION_SIZE = 0.05; // Min 5% per asset

  /**
   * Start the trading agent monitoring loop
   */
  async start(intervalMs: number = 60000): Promise<void> {
    if (this.isRunning) {
      console.log('Enhanced trading agent is already running');
      return;
    }

    console.log('🚀 Starting enhanced trading agent with professional indicators...');
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
    console.log('Enhanced trading agent stopped');
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

      console.log(`\n📊 Processing ${agents.length} active trading agent(s)...`);

      for (const agent of agents) {
        await this.processAgent(agent as any);
      }
    } catch (error) {
      console.error('❌ Enhanced trading agent cycle error:', error);
    }
  }

  /**
   * Validate asset symbols before processing
   */
  private validateAssets(assets: string[]): string[] {
    const { valid, invalid } = validateSymbols(assets);

    if (invalid.length > 0) {
      console.warn(`⚠️  Invalid symbols filtered out: ${invalid.join(', ')}`);
    }

    return valid;
  }

  /**
   * Get current portfolio composition
   */
  private async getPortfolio(): Promise<PortfolioPosition[]> {
    const balances = await binanceTradingService.getBalances();
    const positions: PortfolioPosition[] = [];
    let totalValueEur = 0;

    // Get prices for all assets
    const assets = balances
      .filter(b => b.asset !== 'EUR' && parseFloat(b.free) > 0)
      .map(b => b.asset);

    if (assets.length === 0) return [];

    const prices = await binanceTradingService.getPrices(assets, 'EUR');

    // Calculate values
    for (const balance of balances) {
      if (balance.asset === 'EUR') continue;

      const holdings = parseFloat(balance.free);
      if (holdings === 0) continue;

      const priceData = prices.get(balance.asset);
      if (!priceData) continue;

      const valueEur = holdings * priceData.price;
      totalValueEur += valueEur;

      positions.push({
        asset: balance.asset,
        holdings,
        valueEur,
        percentOfPortfolio: 0, // Will calculate after
      });
    }

    // Calculate percentages
    positions.forEach(p => {
      p.percentOfPortfolio = totalValueEur > 0 ? (p.valueEur / totalValueEur) * 100 : 0;
    });

    return positions;
  }

  /**
   * Process a single agent's trading logic with advanced indicators
   */
  private async processAgent(agent: AgentConfig): Promise<void> {
    try {
      console.log(`\n🤖 Agent: ${agent.name}`);

      // Validate assets
      const validAssets = this.validateAssets(agent.assets);
      if (validAssets.length === 0) {
        console.log('  ⚠️  No valid assets to trade');
        return;
      }

      // Check daily trade limit
      const dailyTraded = await this.getDailyTradedAmount(agent.id);
      if (dailyTraded >= agent.maxDailyTradesCents) {
        console.log(`  ⏸️  Daily limit reached (${(dailyTraded / 100).toFixed(2)}€)`);
        return;
      }

      // Get portfolio composition
      const portfolio = await this.getPortfolio();
      const prices = await binanceTradingService.getPrices(validAssets, 'EUR');

      // Analyze each asset with technical indicators
      for (const asset of validAssets) {
        const priceData = prices.get(asset);
        if (!priceData) continue;

        const position = portfolio.find(p => p.asset === asset);
        const holdings = position?.holdings || 0;

        // Perform technical analysis
        const analysis = await technicalIndicatorsService.analyze(asset, 'EUR');

        console.log(`\n  📈 ${asset}:`);
        console.log(`     Price: ${priceData.price.toFixed(2)}€ (${priceData.priceChange24h > 0 ? '+' : ''}${priceData.priceChange24h.toFixed(2)}%)`);
        console.log(`     RSI: ${analysis.rsi.toFixed(1)} | Signal: ${analysis.signal} | Score: ${analysis.score}`);
        console.log(`     MACD: ${analysis.macd.macd.toFixed(2)} | BB: ${analysis.bollingerBands.middle.toFixed(2)}€`);
        console.log(`     Holdings: ${holdings.toFixed(6)} (${position?.percentOfPortfolio.toFixed(1) || '0'}% of portfolio)`);

        const decision = await this.analyzeAssetAdvanced(
          agent,
          asset,
          priceData.price,
          priceData.priceChange24h,
          holdings,
          position?.percentOfPortfolio || 0,
          analysis
        );

        if (decision.action !== 'hold') {
          console.log(`  ⚡ Decision: ${decision.action.toUpperCase()} - ${decision.reason} (Confidence: ${decision.confidence}%)`);
          await this.executeDecision(agent, decision, priceData.price);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing agent ${agent.name}:`, error);
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
   * Advanced asset analysis with technical indicators and portfolio management
   */
  private async analyzeAssetAdvanced(
    agent: AgentConfig,
    asset: string,
    currentPrice: number,
    priceChange24h: number,
    holdings: number,
    positionPercent: number,
    analysis: any
  ): Promise<TradeDecision> {
    const entryPrice = agent.entryPrices?.[asset];

    // === RISK MANAGEMENT: Stop-Loss & Take-Profit ===
    if (holdings > 0 && entryPrice) {
      const priceChangeFromEntry = ((currentPrice - entryPrice) / entryPrice) * 100;

      // STOP-LOSS
      if (priceChangeFromEntry <= -agent.stopLossPercent) {
        return {
          action: 'stop_loss',
          asset,
          reason: `Stop-loss triggered: -${Math.abs(priceChangeFromEntry).toFixed(2)}% from entry`,
          percentage: 100,
          confidence: 100,
        };
      }

      // TAKE-PROFIT
      if (priceChangeFromEntry >= agent.takeProfitPercent) {
        return {
          action: 'take_profit',
          asset,
          reason: `Take-profit triggered: +${priceChangeFromEntry.toFixed(2)}% from entry`,
          percentage: 50,
          confidence: 95,
        };
      }

      // TRAILING STOP
      if (agent.trailingStopPercent && priceChangeFromEntry > agent.trailingStopPercent) {
        const retracement = priceChangeFromEntry - agent.trailingStopPercent;
        if (retracement < 0) {
          return {
            action: 'sell',
            asset,
            reason: `Trailing stop: Retraced ${agent.trailingStopPercent}% from highs`,
            percentage: 100,
            confidence: 90,
          };
        }
      }
    }

    // === PORTFOLIO REBALANCING ===
    // Sell if position is too large
    if (positionPercent > this.MAX_POSITION_SIZE * 100) {
      const excessPercent = positionPercent - (this.MAX_POSITION_SIZE * 100);
      const sellPercent = (excessPercent / positionPercent) * 100;

      return {
        action: 'sell',
        asset,
        reason: `Portfolio rebalancing: Position too large (${positionPercent.toFixed(1)}% > ${this.MAX_POSITION_SIZE * 100}%)`,
        percentage: Math.min(sellPercent, 50),
        confidence: 80,
      };
    }

    // === SELLING DECISIONS (for existing holdings) ===
    if (holdings > 0) {
      // Technical indicators suggest sell
      if (analysis.signal === 'strong_sell' || analysis.signal === 'sell') {
        let confidence = 70;
        let reason = `Technical indicators: ${analysis.signal.toUpperCase()}`;

        if (analysis.rsi > 75) {
          confidence += 15;
          reason += ` (RSI: ${analysis.rsi.toFixed(1)} - Overbought)`;
        }

        if (analysis.macd.histogram < 0) {
          confidence += 10;
          reason += ', MACD bearish';
        }

        if (confidence >= 70) {
          return {
            action: 'sell',
            asset,
            reason,
            percentage: analysis.signal === 'strong_sell' ? 75 : 50,
            confidence,
            technicalScore: analysis.score,
          };
        }
      }
    }

    // === BUYING DECISIONS ===
    if (holdings === 0 || positionPercent < this.MIN_POSITION_SIZE * 100) {
      let buyScore = 0;
      let reasons: string[] = [];

      // Strategy-based buy logic
      if (agent.strategy === 'conservative') {
        // Conservative: Only strong signals
        if (analysis.signal === 'strong_buy' && analysis.rsi < 35) {
          buyScore = 85;
          reasons.push(`Strong buy signal (Score: ${analysis.score})`);
        }
      } else if (agent.strategy === 'moderate') {
        // Moderate: Buy on good signals
        if (analysis.signal === 'strong_buy' || analysis.signal === 'buy') {
          buyScore = 75;
          reasons.push(`Buy signal (Score: ${analysis.score})`);
        }
      } else if (agent.strategy === 'aggressive') {
        // Aggressive: Buy on any positive signal
        if (analysis.score >= 20) {
          buyScore = 65;
          reasons.push(`Positive momentum (Score: ${analysis.score})`);
        }
      }

      // Boost score with specific indicators
      if (analysis.rsi < 30) {
        buyScore += 15;
        reasons.push(`RSI oversold (${analysis.rsi.toFixed(1)})`);
      }

      if (analysis.macd.histogram > 0 && analysis.macd.macd > analysis.macd.signal) {
        buyScore += 10;
        reasons.push('MACD bullish cross');
      }

      // Price near lower Bollinger Band
      if (currentPrice < analysis.bollingerBands.lower * 1.05) {
        buyScore += 10;
        reasons.push('Near Bollinger lower band');
      }

      // Strong uptrend
      if (analysis.ema.ema12 > analysis.ema.ema26 && analysis.ema.ema50 > analysis.ema.ema200) {
        buyScore += 15;
        reasons.push('Strong uptrend (EMA alignment)');
      }

      // High volume
      if (analysis.volumeRatio > 1.5) {
        buyScore += 5;
        reasons.push(`High volume (${analysis.volumeRatio.toFixed(1)}x avg)`);
      }

      // Minimum confidence threshold
      const minConfidence = agent.strategy === 'conservative' ? 75 : agent.strategy === 'moderate' ? 60 : 50;

      if (buyScore >= minConfidence) {
        return {
          action: 'buy',
          asset,
          reason: reasons.join(', '),
          confidence: Math.min(buyScore, 100),
          technicalScore: analysis.score,
        };
      }
    }

    return {
      action: 'hold',
      asset,
      reason: 'No strong signal detected',
      confidence: 0,
      technicalScore: analysis.score,
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
    let result;
    let totalValueCents = 0;

    try {
      if (decision.action === 'buy') {
        // Calculate buy amount with daily limit check
        const remainingDaily = agent.maxDailyTradesCents - await this.getDailyTradedAmount(agent.id);
        const amountEur = Math.min(
          agent.maxSingleTradeCents / 100,
          remainingDaily / 100
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

        console.log(`  ✅ Trade executed successfully!`);
      } else {
        console.log(`  ❌ Trade failed: ${result?.error}`);
      }
    } catch (error) {
      console.error(`  ❌ Execution error:`, error);
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
}

export const enhancedTradingAgentService = new EnhancedTradingAgentService();
