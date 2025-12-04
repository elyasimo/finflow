// @ts-nocheck
// Push notification service for Capacitor mobile apps
// This file uses dynamic imports to prevent build errors when Capacitor is not available

let Capacitor: any = null;
let PushNotifications: any = null;
let LocalNotifications: any = null;
let Device: any = null;
let App: any = null;

// Dynamic import to prevent build errors when Capacitor is not available
const loadCapacitor = async (): Promise<boolean> => {
  // Skip in SSR/Node environment
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    // Direct import for @capacitor/core - this is always available in native apps
    const core = await import('@capacitor/core');
    Capacitor = core.Capacitor;
    
    const isNative = Capacitor?.isNativePlatform?.();
    console.log('[Push] Platform check - isNativePlatform:', isNative, 'platform:', Capacitor?.getPlatform?.());
    
    // Only load push notifications if we're on a native platform
    if (!isNative) {
      return false;
    }
    
    // Direct import for push notifications
    const push = await import('@capacitor/push-notifications');
    PushNotifications = push.PushNotifications;
    
    // Try to load optional packages - don't fail if they're not available
    try {
      // Use eval to prevent webpack from analyzing these optional imports
      const importModule = (name: string) => eval(`import('${name}')`);
      
      try {
        const local = await importModule('@capacitor/local-notifications');
        LocalNotifications = local.LocalNotifications;
      } catch {
        LocalNotifications = null;
      }
      
      try {
        const device = await importModule('@capacitor/device');
        Device = device.Device;
      } catch {
        Device = null;
      }
      
      try {
        const app = await importModule('@capacitor/app');
        App = app.App;
      } catch {
        App = null;
      }
    } catch {
      // Optional packages not available
    }
    
    return true;
  } catch (error) {
    console.error('[Push] Error loading Capacitor:', error);
    // Capacitor not available - push notifications disabled
    return false;
  }
};

class PushNotificationService {
  private static instance: PushNotificationService;
  private initialized = false;
  private token: string | null = null;
  private capacitorLoaded = false;
  private tokenSentToBackend = false;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[Push] Already initialized');
      return;
    }
    
    console.log('[Push] Initializing...');
    
    // Try to load Capacitor
    this.capacitorLoaded = await loadCapacitor();
    
    if (!this.capacitorLoaded || !Capacitor?.isNativePlatform?.()) {
      console.log('[Push] Not on native platform, skipping');
      return;
    }

    try {
      // Request permission
      console.log('[Push] Requesting permissions...');
      const permStatus = await PushNotifications.requestPermissions();
      console.log('[Push] Permission status:', permStatus.receive);
      
      if (permStatus.receive !== 'granted') {
        console.log('[Push] Permission not granted');
        return;
      }

      // Setup listeners BEFORE registering (important!)
      console.log('[Push] Setting up listeners...');
      this.setupListeners();

      // Register for push notifications
      console.log('[Push] Registering for push notifications...');
      await PushNotifications.register();
      
      this.initialized = true;
      console.log('[Push] Initialization complete');
    } catch (error) {
      console.error('[Push] Error initializing:', error);
    }
  }

  private setupListeners(): void {
    if (!PushNotifications) {
      console.log('[Push] PushNotifications not available');
      return;
    }
    
    console.log('[Push] Setting up listeners...');
    
    // On successful registration
    PushNotifications.addListener('registration', async (token: any) => {
      console.log('[Push] *** REGISTRATION EVENT RECEIVED ***');
      console.log('[Push] Token value:', token?.value ? token.value.substring(0, 30) + '...' : 'NO TOKEN');
      this.token = token.value;
      
      // Try to send token to backend (may fail if not logged in yet)
      await this.sendTokenToBackend();
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[Push] *** REGISTRATION ERROR ***:', JSON.stringify(error));
    });

    // When a push notification is received
    PushNotifications.addListener('pushNotificationReceived', async (notification: any) => {
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
      const data = action.notification?.data;
      
      // Handle navigation based on notification type
      if (data?.type) {
        this.handleNotificationTap(data);
      }
    });
  }

  private async getDeviceName(): Promise<string> {
    try {
      if (Device) {
        const info = await Device.getInfo();
        return `${info.manufacturer || ''} ${info.model || 'Unknown Device'}`.trim();
      }
      return 'Unknown Device';
    } catch {
      return 'Unknown Device';
    }
  }

  // Send token to backend - can be called multiple times safely
  private async sendTokenToBackend(): Promise<boolean> {
    if (!this.token) {
      console.log('[Push] No token to send');
      return false;
    }
    
    if (this.tokenSentToBackend) {
      console.log('[Push] Token already sent to backend');
      return true;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : '';
      
      console.log('[Push] Sending token to backend...');
      console.log('[Push] API URL:', apiUrl);
      console.log('[Push] Has accessToken:', !!accessToken, 'length:', accessToken?.length);
      
      if (!accessToken) {
        console.log('[Push] No access token yet, will retry after login');
        return false;
      }
      
      const deviceName = await this.getDeviceName();
      const platform = Capacitor?.getPlatform?.() || 'unknown';
      console.log('[Push] Device:', deviceName, 'Platform:', platform);
      
      const response = await fetch(`${apiUrl}/notifications/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token: this.token,
          platform: platform,
          deviceName: deviceName,
        }),
      });
      
      console.log('[Push] Response status:', response.status);
      const result = await response.json();
      console.log('[Push] Backend response:', JSON.stringify(result));
      
      if (response.ok) {
        this.tokenSentToBackend = true;
        console.log('[Push] ✅ Token successfully registered with backend!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Push] Error registering token with backend:', error);
      return false;
    }
  }

  // Public method to retry sending token after login
  async retrySendToken(): Promise<boolean> {
    console.log('[Push] Retrying to send token after login...');
    return this.sendTokenToBackend();
  }

  private async isAppInForeground(): Promise<boolean> {
    try {
      if (App) {
        const state = await App.getState();
        return state.isActive;
      }
      return false;
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
    } catch (error) {
      // Error unregistering push notifications
    }
  }

  // For web - show browser notification
  async showWebNotification(title: string, body: string, data?: any): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
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
