import { db } from '../db';
import { priceAlerts } from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { BinanceTradingService } from './binance-trading.service.js';
import { AlpacaService } from './alpaca.service.js';

interface CreateAlertInput {
  asset: string;
  alertType: 'above' | 'below';
  targetPrice: number;
}

interface PriceAlert {
  id: string;
  userId: string;
  asset: string;
  alertType: string;
  targetPrice: string;
  currentPrice: string | null;
  isActive: boolean;
  triggeredAt: Date | null;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PriceAlertsService {
  private binanceService: BinanceTradingService;
  private alpacaService: AlpacaService;

  constructor() {
    this.binanceService = new BinanceTradingService();
    this.alpacaService = new AlpacaService();
  }

  /**
   * Get all price alerts for a user
   */
  async getUserAlerts(userId: string): Promise<PriceAlert[]> {
    const alerts = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.userId, userId))
      .orderBy(priceAlerts.createdAt);

    return alerts as PriceAlert[];
  }

  /**
   * Create a new price alert
   */
  async createAlert(userId: string, input: CreateAlertInput): Promise<PriceAlert> {
    const alertId = uuidv4();
    
    // Get current price
    let currentPrice = '0';
    try {
      if (input.asset.endsWith('USDT')) {
        // Crypto asset - get from Binance
        const price = await this.binanceService.getPrice(input.asset);
        currentPrice = price.toString();
      } else {
        // Stock asset - get from Alpaca
        const quote = await this.alpacaService.getLatestQuote(input.asset);
        currentPrice = (quote as any).latestTrade?.p || (quote as any).dailyBar?.c || '0';
      }
    } catch (error) {
      console.error('Failed to get current price:', error);
    }

    const [alert] = await db
      .insert(priceAlerts)
      .values({
        id: alertId,
        userId,
        asset: input.asset,
        alertType: input.alertType,
        targetPrice: input.targetPrice.toString(),
        currentPrice,
        isActive: true,
        notificationSent: false,
      })
      .returning();

    return alert as PriceAlert;
  }

  /**
   * Delete a price alert
   */
  async deleteAlert(userId: string, alertId: string): Promise<void> {
    await db
      .delete(priceAlerts)
      .where(and(
        eq(priceAlerts.id, alertId),
        eq(priceAlerts.userId, userId)
      ));
  }

  /**
   * Toggle alert active status
   */
  async toggleAlert(userId: string, alertId: string): Promise<PriceAlert> {
    // Get current alert
    const [currentAlert] = await db
      .select()
      .from(priceAlerts)
      .where(and(
        eq(priceAlerts.id, alertId),
        eq(priceAlerts.userId, userId)
      ))
      .limit(1);

    if (!currentAlert) {
      throw new Error('Alert not found');
    }

    // Toggle isActive
    const [updatedAlert] = await db
      .update(priceAlerts)
      .set({ 
        isActive: !currentAlert.isActive,
        updatedAt: new Date()
      })
      .where(eq(priceAlerts.id, alertId))
      .returning();

    return updatedAlert as PriceAlert;
  }

  /**
   * Check all active alerts and trigger if conditions met
   */
  async checkAndTriggerAlerts(): Promise<PriceAlert[]> {
    // Get all active alerts
    const activeAlerts = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.isActive, true));

    const triggeredAlerts: PriceAlert[] = [];

    for (const alert of activeAlerts) {
      try {
        // Get current price
        let currentPrice = 0;
        if (alert.asset.endsWith('USDT')) {
          currentPrice = await this.binanceService.getPrice(alert.asset);
        } else {
          const quote = await this.alpacaService.getLatestQuote(alert.asset);
          currentPrice = parseFloat((quote as any).latestTrade?.p || (quote as any).dailyBar?.c || '0');
        }

        const targetPrice = parseFloat(alert.targetPrice);
        let shouldTrigger = false;

        // Check alert condition
        if (alert.alertType === 'above' && currentPrice >= targetPrice) {
          shouldTrigger = true;
        } else if (alert.alertType === 'below' && currentPrice <= targetPrice) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          // Update alert as triggered
          const [triggered] = await db
            .update(priceAlerts)
            .set({
              currentPrice: currentPrice.toString(),
              triggeredAt: new Date(),
              isActive: false, // Deactivate after triggering
              updatedAt: new Date()
            })
            .where(eq(priceAlerts.id, alert.id))
            .returning();

          triggeredAlerts.push(triggered as PriceAlert);

          console.log(`🔔 Alert triggered: ${alert.asset} ${alert.alertType} ${targetPrice} (current: ${currentPrice})`);
        } else {
          // Just update current price
          await db
            .update(priceAlerts)
            .set({
              currentPrice: currentPrice.toString(),
              updatedAt: new Date()
            })
            .where(eq(priceAlerts.id, alert.id));
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Get triggered alerts for a user (for notifications)
   */
  async getTriggeredAlerts(userId: string): Promise<PriceAlert[]> {
    const alerts = await db
      .select()
      .from(priceAlerts)
      .where(and(
        eq(priceAlerts.userId, userId),
        eq(priceAlerts.notificationSent, false)
      ));

    return alerts.filter(a => a.triggeredAt !== null) as PriceAlert[];
  }

  /**
   * Mark alerts as notification sent
   */
  async markNotificationSent(alertIds: string[]): Promise<void> {
    for (const id of alertIds) {
      await db
        .update(priceAlerts)
        .set({ notificationSent: true })
        .where(eq(priceAlerts.id, id));
    }
  }
}
