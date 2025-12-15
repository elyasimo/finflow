'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Calendar, RefreshCw, ArrowDownCircle, ArrowUpCircle, Repeat, Clock, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import Layout from '@/components/finflow/layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface RecurringTransaction {
  id: string;
  accountId: string;
  accountName?: string;
  type: 'income' | 'expense' | 'transfer';
  amountCents: number;
  currency: string;
  description: string;
  categoryId?: string;
  categoryName?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  intervalCount: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
  nextOccurrence: string;
  lastProcessed?: string;
  isActive: boolean;
  autoPost: boolean;
  reminderDays: number;
  totalOccurrences: number;
}

interface Account {
  id: string;
  name: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function RecurringPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [formData, setFormData] = useState({
    accountId: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amountCents: 0,
    description: '',
    categoryId: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    intervalCount: 1,
    dayOfMonth: 1,
    dayOfWeek: 1,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    autoPost: true,
    reminderDays: 3,
  });

  // Fetch recurring transactions
  const { data: recurringTransactions = [], isLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ['recurring'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/recurring`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch recurring transactions');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch upcoming transactions
  const { data: upcomingTransactions = [] } = useQuery<RecurringTransaction[]>({
    queryKey: ['recurring', 'upcoming'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/recurring/upcoming?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch upcoming');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    enabled: !!token,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`${API_URL}/recurring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          currency: accounts.find(a => a.id === data.accountId)?.currency || 'EUR',
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`${API_URL}/recurring/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      setEditingRecurring(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/recurring/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/recurring/${id}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to toggle');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });

  const resetForm = () => {
    setFormData({
      accountId: accounts[0]?.id || '',
      type: 'expense',
      amountCents: 0,
      description: '',
      categoryId: '',
      frequency: 'monthly',
      intervalCount: 1,
      dayOfMonth: 1,
      dayOfWeek: 1,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      autoPost: true,
      reminderDays: 3,
    });
  };

  const handleEdit = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring);
    setFormData({
      accountId: recurring.accountId,
      type: recurring.type,
      amountCents: recurring.amountCents,
      description: recurring.description || '',
      categoryId: recurring.categoryId || '',
      frequency: recurring.frequency,
      intervalCount: recurring.intervalCount,
      dayOfMonth: recurring.dayOfMonth || 1,
      dayOfWeek: recurring.dayOfWeek || 1,
      startDate: format(new Date(recurring.startDate), 'yyyy-MM-dd'),
      endDate: recurring.endDate ? format(new Date(recurring.endDate), 'yyyy-MM-dd') : '',
      autoPost: recurring.autoPost,
      reminderDays: recurring.reminderDays,
    });
  };

  const handleSubmit = () => {
    if (editingRecurring) {
      updateMutation.mutate({ id: editingRecurring.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const getFrequencyLabel = (frequency: string, interval: number) => {
    const labels: Record<string, string> = {
      daily: interval === 1 ? 'Täglich' : `Alle ${interval} Tage`,
      weekly: interval === 1 ? 'Wöchentlich' : `Alle ${interval} Wochen`,
      monthly: interval === 1 ? 'Monatlich' : `Alle ${interval} Monate`,
      yearly: interval === 1 ? 'Jährlich' : `Alle ${interval} Jahre`,
    };
    return labels[frequency] || frequency;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const activeRecurring = recurringTransactions.filter(r => r.isActive);
  const inactiveRecurring = recurringTransactions.filter(r => !r.isActive);
  const totalMonthlyExpenses = activeRecurring
    .filter(r => r.type === 'expense' && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amountCents, 0);
  const totalMonthlyIncome = activeRecurring
    .filter(r => r.type === 'income' && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.amountCents, 0);

  return (
    <Layout user={user}>
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 pt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Repeat className="h-7 w-7 text-primary" />
                Wiederkehrende Transaktionen
              </h1>
              <p className="text-muted-foreground mt-1">
                Verwalten Sie regelmäßige Einnahmen und Ausgaben
              </p>
            </div>
            <Dialog open={isCreateDialogOpen || !!editingRecurring} onOpenChange={(open) => {
              if (!open) {
                setIsCreateDialogOpen(false);
                setEditingRecurring(null);
                resetForm();
              } else {
                setIsCreateDialogOpen(true);
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Neue wiederkehrende Buchung
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingRecurring ? 'Bearbeiten' : 'Neue wiederkehrende Buchung'}
                  </DialogTitle>
                  <DialogDescription>
                    Erstellen Sie automatische Buchungen für Miete, Gehalt, Abos, etc.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* Type */}
                  <div className="grid gap-2">
                    <Label>Typ</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Ausgabe</SelectItem>
                        <SelectItem value="income">Einnahme</SelectItem>
                        <SelectItem value="transfer">Umbuchung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Account */}
                  <div className="grid gap-2">
                    <Label>Konto</Label>
                    <Select
                      value={formData.accountId}
                      onValueChange={(v) => setFormData({ ...formData, accountId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Konto auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount */}
                  <div className="grid gap-2">
                    <Label>Betrag</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amountCents / 100}
                      onChange={(e) => setFormData({ ...formData, amountCents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Description */}
                  <div className="grid gap-2">
                    <Label>Beschreibung</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="z.B. Miete, Netflix, Gehalt..."
                    />
                  </div>

                  {/* Category */}
                  <div className="grid gap-2">
                    <Label>Kategorie</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Keine</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Frequency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Häufigkeit</Label>
                      <Select
                        value={formData.frequency}
                        onValueChange={(v) => setFormData({ ...formData, frequency: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Täglich</SelectItem>
                          <SelectItem value="weekly">Wöchentlich</SelectItem>
                          <SelectItem value="monthly">Monatlich</SelectItem>
                          <SelectItem value="yearly">Jährlich</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Intervall</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.intervalCount}
                        onChange={(e) => setFormData({ ...formData, intervalCount: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  {/* Day of month (for monthly) */}
                  {formData.frequency === 'monthly' && (
                    <div className="grid gap-2">
                      <Label>Tag des Monats</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.dayOfMonth}
                        onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  )}

                  {/* Day of week (for weekly) */}
                  {formData.frequency === 'weekly' && (
                    <div className="grid gap-2">
                      <Label>Wochentag</Label>
                      <Select
                        value={String(formData.dayOfWeek)}
                        onValueChange={(v) => setFormData({ ...formData, dayOfWeek: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Montag</SelectItem>
                          <SelectItem value="2">Dienstag</SelectItem>
                          <SelectItem value="3">Mittwoch</SelectItem>
                          <SelectItem value="4">Donnerstag</SelectItem>
                          <SelectItem value="5">Freitag</SelectItem>
                          <SelectItem value="6">Samstag</SelectItem>
                          <SelectItem value="0">Sonntag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Start/End Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Startdatum</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Enddatum (optional)</Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Auto Post */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Automatisch buchen</Label>
                      <p className="text-sm text-muted-foreground">
                        Transaktion wird automatisch erstellt
                      </p>
                    </div>
                    <Switch
                      checked={formData.autoPost}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoPost: checked })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingRecurring(null);
                    resetForm();
                  }}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingRecurring ? 'Speichern' : 'Erstellen'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monatliche Ausgaben</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(totalMonthlyExpenses, 'EUR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <ArrowUpCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monatliche Einnahmen</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(totalMonthlyIncome, 'EUR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Repeat className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aktive Buchungen</p>
                    <p className="text-xl font-bold">{activeRecurring.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Aktiv ({activeRecurring.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Anstehend ({upcomingTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inaktiv ({inactiveRecurring.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Konto</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Häufigkeit</TableHead>
                      <TableHead>Nächste Buchung</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRecurring.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Keine aktiven wiederkehrenden Buchungen
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeRecurring.map((recurring) => (
                        <TableRow key={recurring.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {recurring.type === 'expense' ? (
                                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                              )}
                              <span className="font-medium">{recurring.description || 'Ohne Beschreibung'}</span>
                            </div>
                            {recurring.categoryName && (
                              <span className="text-xs text-muted-foreground">{recurring.categoryName}</span>
                            )}
                          </TableCell>
                          <TableCell>{recurring.accountName}</TableCell>
                          <TableCell className={recurring.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                            {recurring.type === 'expense' ? '-' : '+'}
                            {formatCurrency(recurring.amountCents, recurring.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getFrequencyLabel(recurring.frequency, recurring.intervalCount)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(recurring.nextOccurrence), 'dd.MM.yyyy', { locale: de })}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(recurring.nextOccurrence), { addSuffix: true, locale: de })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={recurring.autoPost ? 'default' : 'secondary'}>
                              {recurring.autoPost ? 'Automatisch' : 'Manuell'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(recurring)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleMutation.mutate(recurring.id)}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Wirklich löschen?')) {
                                    deleteMutation.mutate(recurring.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Anstehende Buchungen (nächste 30 Tage)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingTransactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Keine anstehenden Buchungen
                    </p>
                  ) : (
                    upcomingTransactions.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {item.type === 'expense' ? (
                            <ArrowDownCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <ArrowUpCircle className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.accountName} • {item.categoryName || 'Ohne Kategorie'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${item.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                            {item.type === 'expense' ? '-' : '+'}
                            {formatCurrency(item.amountCents, item.currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.nextOccurrence), 'dd.MM.yyyy', { locale: de })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inactive" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Häufigkeit</TableHead>
                      <TableHead>Ausführungen</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveRecurring.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Keine inaktiven Buchungen
                        </TableCell>
                      </TableRow>
                    ) : (
                      inactiveRecurring.map((recurring) => (
                        <TableRow key={recurring.id} className="opacity-60">
                          <TableCell>{recurring.description || 'Ohne Beschreibung'}</TableCell>
                          <TableCell>
                            {formatCurrency(recurring.amountCents, recurring.currency)}
                          </TableCell>
                          <TableCell>
                            {getFrequencyLabel(recurring.frequency, recurring.intervalCount)}
                          </TableCell>
                          <TableCell>{recurring.totalOccurrences}x ausgeführt</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleMutation.mutate(recurring.id)}
                            >
                              Reaktivieren
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </Layout>
  );
}
