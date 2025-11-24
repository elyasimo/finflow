import { Request, Response } from 'express';
import { backtestingService, BacktestConfig } from '../services/backtesting.service';

/**
 * Backtesting Controller - Run strategy backtests
 */
export class BacktestingController {
  /**
   * Run a single backtest
   * POST /backtesting/run
   */
  async runBacktest(req: Request, res: Response): Promise<void> {
    try {
      const {
        symbol,
        quoteCurrency = 'EUR',
        startDate,
        endDate,
        initialCapital,
        strategy = 'moderate',
        stopLossPercent = 8,
        takeProfitPercent = 15,
        positionSize = 0.25,
      } = req.body;

      // Validate input
      if (!symbol || !startDate || !endDate || !initialCapital) {
        res.status(400).json({
          error: 'Missing required fields: symbol, startDate, endDate, initialCapital',
        });
        return;
      }

      if (initialCapital <= 0) {
        res.status(400).json({
          error: 'Initial capital must be greater than 0',
        });
        return;
      }

      if (new Date(startDate) >= new Date(endDate)) {
        res.status(400).json({
          error: 'Start date must be before end date',
        });
        return;
      }

      // Run backtest
      const config: BacktestConfig = {
        symbol,
        quoteCurrency,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initialCapital,
        strategy,
        stopLossPercent,
        takeProfitPercent,
        positionSize,
      };

      const result = await backtestingService.runBacktest(config);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Backtest error:', error);
      res.status(500).json({
        error: error.message || 'Failed to run backtest',
      });
    }
  }

  /**
   * Compare multiple strategies
   * POST /backtesting/compare
   */
  async compareStrategies(req: Request, res: Response): Promise<void> {
    try {
      const {
        symbol,
        quoteCurrency = 'EUR',
        startDate,
        endDate,
        initialCapital,
      } = req.body;

      // Validate input
      if (!symbol || !startDate || !endDate || !initialCapital) {
        res.status(400).json({
          error: 'Missing required fields: symbol, startDate, endDate, initialCapital',
        });
        return;
      }

      if (initialCapital <= 0) {
        res.status(400).json({
          error: 'Initial capital must be greater than 0',
        });
        return;
      }

      if (new Date(startDate) >= new Date(endDate)) {
        res.status(400).json({
          error: 'Start date must be before end date',
        });
        return;
      }

      // Compare strategies
      const results = await backtestingService.compareStrategies(
        symbol,
        quoteCurrency,
        new Date(startDate),
        new Date(endDate),
        initialCapital
      );

      res.status(200).json(results);
    } catch (error: any) {
      console.error('Strategy comparison error:', error);
      res.status(500).json({
        error: error.message || 'Failed to compare strategies',
      });
    }
  }

  /**
   * Get quick backtest with default settings
   * GET /backtesting/quick/:symbol
   */
  async quickBacktest(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const { days = 30, initialCapital = 1000 } = req.query;

      if (!symbol) {
        res.status(400).json({
          error: 'Symbol is required',
        });
        return;
      }

      // Default: last 30 days, €1000 capital, moderate strategy
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const config: BacktestConfig = {
        symbol,
        quoteCurrency: 'EUR',
        startDate,
        endDate,
        initialCapital: Number(initialCapital),
        strategy: 'moderate',
        stopLossPercent: 8,
        takeProfitPercent: 15,
        positionSize: 0.25,
      };

      const result = await backtestingService.runBacktest(config);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Quick backtest error:', error);
      res.status(500).json({
        error: error.message || 'Failed to run quick backtest',
      });
    }
  }
}

export const backtestingController = new BacktestingController();
