import axios from 'axios';
import { db } from '../db';
import { tradingLogs } from '../../drizzle/schema';
import { apiKeysService } from './api-keys.service';

/**
 * Advanced Order Types Service
 * Supports: Market, Limit, Stop-Loss, Take-Profit, Trailing Stop, OCO
 */

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT' | 'TRAILING_STOP';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';

export interface OrderParams {
  userId: string;
  agentId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity?: number;
  quoteOrderQty?: number; // Order by EUR/USD amount instead of quantity
  price?: number; // For LIMIT orders
  stopPrice?: number; // For STOP_LOSS/TAKE_PROFIT orders
  trailingDelta?: number; // For TRAILING_STOP (in basis points, e.g., 100 = 1%)
  timeInForce?: 'GTC' | 'IOC' | 'FOK'; // Good Till Cancel, Immediate Or Cancel, Fill Or Kill
}

export interface OCOOrderParams {
  userId: string;
  agentId?: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number; // Limit price
  stopPrice: number; // Stop price
  stopLimitPrice?: number; // Stop limit price (optional)
}

export interface OrderResult {
  orderId: string;
  clientOrderId: string;
  status: OrderStatus;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price?: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  transactTime: number;
}

export class AdvancedOrdersService {
  private binanceApiUrl = 'https://api.binance.com';

