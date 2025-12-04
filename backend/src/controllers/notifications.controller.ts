// @ts-nocheck
import { Request, Response } from 'express';
import { db } from '../db.js';
import { pushTokens, notifications, users } from '../db/schema.js';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { pushNotificationService } from '../services/push-notification.service.js';

// Register push token
export const registerPushToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token, platform, deviceName } = req.body;

    if (!token || !platform) {
      return res.status(400).json({ error: 'Token and platform are required' });
    }

    // Upsert token
    await db
      .insert(pushTokens)
      .values({
        userId,
        token,
        platform,
        deviceName: deviceName || null,
      })
      .onConflictDoUpdate({
        target: [pushTokens.userId, pushTokens.token],
        set: {
          platform,
          deviceName: deviceName || null,
          isActive: true,
          updatedAt: new Date(),
        },
      });

    res.json({ success: true });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Failed to register push token' });
  }
};

// Unregister push token
export const unregisterPushToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    await db
      .update(pushTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error unregistering push token:', error);
    res.status(500).json({ error: 'Failed to unregister push token' });
  }
};

// Get notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = '50', unreadOnly = 'false' } = req.query;

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.sentAt))
      .limit(parseInt(limit as string));

    if (unreadOnly === 'true') {
      query = db
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
        .orderBy(desc(notifications.sentAt))
        .limit(parseInt(limit as string));
    }

    const result = await query;

    // Get unread count
    const unreadCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    res.json({
      notifications: result,
      unreadCount: Number(unreadCount[0]?.count || 0),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db
      .select({ notificationPreferences: sql<any>`notification_preferences` })
      .from(users)
      .where(eq(users.id, userId));

    const defaultPreferences = {
      budgetAlerts: true,
      priceAlerts: true,
      recurringReminders: true,
      weeklyReport: true,
      marketUpdates: false,
    };

    res.json(user[0]?.notificationPreferences || defaultPreferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = req.body;

    await db.execute(
      sql`UPDATE users SET notification_preferences = ${JSON.stringify(preferences)}::jsonb WHERE id = ${userId}`
    );

    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
};

// Send notification (internal use)
export const sendNotification = async (
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  try {
    // Save notification to database
    await db.insert(notifications).values({
      userId,
      type,
      title,
      body,
      data,
    });

    // Get user's push tokens
    const tokens = await db
      .select()
      .from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));

    // Send push notifications to all user's devices
    if (tokens.length > 0) {
      console.log(`📱 Sending push notification to ${tokens.length} devices for user ${userId}`);
      
      for (const tokenRecord of tokens) {
        const result = await pushNotificationService.send(
          tokenRecord.token,
          {
            title,
            body,
            data: data ? Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, String(v)])
            ) : undefined,
            sound: 'default',
          },
          tokenRecord.platform === 'android' ? 'android' : tokenRecord.platform === 'ios' ? 'ios' : 'auto'
        );

        if (!result.success) {
          console.error(`❌ Failed to send push to device: ${result.error}`);
          
          // If token is invalid, mark as inactive
          if (result.error?.includes('NotRegistered') || 
              result.error?.includes('InvalidRegistration') ||
              result.error?.includes('Unregistered') ||
              result.error?.includes('BadDeviceToken')) {
            await db
              .update(pushTokens)
              .set({ isActive: false, updatedAt: new Date() })
              .where(eq(pushTokens.id, tokenRecord.id));
            console.log(`📱 Deactivated invalid push token: ${tokenRecord.id}`);
          }
        } else {
          console.log(`✅ Push notification sent: ${result.messageId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Delete old notifications (cleanup)
export const cleanupOldNotifications = async (req: Request, res: Response) => {
  try {
    // Only admin can trigger this
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId || userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Delete notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.execute(
      sql`DELETE FROM notifications WHERE sent_at < ${thirtyDaysAgo.toISOString()}`
    );

    res.json({ success: true, message: 'Old notifications cleaned up' });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({ error: 'Failed to cleanup notifications' });
  }
};
