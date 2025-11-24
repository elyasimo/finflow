import { Request, Response } from 'express';
import { TradingPerformanceService } from '../services/trading-performance.service.js';

export class TradingPerformanceController {
  private performanceService: TradingPerformanceService;

  constructor() {
    this.performanceService = new TradingPerformanceService();
  }

  /**
   * GET /trading-agents/performance
   * Get comprehensive trading performance data
   */
  getPerformance = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const days = parseInt(req.query.days as string) || 30;

      const performance = await this.performanceService.calculatePerformance(userId, days);

      res.json(performance);
    } catch (error: any) {
      console.error('Error getting trading performance:', error);
      res.status(500).json({ 
        error: 'Failed to get trading performance',
        message: error.message 
      });
    }
  };
}

export const tradingPerformanceController = new TradingPerformanceController();