  /**
   * Create HMAC SHA256 signature for Binance API
   */
  private createSignature(queryString: string, apiSecret: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Place a market order (instant execution at current price)
   */
  async placeMarketOrder(params: OrderParams): Promise<OrderResult> {
    const { userId, agentId, symbol, side, quantity, quoteOrderQty } = params;

    // Get API keys
    const keys = await apiKeysService.getApiKeys(userId, 'binance');
    if (!keys) {
      throw new Error('Binance API keys not configured');
    }

    try {
      const timestamp = Date.now();
      const orderParams: any = {
        symbol: `${symbol}USDT`,
        side,
        type: 'MARKET',
        timestamp,
      };

      if (quantity) {
        orderParams.quantity = quantity;
      } else if (quoteOrderQty) {
        orderParams.quoteOrderQty = quoteOrderQty;
      } else {
        throw new Error('Either quantity or quoteOrderQty must be provided');
      }

      const queryString = Object.keys(orderParams)
        .map(key => `${key}=${orderParams[key]}`)
        .join('&');

      const signature = this.createSignature(queryString, keys.apiSecret);

      const response = await axios.post(
        `${this.binanceApiUrl}/api/v3/order`,
        null,
        {
          params: { ...orderParams, signature },
          headers: {
            'X-MBX-APIKEY': keys.apiKey,
          },
        }
      );

      // Log the order
      if (agentId) {
        await db.insert(tradingLogs).values({
          agentId,
          action: side.toLowerCase() as 'buy' | 'sell',
          asset: symbol,
          quantity: response.data.executedQty,
          priceAtAction: response.data.fills?.[0]?.price || '0',
          totalValueCents: Math.round(parseFloat(response.data.cummulativeQuoteQty) * 100),
          reason: 'Market order executed',
          orderId: response.data.orderId.toString(),
          status: 'executed',
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('Market order error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to place market order');
    }
  }

  /**
   * Place a limit order (executes only at specified price or better)
   */
  async placeLimitOrder(params: OrderParams): Promise<OrderResult> {
    const { userId, agentId, symbol, side, quantity, price, timeInForce = 'GTC' } = params;

    if (!price || !quantity) {
      throw new Error('Price and quantity are required for limit orders');
    }

    const keys = await apiKeysService.getApiKeys(userId, 'binance');
    if (!keys) {
      throw new Error('Binance API keys not configured');
    }

    try {
      const timestamp = Date.now();
      const orderParams = {
        symbol: `${symbol}USDT`,
        side,
        type: 'LIMIT',
        timeInForce,
        quantity,
        price,
        timestamp,
      };

      const queryString = Object.keys(orderParams)
        .map(key => `${key}=${(orderParams as any)[key]}`)
        .join('&');

      const signature = this.createSignature(queryString, keys.apiSecret);

      const response = await axios.post(
        `${this.binanceApiUrl}/api/v3/order`,
        null,
        {
          params: { ...orderParams, signature },
          headers: {
            'X-MBX-APIKEY': keys.apiKey,
          },
        }
      );

      // Log the order
      if (agentId) {
        await db.insert(tradingLogs).values({
          agentId,
          action: side.toLowerCase() as 'buy' | 'sell',
          asset: symbol,
          quantity: quantity.toString(),
          priceAtAction: price.toString(),
          totalValueCents: Math.round(quantity * price * 100),
          reason: `Limit order placed at ${price}`,
          orderId: response.data.orderId.toString(),
          status: 'pending',
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('Limit order error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to place limit order');
    }
  }

  /**
   * Place a stop-loss order (sells when price drops to stop price)
   */
  async placeStopLossOrder(params: OrderParams): Promise<OrderResult> {
    const { userId, agentId, symbol, side, quantity, stopPrice } = params;

    if (!stopPrice || !quantity) {
      throw new Error('Stop price and quantity are required for stop-loss orders');
    }

    const keys = await apiKeysService.getApiKeys(userId, 'binance');
    if (!keys) {
      throw new Error('Binance API keys not configured');
    }

    try {
      const timestamp = Date.now();
      const orderParams = {
        symbol: `${symbol}USDT`,
        side,
        type: 'STOP_LOSS_LIMIT',
        timeInForce: 'GTC',
        quantity,
        price: stopPrice, // Execute as limit order at stop price
        stopPrice,
        timestamp,
      };

      const queryString = Object.keys(orderParams)
        .map(key => `${key}=${(orderParams as any)[key]}`)
        .join('&');

      const signature = this.createSignature(queryString, keys.apiSecret);

      const response = await axios.post(
        `${this.binanceApiUrl}/api/v3/order`,
        null,
        {
          params: { ...orderParams, signature },
          headers: {
            'X-MBX-APIKEY': keys.apiKey,
          },
        }
      );

      // Log the order
      if (agentId) {
        await db.insert(tradingLogs).values({
          agentId,
          action: side.toLowerCase() as 'buy' | 'sell',
          asset: symbol,
          quantity: quantity.toString(),
          priceAtAction: stopPrice.toString(),
          totalValueCents: Math.round(quantity * stopPrice * 100),
          reason: `Stop-loss order at ${stopPrice}`,
          orderId: response.data.orderId.toString(),
          status: 'pending',
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('Stop-loss order error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to place stop-loss order');
    }
  }

  /**
   * Place a take-profit order (sells when price rises to target)
   */
  async placeTakeProfitOrder(params: OrderParams): Promise<OrderResult> {
    const { userId, agentId, symbol, side, quantity, stopPrice } = params;

    if (!stopPrice || !quantity) {
      throw new Error('Target price and quantity are required for take-profit orders');
    }

    const keys = await apiKeysService.getApiKeys(userId, 'binance');
    if (!keys) {
      throw new Error('Binance API keys not configured');
    }

    try {
      const timestamp = Date.now();
      const orderParams = {
        symbol: `${symbol}USDT`,
        side,
        type: 'TAKE_PROFIT_LIMIT',
        timeInForce: 'GTC',
        quantity,
        price: stopPrice, // Execute as limit order at take-profit price
        stopPrice,
        timestamp,
      };

      const queryString = Object.keys(orderParams)
        .map(key => `${key}=${(orderParams as any)[key]}`)
        .join('&');

      const signature = this.createSignature(queryString, keys.apiSecret);

      const response = await axios.post(
        `${this.binanceApiUrl}/api/v3/order`,
        null,
        {
          params: { ...orderParams, signature },
          headers: {
            'X-MBX-APIKEY': keys.apiKey,
          },
        }
      );

      // Log the order
      if (agentId) {
        await db.insert(tradingLogs).values({
          agentId,
          action: side.toLowerCase() as 'buy' | 'sell',
          asset: symbol,
          quantity: quantity.toString(),
          priceAtAction: stopPrice.toString(),
          totalValueCents: Math.round(quantity * stopPrice * 100),
          reason: `Take-profit order at ${stopPrice}`,
          orderId: response.data.orderId.toString(),
          status: 'pending',
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('Take-profit order error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to place take-profit order');
    }
  }

  /**
   * Place an OCO (One-Cancels-Other) order
   * Combines limit order and stop-loss order - when one executes, the other is cancelled
   */
  async placeOCOOrder(params: OCOOrderParams): Promise<any> {
    const { userId, agentId, symbol, side, quantity, price, stopPrice, stopLimitPrice } = params;

    const keys = await apiKeysService.getApiKeys(userId, 'binance');
    if (!keys) {
      throw new Error('Binance API keys not configured');
    }

    try {
      const timestamp = Date.now();
      const orderParams = {
        symbol: `${symbol}USDT`,
        side,
        quantity,
        price, // Limit order price (take profit)
        stopPrice, // Stop price (stop loss trigger)
        stopLimitPrice: stopLimitPrice || stopPrice, // Stop limit price
        stopLimitTimeInForce: 'GTC',
        timestamp,
      };

      const queryString = Object.keys(orderParams)
        .map(key => `${key}=${(orderParams as any)[key]}`)
        .join('&');

      const signature = this.createSignature(queryString, keys.apiSecret);

      const response = await axios.post(
        `${this.binanceApiUrl}/api/v3/order/oco`,
        null,
        {
          params: { ...orderParams, signature },
          headers: {
            'X-MBX-APIKEY': keys.apiKey,
          },
        }
      );

      // Log the OCO order
      if (agentId) {
        await db.insert(tradingLogs).values({
          agentId,
          action: side.toLowerCase() as 'buy' | 'sell',
          asset: symbol,
          quantity: quantity.toString(),
          priceAtAction: price.toString(),
          totalValueCents: Math.round(quantity * price * 100),
          reason: `OCO order: TP ${price}, SL ${stopPrice}`,
          orderId: response.data.orderListId.toString(),
          status: 'pending',
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('OCO order error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to place OCO order');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(userId: string, symbol: string, orderId: string): Promise<any> {
    const keys = await apiKeysService.getApiKeys(userId, 'binance');
    if (!keys) {
      throw new Error('Binance API keys not configured');
    }

    try {
      const timestamp = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        orderId,
        timestamp,
      };

      const queryString = Object.keys(params)
        .map(key => `${key}=${(params as any)[key]}`)
        .join('&');

      const signature = this.createSignature(queryString, keys.apiSecret);

      const response = await axios.delete(
        `${this.binanceApiUrl}/api/v3/order`,
        {
          params: { ...params, signature },
          headers: {
            'X-MBX-APIKEY': keys.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Cancel order error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to cancel order');
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(userId: string, symbol: string, orderId: string): Promise<any> {
    const keys = await apiKeysService.getApiKeys(userId, 'binance');
    if (!keys) {
      throw new Error('Binance API keys not configured');
    }

    try {
      const timestamp = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        orderId,
        timestamp,
      };

      const queryString = Object.keys(params)
        .map(key => `${key}=${(params as any)[key]}`)
        .join('&');

      const signature = this.createSignature(queryString, keys.apiSecret);

      const response = await axios.get(
        `${this.binanceApiUrl}/api/v3/order`,
        {
          params: { ...params, signature },
          headers: {
            'X-MBX-APIKEY': keys.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Get order status error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to get order status');
    }
  }

  /**
   * Get all open orders for a symbol
   */
  async getOpenOrders(userId: string, symbol?: string): Promise<any[]> {
    const keys = await apiKeysService.getApiKeys(userId, 'binance');
    if (!keys) {
      throw new Error('Binance API keys not configured');
    }

    try {
      const timestamp = Date.now();
      const params: any = {
        timestamp,
      };

      if (symbol) {
        params.symbol = `${symbol}USDT`;
      }

      const queryString = Object.keys(params)
        .map(key => `${key}=${params[key]}`)
        .join('&');

      const signature = this.createSignature(queryString, keys.apiSecret);

      const response = await axios.get(
        `${this.binanceApiUrl}/api/v3/openOrders`,
        {
          params: { ...params, signature },
          headers: {
            'X-MBX-APIKEY': keys.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Get open orders error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to get open orders');
    }
  }
}

export const advancedOrdersService = new AdvancedOrdersService();
