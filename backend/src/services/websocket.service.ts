import WebSocket from 'ws';
import { Server } from 'http';
import { binanceTradingService } from './binance-trading.service';
import { SUPPORTED_CRYPTOCURRENCIES } from '../config/supported-cryptocurrencies';

export class WebSocketService {
  private wss: WebSocket.Server | null = null;
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private clients: Set<WebSocket> = new Set();

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      // Send initial price data
      this.sendPriceUpdate(ws);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Start periodic price updates
    this.startPriceUpdates();

    console.log('✅ WebSocket server initialized on /ws');
  }

  /**
   * Handle messages from clients
   */
  private handleClientMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'subscribe':
        // Client subscribes to specific assets
        (ws as any).subscribedAssets = data.assets || [];
        this.sendPriceUpdate(ws);
        break;
        
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  /**
   * Start periodic price updates
   */
  private startPriceUpdates(): void {
    // Update every 10 seconds
    this.priceUpdateInterval = setInterval(async () => {
      await this.broadcastPriceUpdates();
    }, 10000);
  }

  /**
   * Send price update to a specific client
   */
  private async sendPriceUpdate(ws: WebSocket): Promise<void> {
    try {
      const assets = (ws as any).subscribedAssets || 
        SUPPORTED_CRYPTOCURRENCIES
          .filter(c => c.category !== 'stablecoin')
          .map(c => c.symbol);

      if (assets.length === 0) return;

      const prices = await binanceTradingService.getPrices(assets, 'EUR');
      
      const pricesObject: Record<string, { price: number; priceChange24h: number }> = {};
      prices.forEach((priceData, asset) => {
        pricesObject[asset] = {
          price: priceData.price,
          priceChange24h: priceData.priceChange24h,
        };
      });

      ws.send(JSON.stringify({
        type: 'price-update',
        data: {
          prices: pricesObject,
          timestamp: new Date().toISOString(),
        },
      }));
    } catch (error) {
      console.error('Error sending price update:', error);
    }
  }

  /**
   * Broadcast price updates to all connected clients
   */
  private async broadcastPriceUpdates(): Promise<void> {
    if (this.clients.size === 0) return;

    try {
      const assets = SUPPORTED_CRYPTOCURRENCIES
        .filter(c => c.category !== 'stablecoin')
        .map(c => c.symbol);

      const prices = await binanceTradingService.getPrices(assets, 'EUR');
      
      const pricesObject: Record<string, { price: number; priceChange24h: number }> = {};
      prices.forEach((priceData, asset) => {
        pricesObject[asset] = {
          price: priceData.price,
          priceChange24h: priceData.priceChange24h,
        };
      });

      const message = JSON.stringify({
        type: 'price-update',
        data: {
          prices: pricesObject,
          timestamp: new Date().toISOString(),
        },
      });

      // Broadcast to all clients
      this.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('Error broadcasting price updates:', error);
    }
  }

  /**
   * Stop the WebSocket service
   */
  stop(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }

    if (this.wss) {
      this.clients.forEach(client => client.close());
      this.wss.close();
      this.wss = null;
    }

    console.log('WebSocket service stopped');
  }
}

export const webSocketService = new WebSocketService();
