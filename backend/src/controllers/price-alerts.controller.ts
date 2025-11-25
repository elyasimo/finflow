// @ts-nocheck
import { Request, Response } from 'express';
import { PriceAlertsService } from '../services/price-alerts.service.js';

export class PriceAlertsController {
  private alertsService: PriceAlertsService;

  constructor() {
    this.alertsService = new PriceAlertsService();
  }

  /**
   * GET /price-alerts
   * Get all price alerts for the authenticated user
   */
  getUserAlerts = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const alerts = await this.alertsService.getUserAlerts(userId);
      res.json(alerts);
    } catch (error: any) {
      console.error('Error getting price alerts:', error);
      res.status(500).json({ 
        error: 'Failed to get price alerts',
        message: error.message 
      });
    }
  };

  /**
   * POST /price-alerts
   * Create a new price alert
   */
  createAlert = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { asset, alertType, targetPrice } = req.body;

      if (!asset || !alertType || !targetPrice) {
        res.status(400).json({ error: 'Missing required fields: asset, alertType, targetPrice' });
        return;
      }

      if (!['above', 'below'].includes(alertType)) {
        res.status(400).json({ error: 'alertType must be "above" or "below"' });
        return;
      }

      const alert = await this.alertsService.createAlert(userId, {
        asset,
        alertType,
        targetPrice: parseFloat(targetPrice),
      });

      res.status(201).json(alert);
    } catch (error: any) {
      console.error('Error creating price alert:', error);
      res.status(500).json({ 
        error: 'Failed to create price alert',
        message: error.message 
      });
    }
  };

  /**
   * DELETE /price-alerts/:id
   * Delete a price alert
   */
  deleteAlert = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      await this.alertsService.deleteAlert(userId, id);
      res.json({ message: 'Alert deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting price alert:', error);
      res.status(500).json({ 
        error: 'Failed to delete price alert',
        message: error.message 
      });
    }
  };

  /**
   * PUT /price-alerts/:id/toggle
   * Toggle alert active status
   */
  toggleAlert = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const alert = await this.alertsService.toggleAlert(userId, id);
      res.json(alert);
    } catch (error: any) {
      console.error('Error toggling price alert:', error);
      res.status(500).json({ 
        error: 'Failed to toggle price alert',
        message: error.message 
      });
    }
  };

  /**
   * POST /price-alerts/check
   * Check all active alerts and trigger if conditions met (called by background job)
   */
  checkAlerts = async (req: Request, res: Response) => {
    try {
      const triggeredAlerts = await this.alertsService.checkAndTriggerAlerts();
      res.json({ 
        message: 'Alerts checked',
        triggeredCount: triggeredAlerts.length,
        alerts: triggeredAlerts
      });
    } catch (error: any) {
      console.error('Error checking price alerts:', error);
      res.status(500).json({ 
        error: 'Failed to check price alerts',
        message: error.message 
      });
    }
  };
}

export const priceAlertsController = new PriceAlertsController();
