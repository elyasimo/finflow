'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { notificationsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Check, CheckCheck, AlertTriangle, TrendingUp, CalendarClock, FileText, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  sentAt: string;
  readAt?: string;
}

interface NotificationPreferences {
  budgetAlerts: boolean;
  priceAlerts: boolean;
  recurringReminders: boolean;
  weeklyReport: boolean;
  marketUpdates: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'budget_warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'price_alert':
      return <TrendingUp className="h-5 w-5 text-blue-500" />;
    case 'recurring_reminder':
      return <CalendarClock className="h-5 w-5 text-purple-500" />;
    case 'weekly_report':
      return <FileText className="h-5 w-5 text-green-500" />;
    case 'market_update':
      return <BarChart3 className="h-5 w-5 text-orange-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const getNotificationTypeBadge = (type: string) => {
  const labels: Record<string, string> = {
    budget_warning: 'Budget',
    price_alert: 'Price Alert',
    recurring_reminder: 'Recurring',
    weekly_report: 'Report',
    market_update: 'Market',
  };
  return labels[type] || type;
};

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    budgetAlerts: true,
    priceAlerts: true,
    recurringReminders: true,
    weeklyReport: true,
    marketUpdates: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notificationsRes, preferencesRes] = await Promise.all([
        notificationsApi.getNotifications(),
        notificationsApi.getPreferences(),
      ]);
      setNotifications(notificationsRes.notifications || []);
      setUnreadCount(notificationsRes.unreadCount || 0);
      setPreferences(preferencesRes);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await notificationsApi.updatePreferences(newPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setPreferences(preferences);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && <Badge className="bg-red-500">{unreadCount}</Badge>}
          </h1>
          <p className="text-muted-foreground mt-2">Stay updated with your financial activities</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />Mark All Read
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread {unreadCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2">{unreadCount}</span>}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'unread' ? "You're all caught up!" : "You don't have any notifications yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                        !notification.read && "bg-muted/30 border-primary/20"
                      )}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{getNotificationTypeBadge(notification.type)}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(notification.sentAt)}</span>
                          {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                        </div>
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                      </div>
                      {!notification.read && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Choose which notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Budget Alerts</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Get notified when you're near your budget limit</p>
                </div>
                <Switch checked={preferences.budgetAlerts} onCheckedChange={(v) => updatePreference('budgetAlerts', v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Price Alerts</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Crypto/stock price target notifications</p>
                </div>
                <Switch checked={preferences.priceAlerts} onCheckedChange={(v) => updatePreference('priceAlerts', v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Recurring Reminders</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Reminders for upcoming recurring transactions</p>
                </div>
                <Switch checked={preferences.recurringReminders} onCheckedChange={(v) => updatePreference('recurringReminders', v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Weekly Report</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Weekly summary of your finances</p>
                </div>
                <Switch checked={preferences.weeklyReport} onCheckedChange={(v) => updatePreference('weeklyReport', v)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Market Updates</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Daily market news and trends</p>
                </div>
                <Switch checked={preferences.marketUpdates} onCheckedChange={(v) => updatePreference('marketUpdates', v)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
