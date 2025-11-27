"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Layout from "@/components/finflow/layout";
import MobileAnalytics from "@/components/finflow/mobile-analytics";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from '@/lib/utils';
import { accountsApi, transactionsApi, tradingAgentApi, budgetsApi, categoriesApi } from '@/lib/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Bitcoin,
  PieChart as PieChartIcon,
  Target
} from 'lucide-react';
import { useCurrency } from '@/components/finflow/CurrencyContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useMediaQuery } from '@/hooks/use-mobile';

interface BalanceData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

interface CategorySpending {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface Category {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  amountCents: number;
  type: 'income' | 'expense' | 'transfer';
  category?: Category;
  date: string;
}

interface CryptoHolding {
  asset: string;
  symbol: string;
  amount: number;
  quantity: number;
  value: number;
  valueEur: number;
  priceEur: number;
  change24h: number;
  priceChange24h: number;
  currentPrice: number;
  monitoredBy?: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { currency: selectedCurrency } = useCurrency();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('12'); // months
  const [balanceData, setBalanceData] = useState<BalanceData[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [cryptoPortfolio, setCryptoPortfolio] = useState<CryptoHolding[]>([]);
  const [totalCryptoValue, setTotalCryptoValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    amount: '',
    categoryId: 'none',
    period: 'monthly',
  });
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedAccount, timeRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load accounts
      const accountsRes = await accountsApi.list();
      const loadedAccounts = accountsRes.accounts || [];
      setAccounts(loadedAccounts);

      // Load categories
      const categoriesRes = await categoriesApi.getAll();
      setCategories(categoriesRes || []);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - parseInt(timeRange));

      // Load transactions
      const transactionsRes = await transactionsApi.list({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        accountId: selectedAccount !== 'all' ? selectedAccount : undefined,
      });

      const transactions = transactionsRes.transactions || [];

      // Calculate income and expenses
      let income = 0;
      let expenses = 0;
      const categoryMap = new Map<string, number>();
      const categoryColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

