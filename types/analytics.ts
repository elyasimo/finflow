export interface TradeMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitLoss: number;
  currentBalance: number;
  maxDrawdown: number;
  openPositions: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
  averageHoldingTime: number;
  bestTradeTime: number;
  worstTradeTime: number;
  equityCurve: { time: number; equity: number }[];
  monthlyReturns: { month: string; return: number }[];
  weeklyReturns: { week: string; return: number }[];
  // Add more fields as needed
} 