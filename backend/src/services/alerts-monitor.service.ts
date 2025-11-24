import { PriceAlertsService } from './price-alerts.service.js';

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
        
        // TODO: Send push notifications or emails here
        // For now, just log the triggered alerts
      }
    } catch (error) {
      console.error('❌ Error checking price alerts:', error);
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