      transactions.forEach((tx: Transaction) => {
        const amount = Math.abs(tx.amountCents / 100);

        if (tx.type === 'income') {
          income += amount;
        } else if (tx.type === 'expense') {
          expenses += amount;

          // Track category spending
          const categoryName = tx.category?.name || t('other');
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + amount);
        }
      });

      setTotalIncome(income);
      setTotalExpenses(expenses);
      setNetBalance(income - expenses);

      // Convert category map to array and sort
      const categories = Array.from(categoryMap.entries())
        .map(([name, amount], index) => ({
          name,
          amount,
          percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
          color: categoryColors[index % categoryColors.length],
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setCategorySpending(categories);

      // Generate balance chart data
      const chartData = generateBalanceChart(transactions, startDate, endDate);
      setBalanceData(chartData);

      // Load crypto portfolio
      try {
        const cryptoRes = await tradingAgentApi.getPortfolioAnalysis();
        const portfolio = cryptoRes.portfolio || [];
        setCryptoPortfolio(portfolio);

        const cryptoTotal = portfolio.reduce((sum: number, asset: CryptoHolding) => sum + (asset.valueEur || asset.value || 0), 0);
        setTotalCryptoValue(cryptoTotal);
      } catch (error) {
        console.error('Error loading crypto portfolio:', error);
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBalanceChart = (transactions: Transaction[], startDate: Date, endDate: Date) => {
    const monthlyData = new Map<string, { income: number; expenses: number }>();

    // Initialize all months in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, { income: 0, expenses: 0 });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Fill with transaction data
    transactions.forEach((tx: Transaction) => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData.has(monthKey)) {
        const data = monthlyData.get(monthKey)!;
        const amount = Math.abs(tx.amountCents / 100);

        if (tx.type === 'income') {
          data.income += amount;
        } else if (tx.type === 'expense') {
          data.expenses += amount;
        }
      }
    });

    // Convert to array
    const result: BalanceData[] = [];
    let cumulativeBalance = 0;

    const sortedKeys = Array.from(monthlyData.keys()).sort();
    sortedKeys.forEach(key => {
      const data = monthlyData.get(key)!;
      cumulativeBalance += data.income - data.expenses;

      // Format date nicely
      const [year, month] = key.split('-');
      const monthNames = [t('jan'), t('feb'), t('mar'), t('apr'), t('mayShort'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
      const formattedDate = `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;

      result.push({
        date: formattedDate,
        income: data.income,
        expenses: data.expenses,
        balance: cumulativeBalance,
      });
    });

    return result;
  };

  const handleCreateBudget = async () => {
    try {
      setIsCreatingBudget(true);

      await budgetsApi.create({
        name: budgetForm.name,
        amount: parseFloat(budgetForm.amount),
        categoryId: budgetForm.categoryId !== 'none' ? budgetForm.categoryId : undefined,
        period: budgetForm.period,
        currency: selectedCurrency,
      });

      // Reset form and close dialog
      setBudgetForm({ name: '', amount: '', categoryId: 'none', period: 'monthly' });
      setIsBudgetDialogOpen(false);

      // Show success message (you can add a toast here)
      alert(t('budgetCreated'));
    } catch (error) {
      console.error('Error creating budget:', error);
      alert(t('errorCreatingBudget'));
    } finally {
      setIsCreatingBudget(false);
    }
  };

  const isMobile = useMediaQuery("(max-width: 1023px)");

  if (isLoading) {
    return (
      <Layout user={user}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  // Render mobile version
  if (isMobile) {
    return (
      <MobileAnalytics
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netBalance={netBalance}
        categorySpending={categorySpending}
        cryptoPortfolio={cryptoPortfolio}
        totalCryptoValue={totalCryptoValue}
        balanceData={balanceData}
        isLoading={isLoading}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    );
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto py-10 space-y-6">
        <h1 className="text-3xl font-bold">{t('analytics')}</h1>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="w-64">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t('accounts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {accounts.length} {accounts.length === 1 ? t('account') : t('accounts')}
                </SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('oneMonth')}</SelectItem>
                <SelectItem value="2">{t('twoMonths')}</SelectItem>
                <SelectItem value="3">{t('threeMonths')}</SelectItem>
                <SelectItem value="6">{t('sixMonths')}</SelectItem>
                <SelectItem value="12">{t('oneYear')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <h2 className="text-xl font-semibold mb-6">{t('balance')}</h2>

          {/* Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-gray-300">{t('income')}</span>
              </div>
              <p className="text-3xl font-bold text-cyan-400">
                {formatCurrency(totalIncome, selectedCurrency)}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-gray-300">{t('expenses')}</span>
              </div>
              <p className="text-3xl font-bold text-rose-400">
                {formatCurrency(totalExpenses, selectedCurrency)}
              </p>
            </div>

            <div className={`rounded-lg p-4 border ${netBalance >= 0 ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-rose-500/20 border-rose-500/30'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${netBalance >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                  {netBalance >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <span className="text-gray-300">{t('balance')}</span>
              </div>
              <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(netBalance, selectedCurrency)}
              </p>
            </div>
          </div>

          {/* Chart Tabs */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="bg-white/10 border border-white/20">
              <TabsTrigger value="timeline" className="data-[state=active]:bg-white/20">
                {t('timeline')}
              </TabsTrigger>
              <TabsTrigger value="comparison" className="data-[state=active]:bg-white/20">
                {t('comparison')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              {balanceData.length > 0 ? (
                <div className="bg-white/5 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={balanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="date" stroke="#fff" />
                      <YAxis stroke="#fff" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        formatter={(value: number) => formatCurrency(value, selectedCurrency)}
                      />
                      <Legend />
                      <Bar dataKey="income" name={t('income')} fill="#22d3ee" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name={t('expenses')} fill="#fb7185" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  {t('noDataForSelectedPeriod')}
                </div>
              )}
            </TabsContent>

            <TabsContent value="comparison" className="mt-6">
              {balanceData.length > 0 ? (
                <div className="bg-white/5 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={balanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="date" stroke="#fff" />
                      <YAxis stroke="#fff" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        formatter={(value: number) => formatCurrency(value, selectedCurrency)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        name={t('balance')}
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  {t('noDataForSelectedPeriod')}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Spending */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              {t('topSpendingCategories')}
            </h2>
            <div className="space-y-4">
              {categorySpending.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t('noExpensesInPeriod')}
                </div>
              ) : (
                categorySpending.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(category.amount, selectedCurrency)} ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Budget Card */}
          <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              {t('budget')}
            </h2>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 relative">
                <div className="w-28 h-28 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                  <Target className="w-12 h-12 text-amber-500" />
                </div>
              </div>
              <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="px-6 py-2 border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors"
                  >
                    {t('createBudget')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t('createNewBudget')}</DialogTitle>
                    <DialogDescription>
                      {t('createNewBudgetForControl')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="budget-name">{t('budgetName')}</Label>
                      <Input
                        id="budget-name"
                        placeholder={t('monthlyGroceryBudget')}
                        value={budgetForm.name}
                        onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budget-amount">{t('amount')} ({selectedCurrency})</Label>
                      <Input
                        id="budget-amount"
                        type="number"
                        step="0.01"
                        placeholder="500"
                        value={budgetForm.amount}
                        onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budget-category">{t('categoryOptional')}</Label>
                      <Select
                        value={budgetForm.categoryId}
                        onValueChange={(value) => setBudgetForm({ ...budgetForm, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('noCategory')}</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budget-period">{t('period')}</Label>
                      <Select
                        value={budgetForm.period}
                        onValueChange={(value) => setBudgetForm({ ...budgetForm, period: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t('daily')}</SelectItem>
                          <SelectItem value="weekly">{t('weekly')}</SelectItem>
                          <SelectItem value="monthly">{t('monthly')}</SelectItem>
                          <SelectItem value="quarterly">{t('quarterly')}</SelectItem>
                          <SelectItem value="yearly">{t('yearly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsBudgetDialogOpen(false)}
                      disabled={isCreatingBudget}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      type="submit"
                      onClick={handleCreateBudget}
                      disabled={isCreatingBudget || !budgetForm.name || !budgetForm.amount}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {isCreatingBudget ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('creating')}
                        </>
                      ) : (
                        t('createBudget')
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>

        {/* Crypto Portfolio */}
        {cryptoPortfolio.length > 0 && (
          <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bitcoin className="w-5 h-5 text-orange-500" />
                {t('cryptoPortfolio')}
              </h2>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t('totalValueCrypto')}</p>
                <p className="text-2xl font-bold text-orange-500">
                  {formatCurrency(totalCryptoValue, selectedCurrency)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cryptoPortfolio.map((asset) => (
                <div key={asset.asset} className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-lg">{asset.asset}</p>
                      <p className="text-sm text-muted-foreground">
                        {asset.quantity.toFixed(6)}
                      </p>
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded ${asset.priceChange24h >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {asset.priceChange24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span className="text-xs font-medium">
                        {asset.priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold mb-1">
                    {formatCurrency(asset.valueEur, selectedCurrency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @ {formatCurrency(asset.priceEur, selectedCurrency)}
                  </p>
                  {asset.monitoredBy && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-muted-foreground">
                        🤖 {t('monitoredBy')}: {asset.monitoredBy}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
