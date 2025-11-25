// @ts-nocheck
import { Request, Response } from 'express';
import { advancedOrdersService, OrderParams, OCOOrderParams } from '../services/advanced-orders.service';

/**
 * Advanced Orders Controller
 * Handles professional order types: Market, Limit, Stop-Loss, Take-Profit, OCO
 */
export class AdvancedOrdersController {
  /**
   * Place a market order
   * POST /orders/market
   */
  async placeMarketOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { agentId, symbol, side, quantity, quoteOrderQty } = req.body;

      if (!symbol || !side) {
        res.status(400).json({
          error: 'Symbol and side are required',
        });
        return;
      }

      if (!quantity && !quoteOrderQty) {
        res.status(400).json({
          error: 'Either quantity or quoteOrderQty must be provided',
        });
        return;
      }

      const params: OrderParams = {
        userId,
        agentId,
        symbol,
        side,
        type: 'MARKET',
        quantity,
        quoteOrderQty,
      };

      const result = await advancedOrdersService.placeMarketOrder(params);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Place market order error:', error);
      res.status(500).json({
        error: error.message || 'Failed to place market order',
      });
    }
  }

  /**
   * Place a limit order
   * POST /orders/limit
   */
  async placeLimitOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { agentId, symbol, side, quantity, price, timeInForce } = req.body;

      if (!symbol || !side || !quantity || !price) {
        res.status(400).json({
          error: 'Symbol, side, quantity, and price are required',
        });
        return;
      }

      const params: OrderParams = {
        userId,
        agentId,
        symbol,
        side,
        type: 'LIMIT',
        quantity,
        price,
        timeInForce,
      };

      const result = await advancedOrdersService.placeLimitOrder(params);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Place limit order error:', error);
      res.status(500).json({
        error: error.message || 'Failed to place limit order',
      });
    }
  }

  /**
   * Place a stop-loss order
   * POST /orders/stop-loss
   */
  async placeStopLossOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { agentId, symbol, side, quantity, stopPrice } = req.body;

      if (!symbol || !side || !quantity || !stopPrice) {
        res.status(400).json({
          error: 'Symbol, side, quantity, and stopPrice are required',
        });
        return;
      }

      const params: OrderParams = {
        userId,
        agentId,
        symbol,
        side,
        type: 'STOP_LOSS',
        quantity,
        stopPrice,
      };

      const result = await advancedOrdersService.placeStopLossOrder(params);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Place stop-loss order error:', error);
      res.status(500).json({
        error: error.message || 'Failed to place stop-loss order',
      });
    }
  }

  /**
   * Place a take-profit order
   * POST /orders/take-profit
   */
  async placeTakeProfitOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { agentId, symbol, side, quantity, stopPrice } = req.body;

      if (!symbol || !side || !quantity || !stopPrice) {
        res.status(400).json({
          error: 'Symbol, side, quantity, and stopPrice (target price) are required',
        });
        return;
      }

      const params: OrderParams = {
        userId,
        agentId,
        symbol,
        side,
        type: 'TAKE_PROFIT',
        quantity,
        stopPrice,
      };

      const result = await advancedOrdersService.placeTakeProfitOrder(params);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Place take-profit order error:', error);
      res.status(500).json({
        error: error.message || 'Failed to place take-profit order',
      });
    }
  }

  /**
   * Place an OCO (One-Cancels-Other) order
   * POST /orders/oco
   */
  async placeOCOOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { agentId, symbol, side, quantity, price, stopPrice, stopLimitPrice } = req.body;

      if (!symbol || !side || !quantity || !price || !stopPrice) {
        res.status(400).json({
          error: 'Symbol, side, quantity, price (limit), and stopPrice are required',
        });
        return;
      }

      const params: OCOOrderParams = {
        userId,
        agentId,
        symbol,
        side,
        quantity,
        price,
        stopPrice,
        stopLimitPrice,
      };

      const result = await advancedOrdersService.placeOCOOrder(params);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Place OCO order error:', error);
      res.status(500).json({
        error: error.message || 'Failed to place OCO order',
      });
    }
  }

  /**
   * Cancel an order
   * DELETE /orders/:symbol/:orderId
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { symbol, orderId } = req.params;

      if (!symbol || !orderId) {
        res.status(400).json({
          error: 'Symbol and orderId are required',
        });
        return;
      }

      const result = await advancedOrdersService.cancelOrder(userId, symbol, orderId);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Cancel order error:', error);
      res.status(500).json({
        error: error.message || 'Failed to cancel order',
      });
    }
  }

  /**
   * Get order status
   * GET /orders/:symbol/:orderId
   */
  async getOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { symbol, orderId } = req.params;

      if (!symbol || !orderId) {
        res.status(400).json({
          error: 'Symbol and orderId are required',
        });
        return;
      }

      const result = await advancedOrdersService.getOrderStatus(userId, symbol, orderId);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Get order status error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get order status',
      });
    }
  }

  /**
   * Get all open orders
   * GET /orders/open/:symbol?
   */
  async getOpenOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { symbol } = req.params;

      const result = await advancedOrdersService.getOpenOrders(userId, symbol);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Get open orders error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get open orders',
      });
    }
  }
}

export const advancedOrdersController = new AdvancedOrdersController();
