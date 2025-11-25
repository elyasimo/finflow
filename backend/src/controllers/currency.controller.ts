// @ts-nocheck
import { Request, Response } from 'express';
import { CurrencyExchangeService } from '../services/currency-exchange.service';

export class CurrencyController {
  /**
   * GET /api/currency/rates
   * Get current exchange rates
   */
  async getExchangeRates(req: Request, res: Response): Promise<void> {
    try {
      const baseCurrency = (req.query.base as string) || 'EUR';
      
      const rates = await CurrencyExchangeService.getExchangeRates(baseCurrency);
      
      res.json({
        success: true,
        base: baseCurrency,
        rates,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get exchange rates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exchange rates',
      });
    }
  }

  /**
   * POST /api/currency/convert
   * Convert amount between currencies
   */
  async convertCurrency(req: Request, res: Response): Promise<void> {
    try {
      const { amount, from, to } = req.body;

      if (!amount || !from || !to) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: amount, from, to',
        });
        return;
      }

      const convertedAmount = await CurrencyExchangeService.convertCurrency(
        parseFloat(amount),
        from.toUpperCase(),
        to.toUpperCase()
      );

      res.json({
        success: true,
        original: {
          amount: parseFloat(amount),
          currency: from.toUpperCase(),
        },
        converted: {
          amount: convertedAmount,
          currency: to.toUpperCase(),
        },
      });
    } catch (error) {
      console.error('Convert currency error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert currency',
      });
    }
  }

  /**
   * GET /api/currency/supported
   * Get list of supported currencies
   */
  async getSupportedCurrencies(_req: Request, res: Response): Promise<void> {
    try {
      const currencies = await CurrencyExchangeService.getSupportedCurrencies();
      
      res.json({
        success: true,
        currencies,
      });
    } catch (error) {
      console.error('Get supported currencies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supported currencies',
      });
    }
  }
}

export const currencyController = new CurrencyController();
