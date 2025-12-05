import https from 'https';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

/**
 * Push Notification Service
 * 
 * Supports:
 * - Firebase Cloud Messaging (FCM) v1 API for Android/iOS
 * - Apple Push Notification Service (APNs) for iOS native
 * 
 * FCM is recommended for cross-platform as it handles both Android and iOS
 */

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  imageUrl?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class PushNotificationService {
  private fcmAccessToken: string | null = null;
  private fcmTokenExpiry: number = 0;
  private apnsJwt: string | null = null;
  private apnsJwtExpiry: number = 0;
  private initialized: boolean = false;

  // FCM Configuration
  private fcmProjectId: string = '';
  private fcmClientEmail: string = '';
  private fcmPrivateKey: string = '';

  // APNs Configuration
  private apnsKeyId: string = '';
  private apnsTeamId: string = '';
  private apnsPrivateKey: string = '';
  private apnsBundleId: string = '';
  private apnsProduction: boolean = true;

  constructor() {
    this.init();
  }

  /**
   * Parse private key handling multiple escape levels from environment variables
   * Handles: "\\n" -> "\n" -> actual newlines
   * Also handles keys without newlines after BEGIN/before END markers
   */
  private parsePrivateKey(key: string): string {
    if (!key) return '';
    
    // Trim whitespace
    let parsed = key.trim();
    
    // Debug: show raw input
    console.log(`   Raw key length: ${parsed.length}, first 100 chars: ${parsed.substring(0, 100)}`);
    
    // Replace literal backslash-n sequences with actual newlines
    // This handles both \\n (from JSON) and \n (literal in env var)
    // Use a regex that matches a backslash followed by 'n'
    parsed = parsed.split('\\n').join('\n');
    
    // Remove any carriage returns
    parsed = parsed.replace(/\r/g, '');
    
    // Fix malformed PEM: add newline after BEGIN marker if missing
    // e.g., "-----BEGIN PRIVATE KEY-----MII..." -> "-----BEGIN PRIVATE KEY-----\nMII..."
    parsed = parsed.replace(/(-----BEGIN [A-Z ]+-----)([A-Za-z0-9+/=])/g, '$1\n$2');
    
    // Fix malformed PEM: add newline before END marker if missing
    // e.g., "...abc=-----END PRIVATE KEY-----" -> "...abc=\n-----END PRIVATE KEY-----"
    parsed = parsed.replace(/([A-Za-z0-9+/=])(-----END [A-Z ]+-----)/g, '$1\n$2');
    
    // Ensure proper PEM format - trim each line
    const lines = parsed.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    parsed = lines.join('\n');
    
    // Log key format for debugging
    const hasNewlines = parsed.includes('\n');
    const startsCorrectly = parsed.startsWith('-----BEGIN');
    const endsCorrectly = parsed.endsWith('-----');
    const lineCount = lines.length;
    console.log(`   Private key parsing: hasNewlines=${hasNewlines}, startsCorrectly=${startsCorrectly}, endsCorrectly=${endsCorrectly}, lines=${lineCount}, length=${parsed.length}`);
    
    // Debug: show first and last line
    if (lines.length > 0) {
      console.log(`   First line: ${lines[0]}`);
      console.log(`   Second line: ${lines[1] ? lines[1].substring(0, 40) + '...' : 'N/A'}`);
      console.log(`   Last line: ${lines[lines.length - 1]}`);
    }
    
    return parsed;
  }

  /**
   * Initialize the push notification service
   */
  private init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // FCM Configuration (Firebase Service Account)
    this.fcmProjectId = process.env.FCM_PROJECT_ID || '';
    this.fcmClientEmail = process.env.FCM_CLIENT_EMAIL || '';
    // Handle multiple escaping levels: \\n -> \n -> actual newline
    this.fcmPrivateKey = this.parsePrivateKey(process.env.FCM_PRIVATE_KEY || '');

    // APNs Configuration
    this.apnsKeyId = process.env.APNS_KEY_ID || '';
    this.apnsTeamId = process.env.APNS_TEAM_ID || '';
    // Handle multiple escaping levels: \\n -> \n -> actual newline
    this.apnsPrivateKey = this.parsePrivateKey(process.env.APNS_PRIVATE_KEY || '');
    this.apnsBundleId = process.env.APNS_BUNDLE_ID || 'ch.finflowapp.app';
    this.apnsProduction = process.env.APNS_PRODUCTION !== 'false';

    // Log configuration status
    console.log('🔔 Push Notification Service initialized');
    console.log('   FCM Project ID:', this.fcmProjectId || '(not configured)');
    console.log('   FCM Client Email:', this.fcmClientEmail ? '✓ configured' : '(not configured)');
    console.log('   APNs Team ID:', this.apnsTeamId || '(not configured)');
    console.log('   APNs Bundle ID:', this.apnsBundleId);
  }

  /**
   * Check if FCM is configured
   */
  public isFcmConfigured(): boolean {
    return !!(this.fcmProjectId && this.fcmClientEmail && this.fcmPrivateKey);
  }

  /**
   * Check if APNs is configured
   */
  public isApnsConfigured(): boolean {
    return !!(this.apnsKeyId && this.apnsTeamId && this.apnsPrivateKey);
  }

  /**
   * Get FCM OAuth2 access token
   */
  private async getFcmAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.fcmAccessToken && Date.now() < this.fcmTokenExpiry - 300000) {
      return this.fcmAccessToken;
    }

    // Debug: Check private key format
    console.log('🔑 FCM Private Key Debug:');
    console.log('   Length:', this.fcmPrivateKey.length);
    console.log('   Starts with BEGIN:', this.fcmPrivateKey.startsWith('-----BEGIN'));
    console.log('   Contains PRIVATE KEY:', this.fcmPrivateKey.includes('PRIVATE KEY'));
    console.log('   First 50 chars:', this.fcmPrivateKey.substring(0, 50));
    console.log('   Last 50 chars:', this.fcmPrivateKey.substring(this.fcmPrivateKey.length - 50));

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.fcmClientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600, // 1 hour
    };

    const signedJwt = jwt.sign(payload, this.fcmPrivateKey, {
      algorithm: 'RS256',
    });
    console.log('✅ JWT signed successfully');
    
    // Exchange JWT for access token
    return new Promise((resolve, reject) => {
      const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`;

      const req = https.request(
        {
          hostname: 'oauth2.googleapis.com',
          path: '/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (response.access_token) {
                this.fcmAccessToken = response.access_token;
                this.fcmTokenExpiry = Date.now() + response.expires_in * 1000;
                resolve(this.fcmAccessToken!);
              } else {
                reject(new Error(response.error_description || 'Failed to get FCM access token'));
              }
            } catch (e) {
              reject(new Error('Failed to parse FCM token response'));
            }
          });
        }
      );

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Send push notification via FCM v1 API
   */
  async sendFcmNotification(deviceToken: string, payload: PushNotificationPayload): Promise<SendResult> {
    if (!this.isFcmConfigured()) {
      console.warn('⚠️ FCM not configured - skipping push notification');
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const accessToken = await this.getFcmAccessToken();

      const message: any = {
        message: {
          token: deviceToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
          android: {
            priority: 'high',
            notification: {
              sound: payload.sound || 'default',
              channel_id: 'finflow_notifications',
            },
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: payload.title,
                  body: payload.body,
                },
                badge: payload.badge,
                sound: payload.sound || 'default',
              },
            },
          },
        },
      };

      // Add image if provided
      if (payload.imageUrl) {
        message.message.android.notification.image = payload.imageUrl;
        message.message.apns.fcm_options = { image: payload.imageUrl };
      }

      return new Promise((resolve) => {
        const postData = JSON.stringify(message);

        const req = https.request(
          {
            hostname: 'fcm.googleapis.com',
            path: `/v1/projects/${this.fcmProjectId}/messages:send`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const response = JSON.parse(data);
                if (res.statusCode === 200 && response.name) {
                  console.log(`✅ FCM notification sent: ${response.name}`);
                  resolve({ success: true, messageId: response.name });
                } else {
                  const errorMsg = response.error?.message || 'Unknown FCM error';
                  console.error(`❌ FCM error: ${errorMsg}`);
                  resolve({ success: false, error: errorMsg });
                }
              } catch (e) {
                resolve({ success: false, error: 'Failed to parse FCM response' });
              }
            });
          }
        );

        req.on('error', (e) => {
          console.error('❌ FCM request error:', e.message);
          resolve({ success: false, error: e.message });
        });

        req.write(postData);
        req.end();
      });
    } catch (error: any) {
      console.error('❌ FCM send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get APNs JWT token
   */
  private getApnsJwt(): string {
    // Return cached token if still valid (with 5 min buffer, APNs tokens valid for 1 hour)
    if (this.apnsJwt && Date.now() < this.apnsJwtExpiry - 300000) {
      return this.apnsJwt;
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.apnsTeamId,
      iat: now,
    };

    this.apnsJwt = jwt.sign(payload, this.apnsPrivateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: this.apnsKeyId,
      },
    });

    this.apnsJwtExpiry = Date.now() + 3600000; // 1 hour
    return this.apnsJwt;
  }

  /**
   * Send push notification via APNs (iOS only)
   */
  async sendApnsNotification(deviceToken: string, payload: PushNotificationPayload): Promise<SendResult> {
    if (!this.isApnsConfigured()) {
      console.warn('⚠️ APNs not configured - skipping push notification');
      return { success: false, error: 'APNs not configured' };
    }

    try {
      const apnsJwt = this.getApnsJwt();
      const hostname = this.apnsProduction 
        ? 'api.push.apple.com' 
        : 'api.sandbox.push.apple.com';

      const apnsPayload = {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          badge: payload.badge,
          sound: payload.sound || 'default',
          'mutable-content': payload.imageUrl ? 1 : 0,
        },
        ...payload.data,
      };

      return new Promise((resolve) => {
        const postData = JSON.stringify(apnsPayload);

        const req = https.request(
          {
            hostname,
            path: `/3/device/${deviceToken}`,
            method: 'POST',
            headers: {
              'authorization': `bearer ${apnsJwt}`,
              'apns-topic': this.apnsBundleId,
              'apns-push-type': 'alert',
              'apns-priority': '10',
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              const messageId = res.headers['apns-id'] as string;
              if (res.statusCode === 200) {
                console.log(`✅ APNs notification sent: ${messageId}`);
                resolve({ success: true, messageId });
              } else {
                try {
                  const response = JSON.parse(data);
                  const errorMsg = response.reason || 'Unknown APNs error';
                  console.error(`❌ APNs error: ${errorMsg}`);
                  resolve({ success: false, error: errorMsg });
                } catch {
                  resolve({ success: false, error: `APNs error: ${res.statusCode}` });
                }
              }
            });
          }
        );

        req.on('error', (e) => {
          console.error('❌ APNs request error:', e.message);
          resolve({ success: false, error: e.message });
        });

        req.write(postData);
        req.end();
      });
    } catch (error: any) {
      console.error('❌ APNs send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to a device
   * Automatically chooses between FCM and APNs based on token format
   * 
   * @param deviceToken - FCM token or APNs device token
   * @param payload - Notification payload
   * @param platform - Optional: 'android', 'ios', or 'auto' (default)
   */
  async send(
    deviceToken: string,
    payload: PushNotificationPayload,
    platform: 'android' | 'ios' | 'auto' = 'auto'
  ): Promise<SendResult> {
    if (!deviceToken) {
      return { success: false, error: 'No device token provided' };
    }

    // FCM tokens are longer and contain colons/underscores
    // APNs tokens are 64 hex characters
    const isApnsToken = /^[a-f0-9]{64}$/i.test(deviceToken);

    if (platform === 'android') {
      return this.sendFcmNotification(deviceToken, payload);
    }

    if (platform === 'ios') {
      // Prefer FCM for iOS as it's easier to manage
      if (this.isFcmConfigured()) {
        return this.sendFcmNotification(deviceToken, payload);
      }
      // Fall back to APNs if FCM is not configured
      if (this.isApnsConfigured() && isApnsToken) {
        return this.sendApnsNotification(deviceToken, payload);
      }
    }

    // Auto-detect platform
    if (isApnsToken && this.isApnsConfigured() && !this.isFcmConfigured()) {
      return this.sendApnsNotification(deviceToken, payload);
    }

    // Default to FCM (works for both platforms when app uses FCM SDK)
    if (this.isFcmConfigured()) {
      return this.sendFcmNotification(deviceToken, payload);
    }

    console.warn('⚠️ No push notification service configured');
    return { success: false, error: 'No push notification service configured' };
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultiple(
    deviceTokens: string[],
    payload: PushNotificationPayload,
    platform: 'android' | 'ios' | 'auto' = 'auto'
  ): Promise<{ successful: number; failed: number; results: SendResult[] }> {
    const results: SendResult[] = [];
    let successful = 0;
    let failed = 0;

    // Send in parallel with a batch limit
    const batchSize = 100;
    for (let i = 0; i < deviceTokens.length; i += batchSize) {
      const batch = deviceTokens.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(token => this.send(token, payload, platform))
      );
      
      for (const result of batchResults) {
        results.push(result);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }
    }

    console.log(`📊 Push notifications sent: ${successful} successful, ${failed} failed`);
    return { successful, failed, results };
  }

  /**
   * Send a price alert notification
   */
  async sendPriceAlert(
    deviceToken: string,
    symbol: string,
    alertType: 'above' | 'below',
    targetPrice: number,
    currentPrice: number,
    currency: string = 'USD'
  ): Promise<SendResult> {
    const direction = alertType === 'above' ? '↗️' : '↘️';
    const action = alertType === 'above' ? 'überschritten' : 'unterschritten';
    
    return this.send(deviceToken, {
      title: `${direction} Preisalarm: ${symbol}`,
      body: `${symbol} hat ${targetPrice.toFixed(2)} ${currency} ${action}. Aktueller Preis: ${currentPrice.toFixed(2)} ${currency}`,
      data: {
        type: 'price_alert',
        symbol,
        alertType,
        targetPrice: targetPrice.toString(),
        currentPrice: currentPrice.toString(),
      },
      sound: 'default',
    });
  }

  /**
   * Send a transaction notification
   */
  async sendTransactionAlert(
    deviceToken: string,
    type: 'income' | 'expense',
    amount: number,
    category: string,
    currency: string = 'CHF'
  ): Promise<SendResult> {
    const icon = type === 'income' ? '💰' : '💸';
    const action = type === 'income' ? 'Einnahme' : 'Ausgabe';
    
    return this.send(deviceToken, {
      title: `${icon} Neue ${action}`,
      body: `${action}: ${amount.toFixed(2)} ${currency} - ${category}`,
      data: {
        type: 'transaction',
        transactionType: type,
        amount: amount.toString(),
        category,
      },
      sound: 'default',
    });
  }

  /**
   * Send a budget warning notification
   */
  async sendBudgetWarning(
    deviceToken: string,
    category: string,
    percentUsed: number,
    remainingAmount: number,
    currency: string = 'CHF'
  ): Promise<SendResult> {
    const icon = percentUsed >= 100 ? '🚨' : percentUsed >= 90 ? '⚠️' : '📊';
    const status = percentUsed >= 100 ? 'überschritten' : `${percentUsed.toFixed(0)}% erreicht`;
    
    return this.send(deviceToken, {
      title: `${icon} Budget-Warnung: ${category}`,
      body: `Budget für ${category} ${status}. Verbleibend: ${remainingAmount.toFixed(2)} ${currency}`,
      data: {
        type: 'budget_warning',
        category,
        percentUsed: percentUsed.toString(),
        remainingAmount: remainingAmount.toString(),
      },
      sound: 'default',
    });
  }
}

export const pushNotificationService = new PushNotificationService();
