// @ts-nocheck
import { Request, Response } from 'express';
import { riskMetricsService, PortfolioPosition } from '../services/risk-metrics.service';

/**
 * Risk Metrics Controller
 * Provides professional risk analysis: VaR, Sharpe, Sortino, Beta, etc.
 */
export class RiskMetricsController {
  /**
   * Calculate risk metrics for a portfolio
   * POST /risk-metrics/portfolio
   */
  async calculatePortfolioRisk(req: Request, res: Response): Promise<void> {
    try {
      const { positions } = req.body;

      if (!positions || !Array.isArray(positions) || positions.length === 0) {
        res.status(400).json({
          error: 'Positions array is required and must not be empty',
        });
        return;
      }

      // Validate positions
      for (const pos of positions) {
        if (!pos.symbol || !pos.quantity || !pos.currentPrice) {
          res.status(400).json({
            error: 'Each position must have symbol, quantity, and currentPrice',
          });
          return;
        }
      }

      const metrics = await riskMetricsService.calculatePortfolioRiskMetrics(positions);

      res.status(200).json(metrics);
    } catch (error: any) {
      console.error('Calculate portfolio risk error:', error);
      res.status(500).json({
        error: error.message || 'Failed to calculate portfolio risk metrics',
      });
    }
  }

  /**
   * Calculate risk metrics for a single asset
   * GET /risk-metrics/asset/:symbol
   */
  async calculateAssetRisk(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const { quantity, currentPrice } = req.query;

      if (!symbol) {
        res.status(400).json({
          error: 'Symbol is required',
        });
        return;
      }

      if (!quantity || !currentPrice) {
        res.status(400).json({
          error: 'Quantity and currentPrice are required',
        });
        return;
      }

      const metrics = await riskMetricsService.calculateAssetRiskMetrics(
        symbol,
        parseFloat(quantity as string),
        parseFloat(currentPrice as string)
      );

      res.status(200).json(metrics);
    } catch (error: any) {
      console.error('Calculate asset risk error:', error);
      res.status(500).json({
        error: error.message || 'Failed to calculate asset risk metrics',
      });
    }
  }

  /**
   * Calculate risk metrics for user's Binance portfolio
   * GET /risk-metrics/binance-portfolio
   */
  async calculateBinancePortfolioRisk(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      // Get Binance portfolio from portfolio service
      // This would integrate with the existing Binance portfolio fetching
      // For now, return a placeholder

      res.status(200).json({
        message: 'Binance portfolio risk metrics - coming soon',
        note: 'Will integrate with existing Binance portfolio fetching',
      });
    } catch (error: any) {
      console.error('Calculate Binance portfolio risk error:', error);
      res.status(500).json({
        error: error.message || 'Failed to calculate Binance portfolio risk metrics',
      });
    }
  }
}

export const riskMetricsController = new RiskMetricsController();
