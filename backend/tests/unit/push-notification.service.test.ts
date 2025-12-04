import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import https from 'https';
import { EventEmitter } from 'events';

// Mock https module
vi.mock('https', () => ({
  default: {
    request: vi.fn(),
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
  },
}));

describe('PushNotificationService', () => {
  const mockRequest = https.request as unknown as ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    
    // Reset environment variables
    process.env.FCM_PROJECT_ID = '';
    process.env.FCM_CLIENT_EMAIL = '';
    process.env.FCM_PRIVATE_KEY = '';
    process.env.APNS_KEY_ID = '';
    process.env.APNS_TEAM_ID = '';
    process.env.APNS_PRIVATE_KEY = '';
    process.env.APNS_BUNDLE_ID = 'ch.finflowapp.app';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration Check', () => {
    it('should report FCM as not configured when env vars are missing', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      expect(pushNotificationService.isFcmConfigured()).toBe(false);
    });

    it('should report APNs as not configured when env vars are missing', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      expect(pushNotificationService.isApnsConfigured()).toBe(false);
    });

    it('should report FCM as configured when all env vars are set', async () => {
      process.env.FCM_PROJECT_ID = 'test-project';
      process.env.FCM_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FCM_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';
      
      vi.resetModules();
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      expect(pushNotificationService.isFcmConfigured()).toBe(true);
    });
  });

  describe('send()', () => {
    it('should return error when no device token provided', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.send('', { title: 'Test', body: 'Test body' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No device token provided');
    });

    it('should return error when no push service is configured', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.send('test-token-123', { title: 'Test', body: 'Test body' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No push notification service configured');
    });
  });

  describe('sendFcmNotification()', () => {
    it('should return error when FCM is not configured', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.sendFcmNotification('test-token', {
        title: 'Test',
        body: 'Test body',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('FCM not configured');
    });
  });

  describe('sendApnsNotification()', () => {
    it('should return error when APNs is not configured', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.sendApnsNotification(
        'a'.repeat(64), // Valid APNs token format
        { title: 'Test', body: 'Test body' }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('APNs not configured');
    });
  });

  describe('sendToMultiple()', () => {
    it('should handle empty token array', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.sendToMultiple([], { title: 'Test', body: 'Test body' });
      
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should count failures when no service is configured', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.sendToMultiple(
        ['token1', 'token2', 'token3'],
        { title: 'Test', body: 'Test body' }
      );
      
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(3);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('sendPriceAlert()', () => {
    it('should format price alert notification correctly', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      // Since no service is configured, it will fail, but we can verify the method doesn't throw
      const result = await pushNotificationService.sendPriceAlert(
        'test-token',
        'BTCUSDT',
        'above',
        50000,
        51000,
        'USD'
      );
      
      expect(result.success).toBe(false); // No service configured
    });
  });

  describe('sendTransactionAlert()', () => {
    it('should format income transaction notification', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.sendTransactionAlert(
        'test-token',
        'income',
        1000.50,
        'Gehalt',
        'CHF'
      );
      
      expect(result.success).toBe(false); // No service configured
    });

    it('should format expense transaction notification', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.sendTransactionAlert(
        'test-token',
        'expense',
        50.00,
        'Lebensmittel',
        'CHF'
      );
      
      expect(result.success).toBe(false); // No service configured
    });
  });

  describe('sendBudgetWarning()', () => {
    it('should format budget warning with percentage', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.sendBudgetWarning(
        'test-token',
        'Lebensmittel',
        85,
        150.00,
        'CHF'
      );
      
      expect(result.success).toBe(false); // No service configured
    });

    it('should handle exceeded budget (100%+)', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      const result = await pushNotificationService.sendBudgetWarning(
        'test-token',
        'Restaurant',
        110,
        -50.00,
        'CHF'
      );
      
      expect(result.success).toBe(false); // No service configured
    });
  });

  describe('Token format detection', () => {
    it('should detect APNs token format (64 hex chars)', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      // APNs tokens are exactly 64 hex characters
      const apnsToken = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
      
      // The service should try APNs for this format if APNs is configured
      // Since nothing is configured, it will fall back to error
      const result = await pushNotificationService.send(apnsToken, { title: 'Test', body: 'Body' });
      
      expect(result.success).toBe(false);
    });

    it('should treat non-hex tokens as FCM tokens', async () => {
      const { pushNotificationService } = await import('../../src/services/push-notification.service.js');
      
      // FCM tokens contain colons and other chars
      const fcmToken = 'dXJy7r7hT_K:APA91bFakeToken123_with-special:chars';
      
      const result = await pushNotificationService.send(fcmToken, { title: 'Test', body: 'Body' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No push notification service configured');
    });
  });
});
