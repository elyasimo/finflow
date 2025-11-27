// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBudgets } from '@/hooks/use-budgets';
import { useTransactions } from '@/hooks/use-transactions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Edit, PiggyBank, Calendar } from 'lucide-react';
import Layout from '@/components/finflow/layout';
import MobileBudgetsNew from '@/components/finflow/mobile-budgets-new';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { budgetsApi } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getTranslatedText } from '@/lib/translation-utils';
import { useCurrency } from '@/components/finflow/CurrencyContext';
import { useMediaQuery } from '@/hooks/use-mobile';

interface BudgetUsage {
  budgetId: string;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
}

export default function BudgetsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { budgets, isLoading: budgetsLoading, createBudget, updateBudget, deleteBudget, isCreating, isUpdating, isDeleting } = useBudgets();
  const { transactions } = useTransactions();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { currency: userCurrency } = useCurrency();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [budgetUsages, setBudgetUsages] = useState<Record<string, BudgetUsage>>({});
  const [budgetSuggestions, setBudgetSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Form state
  const [budgetName, setBudgetName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  
  // Set initial currency when user currency changes or dialog opens
  useEffect(() => {
    if (isCreateDialogOpen && !budgetCurrency) {
      setBudgetCurrency(userCurrency);
    }
  }, [isCreateDialogOpen, userCurrency, budgetCurrency]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isCreateDialogOpen) {
      setBudgetName('');
      setBudgetAmount('');
      setBudgetCurrency(userCurrency);
      setStartDate(new Date());
      
      // Set end date to the last day of the current month
      const lastDayOfMonth = new Date();
      lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
      lastDayOfMonth.setDate(0);
      setEndDate(lastDayOfMonth);
    }
  }, [isCreateDialogOpen, userCurrency]);

  // Set form values when editing a budget
  useEffect(() => {
    if (selectedBudget && isEditDialogOpen) {
      setBudgetName(selectedBudget.name);
      setBudgetAmount(selectedBudget.amount.toString());
      setStartDate(new Date(selectedBudget.startDate));
      setEndDate(new Date(selectedBudget.endDate));
    }
  }, [selectedBudget, isEditDialogOpen]);

  // Load budget usages when budgets change
  useEffect(() => {
    const loadBudgetUsages = async () => {
      if (!budgets || budgets.length === 0) return;

      const usages: Record<string, BudgetUsage> = {};

      for (const budget of budgets) {
        try {
          const usage = await budgetsApi.getBudgetUsage(budget.id);
          usages[budget.id] = {
            budgetId: budget.id,
            spentAmount: usage.spentAmount,
            remainingAmount: usage.remainingAmount,
            percentage: usage.percentage,
          };
        } catch (error) {
          console.error(`Error loading usage for budget ${budget.id}:`, error);
          usages[budget.id] = {
            budgetId: budget.id,
            spentAmount: 0,
            remainingAmount: Number(budget.amount) || 0,
            percentage: 0,
          };
        }
      }

      setBudgetUsages(usages);
    };

    loadBudgetUsages();
  }, [budgets]);

  // Handle create budget
  const handleCreateBudget = async () => {
    if (startDate && endDate) {
      try {
        await new Promise<void>((resolve, reject) => {
          createBudget({
            name: budgetName,
            amount: parseFloat(budgetAmount),
            currency: budgetCurrency,
            period: budgetPeriod,
            startDate: startDate,
            endDate: endDate,
          }, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
        setIsCreateDialogOpen(false);
      } catch (error) {
        console.error('Error creating budget:', error);
        alert(`Failed to create budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Handle update budget
  const handleUpdateBudget = async () => {
    if (selectedBudget && startDate && endDate) {
      try {
        await new Promise<void>((resolve, reject) => {
          updateBudget({
            id: selectedBudget.id,
            data: {
              name: budgetName,
              amount: parseFloat(budgetAmount),
              startDate: startDate,
              endDate: endDate,
            },
          }, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error('Error updating budget:', error);
        alert(`Failed to update budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Handle delete budget
  const handleDeleteBudget = () => {
    if (selectedBudget) {
      deleteBudget(selectedBudget.id);
      setIsDeleteDialogOpen(false);
    }
  };

  // Load budget suggestions
  const loadBudgetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await budgetsApi.getSuggestions();
      setBudgetSuggestions(response.suggestions || []);
      if (response.suggestions && response.suggestions.length > 0) {
        setIsSuggestionsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading budget suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Accept a budget suggestion
  const acceptSuggestion = (suggestion: any) => {
    createBudget({
      name: suggestion.categoryName,
      amount: suggestion.suggestedAmount,
      currency: suggestion.currency,
      categoryId: suggestion.categoryId,
      period: suggestion.period,
      startDate: new Date(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    });
    // Remove from suggestions
    setBudgetSuggestions(prev => prev.filter(s => s.categoryId !== suggestion.categoryId));
  };

  // Get budget usage from loaded data
  const getBudgetUsage = (budgetId: string) => {
    return budgetUsages[budgetId] || { spentAmount: 0, remainingAmount: 0, percentage: 0 };
  };

  // Show loading state while checking authentication or fetching data
  if (authLoading || budgetsLoading) {
    return <div className="flex h-screen items-center justify-center">{t('loading')}</div>;
  }

  // If not authenticated, don't render anything (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Calculate spent amounts for budgets
  const budgetsWithSpent = budgets?.map(budget => {
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);
    const spent = transactions
      ?.filter(t => {
        const txDate = new Date(t.transactionDate);
        return t.type === 'expense' && txDate >= budgetStart && txDate <= budgetEnd;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
    
    return {
      id: budget.id,
      name: getTranslatedText(budget.name, budget.nameTranslations, language),
      amount: Number(budget.amount),
      spent,
      currency: budget.currency || userCurrency,
      startDate: budget.startDate,
      endDate: budget.endDate,
    };
  }) || [];

  // Render mobile version
  if (isMobile) {
    return (
      <MobileBudgetsNew
        budgets={budgetsWithSpent}
        onAddBudget={() => setIsCreateDialogOpen(true)}
        onEditBudget={(id) => {
          const budget = budgets?.find(b => b.id === id);
          if (budget) {
            setSelectedBudget(budget);
            setIsEditDialogOpen(true);
          }
        }}
        onDeleteBudget={(id) => deleteBudget(id)}
      />
    );
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('budgets')}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadBudgetSuggestions} disabled={loadingSuggestions}>
              {loadingSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PiggyBank className="mr-2 h-4 w-4" />}
              Vorschläge
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addBudget')}
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createNewBudget')}</DialogTitle>
                <DialogDescription>
                  {t('addNewBudgetToTrack')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    {t('name')}
                  </Label>
                  <Input
                    id="name"
                    value={budgetName}
                    onChange={(e) => setBudgetName(e.target.value)}
                    className="col-span-3"
                    placeholder={t('monthlyGroceryBudget')}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    {t('amount')}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currency" className="text-right">
                    {t('currency')}
                  </Label>
                  <Select value={budgetCurrency} onValueChange={setBudgetCurrency}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                      <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                      <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                      <SelectItem value="MAD">MAD - Moroccan Dirham</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="period" className="text-right">
                    {t('period')}
                  </Label>
                  <Select value={budgetPeriod} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => {
                    setBudgetPeriod(value);
                    // Auto-calculate end date based on period
                    if (startDate) {
                      const newEndDate = new Date(startDate);
                      if (value === 'monthly') {
                        newEndDate.setMonth(newEndDate.getMonth() + 1);
                        newEndDate.setDate(0); // Last day of month
                      } else if (value === 'quarterly') {
                        newEndDate.setMonth(newEndDate.getMonth() + 3);
                        newEndDate.setDate(0); // Last day of quarter
                      } else if (value === 'yearly') {
                        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                        newEndDate.setDate(0); // Last day of year
                      }
                      setEndDate(newEndDate);
                    }
                  }}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{t('monthly')}</SelectItem>
                      <SelectItem value="quarterly">{t('quarterly')}</SelectItem>
                      <SelectItem value="yearly">{t('yearly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    {t('startDate')}
                  </Label>
                  <div className="col-span-3">
                    <DatePicker
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        // Auto-calculate end date when start date changes
                        if (date) {
                          const newEndDate = new Date(date);
                          if (budgetPeriod === 'monthly') {
                            newEndDate.setMonth(newEndDate.getMonth() + 1);
                            newEndDate.setDate(0);
                          } else if (budgetPeriod === 'quarterly') {
                            newEndDate.setMonth(newEndDate.getMonth() + 3);
                            newEndDate.setDate(0);
                          } else if (budgetPeriod === 'yearly') {
                            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                            newEndDate.setDate(0);
                          }
                          setEndDate(newEndDate);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    {t('endDate')}
                  </Label>
                  <div className="col-span-3">
                    <DatePicker
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date: Date) => date < (startDate || new Date())}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateBudget} disabled={isCreating}>
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('create')}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets?.map((budget) => {
            const usage = getBudgetUsage(budget.id);
            return (
              <Card key={budget.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="h-5 w-5" />
                    <CardTitle className="text-sm font-medium">
                      {getTranslatedText(budget.name, budget.nameTranslations, language)}
                    </CardTitle>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={isEditDialogOpen && selectedBudget?.id === budget.id} onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (open) setSelectedBudget(budget);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('editBudget')}</DialogTitle>
                          <DialogDescription>
                            {t('updateBudgetDetails')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                              {t('name')}
                            </Label>
                            <Input
                              id="edit-name"
                              value={budgetName}
                              onChange={(e) => setBudgetName(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-amount" className="text-right">
                              {t('amount')}
                            </Label>
                            <Input
                              id="edit-amount"
                              type="number"
                              value={budgetAmount}
                              onChange={(e) => setBudgetAmount(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-startDate" className="text-right">
                              {t('startDate')}
                            </Label>
                            <div className="col-span-3">
                              <DatePicker
                                selected={startDate}
                                onSelect={setStartDate}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-endDate" className="text-right">
                              {t('endDate')}
                            </Label>
                            <div className="col-span-3">
                              <DatePicker
                                selected={endDate}
                                onSelect={setEndDate}
                                disabled={(date: Date) => date < (startDate || new Date())}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={handleUpdateBudget} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('saveChanges')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isDeleteDialogOpen && selectedBudget?.id === budget.id} onOpenChange={(open) => {
                      setIsDeleteDialogOpen(open);
                      if (open) setSelectedBudget(budget);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('deleteBudget')}</DialogTitle>
                          <DialogDescription>
                            {t('confirmDeleteBudget')}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            {t('cancel')}
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteBudget} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('delete')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('de-DE', {
                      style: 'currency',
                      currency: budget.currency || 'EUR'
                    }).format(Number(budget.amount) || 0)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{t('spent')}: {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: budget.currency || 'EUR'
                      }).format(usage.spentAmount)}</span>
                      <span>{Math.round(usage.percentage)}%</span>
                    </div>
                    <Progress value={usage.percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Budget Suggestions Dialog */}
        <Dialog open={isSuggestionsDialogOpen} onOpenChange={setIsSuggestionsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>💡 Budget-Vorschläge</DialogTitle>
              <DialogDescription>
                Basierend auf Ihren letzten 3 Monaten Ausgaben schlagen wir folgende Budgets vor:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {budgetSuggestions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  ✅ Alle Kategorien haben bereits Budgets!
                </div>
              ) : (
                budgetSuggestions.map((suggestion) => (
                  <Card key={suggestion.categoryId}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{suggestion.categoryName}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Ø {new Intl.NumberFormat('de-DE', {
                              style: 'currency',
                              currency: suggestion.currency
                            }).format(suggestion.avgMonthlySpending)} / Monat
                            <span className="mx-1">•</span>
                            {suggestion.transactionCount} Transaktionen
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('de-DE', {
                              style: 'currency',
                              currency: suggestion.currency
                            }).format(suggestion.suggestedAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground">empfohlen</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex gap-2 pt-0">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => acceptSuggestion(suggestion)}
                        disabled={isCreating}
                      >
                        {isCreating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        ✓ Erstellen
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setBudgetName(suggestion.categoryName);
                          setBudgetAmount(suggestion.suggestedAmount.toString());
                          setBudgetCurrency(suggestion.currency);
                          setIsSuggestionsDialogOpen(false);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        ✏️ Bearbeiten
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsSuggestionsDialogOpen(false)}>
                Schließen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
