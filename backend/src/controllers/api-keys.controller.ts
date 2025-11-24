import { Request, Response } from 'express';
import { apiKeysService } from '../services/api-keys.service';

/**
 * API Keys Controller - Manages encrypted API keys for external services
 */
export class ApiKeysController {
  /**
   * Store API keys for a provider
   * POST /api-keys/:provider
   */
  async storeKeys(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { provider } = req.params;
      const { apiKey, apiSecret, permissions } = req.body;

      // Validate provider
      if (provider !== 'binance' && provider !== 'alpaca') {
        res.status(400).json({
          error: 'Invalid provider. Must be "binance" or "alpaca"'
        });
        return;
      }

      // Validate input
      if (!apiKey || !apiSecret) {
        res.status(400).json({
          error: 'API key and secret are required'
        });
        return;
      }

      // Store encrypted keys
      await apiKeysService.storeApiKeys(
        userId,
        provider,
        apiKey,
        apiSecret,
        permissions
      );

      res.status(200).json({
        success: true,
        message: `${provider} API keys stored successfully`
      });
    } catch (error) {
      console.error('Store API keys error:', error);
      res.status(500).json({
        error: 'Failed to store API keys'
      });
    }
  }

  /**
   * Check if user has API keys configured
   * GET /api-keys/:provider/status
   */
  async checkStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { provider } = req.params;

      // Validate provider
      if (provider !== 'binance' && provider !== 'alpaca') {
        res.status(400).json({
          error: 'Invalid provider. Must be "binance" or "alpaca"'
        });
        return;
      }

      const hasKeys = await apiKeysService.hasApiKeys(userId, provider);

      res.status(200).json({
        provider,
        configured: hasKeys
      });
    } catch (error) {
      console.error('Check API keys status error:', error);
      res.status(500).json({
        error: 'Failed to check API keys status'
      });
    }
  }

  /**
   * Delete API keys for a provider
   * DELETE /api-keys/:provider
   */
  async deleteKeys(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { provider } = req.params;

      // Validate provider
      if (provider !== 'binance' && provider !== 'alpaca') {
        res.status(400).json({
          error: 'Invalid provider. Must be "binance" or "alpaca"'
        });
        return;
      }

      await apiKeysService.deleteApiKeys(userId, provider);

      res.status(200).json({
        success: true,
        message: `${provider} API keys deleted successfully`
      });
    } catch (error) {
      console.error('Delete API keys error:', error);
      res.status(500).json({
        error: 'Failed to delete API keys'
      });
    }
  }

  /**
   * List all configured providers
   * GET /api-keys/providers
   */
  async listProviders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      const providers = await apiKeysService.listProviders(userId);

      res.status(200).json({
        providers
      });
    } catch (error) {
      console.error('List providers error:', error);
      res.status(500).json({
        error: 'Failed to list providers'
      });
    }
  }
}

export const apiKeysController = new ApiKeysController();
