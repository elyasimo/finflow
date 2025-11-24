import { db } from '../db';
import { tradingLogs, tradingAgents } from '../../drizzle/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

interface PerformanceData {
  equityCurve: Array<{ date: string; equity: number }>;
  profitLoss: Array<{ date: string; profit: number; loss: number }>;
  winRate: Array<{ date: string; wins: number; losses: number }>;
  assetPerformance: Array<{ asset: string; profit: number; trades: number; winRate: number }>;
  monthlyReturns: Array<{ month: string; return: number }>;
  stats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalProfit: number;
    totalLoss: number;
    netProfit: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

export class TradingPerformanceService {
  // Helper to parse numeric fields from database
  private parseTradeData(trade: any) {
    return {
      ...trade,
      quantity: parseFloat(trade.quantity || '0'),
      price: parseFloat(trade.priceAtAction || '0'),
      createdAt: trade.createdAt
    };
  }

  async calculatePerformance(userId: string, days: number): Promise<PerformanceData> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get user's trading agents
    const userAgents = await db
      .select()
      .from(tradingAgents)
      .where(eq(tradingAgents.userId, userId));

    if (userAgents.length === 0) {
      return this.getEmptyPerformance();
    }

    const agentIds = userAgents.map(a => a.id);

    // Get all trades within timeframe
    const trades = await db
      .select()
      .from(tradingLogs)
      .where(
        and(
          sql`${tradingLogs.agentId} IN (${sql.join(agentIds, sql`, `)})`,
          gte(tradingLogs.createdAt, cutoffDate),
          eq(tradingLogs.status, 'executed')
        )
      )
      .orderBy(tradingLogs.createdAt);

    if (trades.length === 0) {
      return this.getEmptyPerformance();
    }

    // Parse numeric fields
    const parsedTrades = trades.map(t => this.parseTradeData(t));

    // Calculate stats
    const stats = this.calculateStats(parsedTrades);
    
    // Build equity curve
    const equityCurve = this.buildEquityCurve(parsedTrades);
    
    // Build P&L over time
    const profitLoss = this.buildProfitLossTrend(parsedTrades);
    
    // Build win rate trend
    const winRate = this.buildWinRateTrend(parsedTrades);
    
    // Calculate performance by asset
    const assetPerformance = this.calculateAssetPerformance(parsedTrades);
    
    // Calculate monthly returns
    const monthlyReturns = this.calculateMonthlyReturns(parsedTrades);

    return {
      equityCurve,
      profitLoss,
      winRate,
      assetPerformance,
      monthlyReturns,
      stats
    };
  }

