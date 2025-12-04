import { PriceAlertsService } from './price-alerts.service.js';
import { pushNotificationService } from './push-notification.service.js';
import { db } from '../db.js';
import { pushTokens, notifications } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export class AlertsMonitorService {
  private alertsService: PriceAlertsService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.alertsService = new PriceAlertsService();
  }

  /**
   * Start the alerts monitoring service
   * @param intervalMs Check interval in milliseconds (default: 60000 = 1 minute)
   */
  start(intervalMs: number = 60000): void {
    if (this.isRunning) {
      console.log('⚠️  Alerts monitor is already running');
      return;
    }

    console.log(`🔔 Starting price alerts monitor (checking every ${intervalMs / 1000}s)`);
    this.isRunning = true;

    // Run immediately
    this.checkAlerts();

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.checkAlerts();
    }, intervalMs);
  }

  /**
   * Stop the alerts monitoring service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🔕 Price alerts monitor stopped');
    }
  }

  /**
   * Check all active alerts
   */
  private async checkAlerts(): Promise<void> {
    try {
      const triggeredAlerts = await this.alertsService.checkAndTriggerAlerts();
      
      if (triggeredAlerts.length > 0) {
        console.log(`🔔 ${triggeredAlerts.length} alert(s) triggered:`, 
          triggeredAlerts.map(a => `${a.asset} ${a.alertType} ${a.targetPrice}`).join(', ')
        );
        
        // Send push notifications for each triggered alert
        for (const alert of triggeredAlerts) {
          await this.sendPushNotificationForAlert(alert);
        }
      }
    } catch (error) {
      console.error('❌ Error checking price alerts:', error);
    }
  }

  /**
   * Send push notification for a triggered alert
   */
  private async sendPushNotificationForAlert(alert: any): Promise<void> {
    try {
      // Get user's push tokens
      const tokens = await db
        .select()
        .from(pushTokens)
        .where(and(eq(pushTokens.userId, alert.userId), eq(pushTokens.isActive, true)));

      if (tokens.length === 0) {
        console.log(`📱 No active push tokens for user ${alert.userId}`);
        return;
      }

      const targetPrice = parseFloat(alert.targetPrice);
      const currentPrice = parseFloat(alert.currentPrice || '0');
      const alertType = alert.alertType as 'above' | 'below';

      // Send to all user's devices
      for (const tokenRecord of tokens) {
        const result = await pushNotificationService.sendPriceAlert(
          tokenRecord.token,
          alert.asset,
          alertType,
          targetPrice,
          currentPrice,
          alert.asset.endsWith('USDT') ? 'USD' : 'USD'
        );

        if (!result.success) {
          console.error(`❌ Failed to send push to device: ${result.error}`);
          
          // If token is invalid, mark as inactive
          if (result.error?.includes('NotRegistered') || result.error?.includes('InvalidRegistration')) {
            await db
              .update(pushTokens)
              .set({ isActive: false, updatedAt: new Date() })
              .where(eq(pushTokens.id, tokenRecord.id));
            console.log(`📱 Deactivated invalid push token for user ${alert.userId}`);
          }
        }
      }

      // Also save as in-app notification
      await db.insert(notifications).values({
        userId: alert.userId,
        type: 'price_alert',
        title: `Preisalarm: ${alert.asset}`,
        body: `${alert.asset} hat ${targetPrice.toFixed(2)} ${alertType === 'above' ? 'überschritten' : 'unterschritten'}. Aktueller Preis: ${currentPrice.toFixed(2)}`,
        data: { alertId: alert.id, asset: alert.asset, alertType, targetPrice, currentPrice },
      });

      // Mark alert notification as sent
      await this.alertsService.markNotificationSent([alert.id]);

    } catch (error) {
      console.error(`❌ Error sending push notification for alert ${alert.id}:`, error);
    }
  }

  /**
   * Get the current status of the monitor
   */
  getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning };
  }
}

// Singleton instance
export const alertsMonitorService = new AlertsMonitorService();
