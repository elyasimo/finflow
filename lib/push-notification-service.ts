// @ts-nocheck
// Push notification service for Capacitor mobile apps
// This file uses dynamic imports to prevent build errors when Capacitor is not available

let Capacitor: any = null;
let PushNotifications: any = null;
let LocalNotifications: any = null;

// Dynamic import to prevent build errors when Capacitor is not available
const loadCapacitor = async (): Promise<boolean> => {
  try {
    const core = await import('@capacitor/core');
    Capacitor = core.Capacitor;
    
    const push = await import('@capacitor/push-notifications');
    PushNotifications = push.PushNotifications;
    
    try {
      const local = await import('@capacitor/local-notifications');
      LocalNotifications = local.LocalNotifications;
    } catch {
      console.log('Local notifications not available');
    }
    
    return true;
  } catch {
    console.log('Capacitor not available - push notifications disabled');
    return false;
  }
};

class PushNotificationService {
  private static instance: PushNotificationService;
  private initialized = false;
  private token: string | null = null;
  private capacitorLoaded = false;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Try to load Capacitor
    this.capacitorLoaded = await loadCapacitor();
    
    if (!this.capacitorLoaded || !Capacitor?.isNativePlatform?.()) {
      console.log('Not a native platform - push notifications disabled');
      return;
    }

    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Setup listeners
      this.setupListeners();
      
      this.initialized = true;
      console.log('Push notifications initialized');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private setupListeners(): void {
    if (!PushNotifications) return;
    
    // On successful registration
    PushNotifications.addListener('registration', async (token: any) => {
      console.log('Push registration success, token:', token.value);
      this.token = token.value;
      
      // Send token to backend
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
        const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : '';
        
        await fetch(`${apiUrl}/notifications/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            token: token.value,
            platform: Capacitor?.getPlatform?.() || 'unknown',
            deviceName: await this.getDeviceName(),
          }),
        });
      } catch (error) {
        console.error('Error registering push token with backend:', error);
      }
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // When a push notification is received
    PushNotifications.addListener('pushNotificationReceived', async (notification: any) => {
      console.log('Push notification received:', notification);
      
      // Show local notification if app is in foreground
      if (LocalNotifications && await this.isAppInForeground()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title: notification.title || 'FinFlow',
              body: notification.body || '',
              extra: notification.data,
            },
          ],
        });
      }
    });

    // When user taps on a push notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
      console.log('Push notification action performed:', action);
      
      const data = action.notification?.data;
      
      // Handle navigation based on notification type
      if (data?.type) {
        this.handleNotificationTap(data);
      }
    });
  }

  private async getDeviceName(): Promise<string> {
    try {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getInfo();
      return `${info.manufacturer || ''} ${info.model || 'Unknown Device'}`.trim();
    } catch {
      return 'Unknown Device';
    }
  }

  private async isAppInForeground(): Promise<boolean> {
    try {
      const { App } = await import('@capacitor/app');
      const state = await App.getState();
      return state.isActive;
    } catch {
      return false;
    }
  }

  private handleNotificationTap(data: any): void {
    // Navigate based on notification type
    const routes: Record<string, string> = {
      budget_warning: '/budgets',
      price_alert: '/price-alerts',
      recurring_reminder: '/recurring',
      weekly_report: '/reports',
      market_update: '/markets',
    };

    const route = routes[data.type];
    if (route && typeof window !== 'undefined') {
      window.location.href = route;
    }
  }

  async unregister(): Promise<void> {
    if (!this.capacitorLoaded || !Capacitor?.isNativePlatform?.() || !this.token) {
      return;
    }

    try {
      // Remove token from backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : '';
      
      await fetch(`${apiUrl}/notifications/push-token`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: this.token }),
      });

      // Unregister from push notifications
      if (PushNotifications) {
        await PushNotifications.removeAllDeliveredNotifications();
      }
      
      this.token = null;
      console.log('Push notifications unregistered');
    } catch (error) {
      console.error('Error unregistering push notifications:', error);
    }
  }

  // For web - show browser notification
  async showWebNotification(title: string, body: string, data?: any): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, { body, data });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body, data });
      }
    }
  }

  // Request web notification permission
  async requestWebPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  getToken(): string | null {
    return this.token;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