  private calculateStats(trades: any[]) {
    // Pair buy/sell trades to calculate P&L
    const pnlTrades: number[] = [];
    const assetPositions: Map<string, { quantity: number; avgPrice: number }> = new Map();

    trades.forEach(trade => {
      const asset = trade.asset;
      const quantity = parseFloat(trade.quantity || '0');
      const price = parseFloat(trade.price || '0');
      const position = assetPositions.get(asset) || { quantity: 0, avgPrice: 0 };

      if (trade.action === 'buy') {
        const newQuantity = position.quantity + quantity;
        const newAvgPrice = position.quantity === 0 
          ? price 
          : ((position.avgPrice * position.quantity) + (price * quantity)) / newQuantity;
        
        assetPositions.set(asset, { quantity: newQuantity, avgPrice: newAvgPrice });
      } else if (trade.action === 'sell' && position.quantity > 0) {
        const pnl = (price - position.avgPrice) * quantity;
        pnlTrades.push(pnl);
        
        position.quantity -= quantity;
        if (position.quantity <= 0) {
          assetPositions.delete(asset);
        } else {
          assetPositions.set(asset, position);
        }
      }
    });

    const winningTrades = pnlTrades.filter(p => p > 0);
    const losingTrades = pnlTrades.filter(p => p < 0);

    const totalProfit = winningTrades.reduce((sum, p) => sum + p, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, p) => sum + p, 0));
    const netProfit = totalProfit - totalLoss;

    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    const winRate = pnlTrades.length > 0 ? (winningTrades.length / pnlTrades.length) * 100 : 0;

    // Calculate Sharpe ratio (simplified)
    const returns = pnlTrades.map((p, i) => i === 0 ? 0 : p / Math.abs(pnlTrades[i - 1] || 1) * 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length || 0;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length) || 1;
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let equity = 10000; // Starting equity assumption

    pnlTrades.forEach(pnl => {
      equity += pnl;
      if (equity > peak) peak = equity;
      const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return {
      totalTrades: pnlTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalProfit,
      totalLoss,
      netProfit,
      averageWin,
      averageLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown
    };
  }

  private buildEquityCurve(trades: any[]) {
    const curve: Array<{ date: string; equity: number }> = [];
    let equity = 10000; // Starting equity
    const assetPositions: Map<string, { quantity: number; avgPrice: number }> = new Map();

    trades.forEach(trade => {
      const asset = trade.asset;
      const position = assetPositions.get(asset) || { quantity: 0, avgPrice: 0 };

      if (trade.action === 'buy') {
        equity -= trade.price * trade.quantity;
        const newQuantity = position.quantity + trade.quantity;
        const newAvgPrice = position.quantity === 0 
          ? trade.price 
          : ((position.avgPrice * position.quantity) + (trade.price * trade.quantity)) / newQuantity;
        assetPositions.set(asset, { quantity: newQuantity, avgPrice: newAvgPrice });
      } else if (trade.action === 'sell') {
        const pnl = position.quantity > 0 ? (trade.price - position.avgPrice) * trade.quantity : 0;
        equity += trade.price * trade.quantity;
        position.quantity -= trade.quantity;
        if (position.quantity <= 0) {
          assetPositions.delete(asset);
        } else {
          assetPositions.set(asset, position);
        }
      }

      curve.push({
        date: trade.createdAt.toISOString().split('T')[0],
        equity: Math.round(equity * 100) / 100
      });
    });

    return curve;
  }

  private buildProfitLossTrend(trades: any[]) {
    const dailyPnL: Map<string, { profit: number; loss: number }> = new Map();
    const assetPositions: Map<string, { quantity: number; avgPrice: number }> = new Map();

    trades.forEach(trade => {
      const date = trade.createdAt.toISOString().split('T')[0];
      const asset = trade.asset;
      const position = assetPositions.get(asset) || { quantity: 0, avgPrice: 0 };

      if (trade.action === 'buy') {
        const newQuantity = position.quantity + trade.quantity;
        const newAvgPrice = position.quantity === 0 
          ? trade.price 
          : ((position.avgPrice * position.quantity) + (trade.price * trade.quantity)) / newQuantity;
        assetPositions.set(asset, { quantity: newQuantity, avgPrice: newAvgPrice });
      } else if (trade.action === 'sell' && position.quantity > 0) {
        const pnl = (trade.price - position.avgPrice) * trade.quantity;
        const dayData = dailyPnL.get(date) || { profit: 0, loss: 0 };
        
        if (pnl > 0) {
          dayData.profit += pnl;
        } else {
          dayData.loss += Math.abs(pnl);
        }
        
        dailyPnL.set(date, dayData);
        position.quantity -= trade.quantity;
        if (position.quantity <= 0) {
          assetPositions.delete(asset);
        } else {
          assetPositions.set(asset, position);
        }
      }
    });

    return Array.from(dailyPnL.entries())
      .map(([date, data]) => ({
        date,
        profit: Math.round(data.profit * 100) / 100,
        loss: Math.round(data.loss * 100) / 100
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private buildWinRateTrend(trades: any[]) {
    const dailyWins: Map<string, { wins: number; losses: number }> = new Map();
    const assetPositions: Map<string, { quantity: number; avgPrice: number }> = new Map();

    trades.forEach(trade => {
      const date = trade.createdAt.toISOString().split('T')[0];
      const asset = trade.asset;
      const position = assetPositions.get(asset) || { quantity: 0, avgPrice: 0 };

      if (trade.action === 'buy') {
        const newQuantity = position.quantity + trade.quantity;
        const newAvgPrice = position.quantity === 0 
          ? trade.price 
          : ((position.avgPrice * position.quantity) + (trade.price * trade.quantity)) / newQuantity;
        assetPositions.set(asset, { quantity: newQuantity, avgPrice: newAvgPrice });
      } else if (trade.action === 'sell' && position.quantity > 0) {
        const pnl = (trade.price - position.avgPrice) * trade.quantity;
        const dayData = dailyWins.get(date) || { wins: 0, losses: 0 };
        
        if (pnl > 0) {
          dayData.wins += 1;
        } else {
          dayData.losses += 1;
        }
        
        dailyWins.set(date, dayData);
        position.quantity -= trade.quantity;
        if (position.quantity <= 0) {
          assetPositions.delete(asset);
        } else {
          assetPositions.set(asset, position);
        }
      }
    });

    return Array.from(dailyWins.entries())
      .map(([date, data]) => ({
        date,
        wins: data.wins,
        losses: data.losses
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateAssetPerformance(trades: any[]) {
    const assetData: Map<string, { profit: number; trades: number; wins: number; total: number }> = new Map();
    const assetPositions: Map<string, { quantity: number; avgPrice: number }> = new Map();

    trades.forEach(trade => {
      const asset = trade.asset;
      const position = assetPositions.get(asset) || { quantity: 0, avgPrice: 0 };
      const data = assetData.get(asset) || { profit: 0, trades: 0, wins: 0, total: 0 };

      if (trade.action === 'buy') {
        const newQuantity = position.quantity + trade.quantity;
        const newAvgPrice = position.quantity === 0 
          ? trade.price 
          : ((position.avgPrice * position.quantity) + (trade.price * trade.quantity)) / newQuantity;
        assetPositions.set(asset, { quantity: newQuantity, avgPrice: newAvgPrice });
      } else if (trade.action === 'sell' && position.quantity > 0) {
        const pnl = (trade.price - position.avgPrice) * trade.quantity;
        data.profit += pnl;
        data.trades += 1;
        data.total += 1;
        if (pnl > 0) data.wins += 1;
        
        assetData.set(asset, data);
        position.quantity -= trade.quantity;
        if (position.quantity <= 0) {
          assetPositions.delete(asset);
        } else {
          assetPositions.set(asset, position);
        }
      }
    });

    return Array.from(assetData.entries())
      .map(([asset, data]) => ({
        asset,
        profit: Math.round(data.profit * 100) / 100,
        trades: data.trades,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit);
  }

  private calculateMonthlyReturns(trades: any[]) {
    const monthlyData: Map<string, { pnl: number; startEquity: number }> = new Map();
    let equity = 10000;
    const assetPositions: Map<string, { quantity: number; avgPrice: number }> = new Map();

    trades.forEach(trade => {
      const month = trade.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const asset = trade.asset;
      const position = assetPositions.get(asset) || { quantity: 0, avgPrice: 0 };

      if (!monthlyData.has(month)) {
        monthlyData.set(month, { pnl: 0, startEquity: equity });
      }

      if (trade.action === 'buy') {
        equity -= trade.price * trade.quantity;
        const newQuantity = position.quantity + trade.quantity;
        const newAvgPrice = position.quantity === 0 
          ? trade.price 
          : ((position.avgPrice * position.quantity) + (trade.price * trade.quantity)) / newQuantity;
        assetPositions.set(asset, { quantity: newQuantity, avgPrice: newAvgPrice });
      } else if (trade.action === 'sell' && position.quantity > 0) {
        const pnl = (trade.price - position.avgPrice) * trade.quantity;
        const data = monthlyData.get(month)!;
        data.pnl += pnl;
        equity += trade.price * trade.quantity;
        
        position.quantity -= trade.quantity;
        if (position.quantity <= 0) {
          assetPositions.delete(asset);
        } else {
          assetPositions.set(asset, position);
        }
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        return: data.startEquity > 0 ? (data.pnl / data.startEquity) * 100 : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private getEmptyPerformance(): PerformanceData {
    return {
      equityCurve: [],
      profitLoss: [],
      winRate: [],
      assetPerformance: [],
      monthlyReturns: [],
      stats: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      }
    };
  }
}
