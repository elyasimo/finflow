'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/finflow/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Bell, BellOff, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PriceAlert {
  id: string;
  asset: string;
  alertType: 'above' | 'below';
  targetPrice: string;
  currentPrice: string | null;
  isActive: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

// Create axios instance with auth
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081',
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function PriceAlertsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    asset: '',
    alertType: 'above' as 'above' | 'below',
    targetPrice: '',
  });

  // Fetch price alerts
  const { data: alerts = [], isLoading } = useQuery<PriceAlert[]>({
    queryKey: ['price-alerts'],
    queryFn: async () => {
      const response = await api.get('/price-alerts');
      return response.data;
    },
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: typeof newAlert) => {
      const response = await api.post('/price-alerts', alertData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      toast({
        title: 'Success',
        description: 'Price alert created successfully',
      });
      setNewAlert({ asset: '', alertType: 'above', targetPrice: '' });
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create alert',
        variant: 'destructive',
      });
    },
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await api.delete(`/price-alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      toast({
        title: 'Success',
        description: 'Price alert deleted',
      });
    },
  });

  // Toggle alert mutation
  const toggleAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await api.put(`/price-alerts/${alertId}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
    },
  });

  const handleCreateAlert = () => {
    if (!newAlert.asset || !newAlert.targetPrice) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    createAlertMutation.mutate(newAlert);
  };

  const formatPrice = (price: string | null) => {
    if (!price) return 'N/A';
    const num = parseFloat(price);
    return num < 1 ? num.toFixed(6) : num.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const activeAlerts = alerts.filter(a => a.isActive && !a.triggeredAt);
  const triggeredAlerts = alerts.filter(a => a.triggeredAt);

  // Show loading while checking auth
  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0f1a]">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Price Alerts</h1>
          <p className="text-muted-foreground">Get notified when assets reach your target price</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Price Alert</CardTitle>
            <CardDescription>Set a price target to get notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset">Asset</Label>
                <Input
                  id="asset"
                  placeholder="BTCUSDT, AAPL, etc."
                  value={newAlert.asset}
                  onChange={(e) => setNewAlert({ ...newAlert, asset: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertType">Alert Type</Label>
                <Select
                  value={newAlert.alertType}
                  onValueChange={(value: 'above' | 'below') => setNewAlert({ ...newAlert, alertType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                        Above
                      </div>
                    </SelectItem>
                    <SelectItem value="below">
                      <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
                        Below
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetPrice">Target Price</Label>
                <Input
                  id="targetPrice"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={newAlert.targetPrice}
                  onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAlert}
                disabled={createAlertMutation.isPending}
              >
                {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Active Alerts ({activeAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : activeAlerts.length === 0 ? (
            <p className="text-muted-foreground">No active alerts. Create one to get started!</p>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {alert.alertType === 'above' ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{alert.asset}</div>
                      <div className="text-sm text-muted-foreground">
                        Alert when {alert.alertType === 'above' ? 'above' : 'below'} {formatPrice(alert.targetPrice)}
                      </div>
                      {alert.currentPrice && (
                        <div className="text-xs text-muted-foreground">
                          Current: {formatPrice(alert.currentPrice)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={alert.isActive ? 'default' : 'secondary'}>
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleAlertMutation.mutate(alert.id)}
                      disabled={toggleAlertMutation.isPending}
                    >
                      {alert.isActive ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                      disabled={deleteAlertMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BellOff className="h-5 w-5 mr-2" />
              Triggered Alerts ({triggeredAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-accent/20"
                >
                  <div className="flex items-center space-x-4">
                    {alert.alertType === 'above' ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{alert.asset}</div>
                      <div className="text-sm text-muted-foreground">
                        Target: {formatPrice(alert.targetPrice)} | Triggered at: {formatPrice(alert.currentPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(alert.triggeredAt!)}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlertMutation.mutate(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
}
