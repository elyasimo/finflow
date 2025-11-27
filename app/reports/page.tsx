// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useBudgets } from '@/hooks/use-budgets';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, PieChart, LineChart, Calendar, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
import Layout from '@/components/finflow/layout';
import MobileReports from '@/components/finflow/mobile-reports';
import { DatePicker } from '@/components/ui/date-picker';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer as ReResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useCurrency } from '@/components/finflow/CurrencyContext';

export default function ReportsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { budgets, isLoading: budgetsLoading } = useBudgets();
  const router = useRouter();
  const { t } = useLanguage();
  const { currency: userCurrency } = useCurrency();

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading state while checking authentication or fetching data
  if (authLoading || accountsLoading || transactionsLoading || budgetsLoading) {
    return <div className="flex h-screen items-center justify-center">{t('loading')}</div>;
  }

  // If not authenticated, don't render anything (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Filter transactions based on selected period and account
  const filteredTransactions = transactions?.filter(transaction => {
    const transactionDate = new Date(transaction.transactionDate);
    const periodStart = startOfMonth(selectedMonth);
    const periodEnd = endOfMonth(selectedMonth);
    
    const isInPeriod = isWithinInterval(transactionDate, {
      start: periodStart,
      end: periodEnd,
    });
    
    const isInAccount = selectedAccount === 'all' || transaction.accountId === selectedAccount;
    
    return isInPeriod && isInAccount;
  }) || [];

  // Calculate income, expenses, and balance - only for transactions in user's currency
  const transactionsInUserCurrency = filteredTransactions.filter(t => t.currency === userCurrency);
  const hasMultipleCurrencies = filteredTransactions.length !== transactionsInUserCurrency.length;
  
  const income = transactionsInUserCurrency
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const expenses = transactionsInUserCurrency
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const balance = income - expenses;

  // Group transactions by type for pie chart - only user currency
  const transactionsByType = transactionsInUserCurrency.reduce((acc: Record<string, number>, transaction) => {
    const type = transaction.type;
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type] += Number(transaction.amount);
    return acc;
  }, {});

  // Calculate income trends for last 6 months
  const incomeTrends = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(selectedMonth, 5 - i);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthIncome = transactions?.filter(t => {
      const tDate = new Date(t.transactionDate);
      return t.type === 'income' && 
             t.currency === userCurrency &&
             isWithinInterval(tDate, { start: monthStart, end: monthEnd }) &&
             (selectedAccount === 'all' || t.accountId === selectedAccount);
    }).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    return {
      month: format(month, 'MMM yyyy'),
      income: monthIncome
    };
  });

  // Group expenses by category for pie chart - only user currency
  const expensesByCategory = transactionsInUserCurrency
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, transaction) => {
      const categoryName = transaction.category?.name || t('uncategorized');
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += Number(transaction.amount);
      return acc;
    }, {});

  // Calculate budget performance
  const budgetPerformance = budgets?.filter(budget => {
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);
    const periodStart = startOfMonth(selectedMonth);
    const periodEnd = endOfMonth(selectedMonth);
    
    // Check if budget overlaps with selected period
    return budgetStart <= periodEnd && budgetEnd >= periodStart;
  }).map(budget => {
    const budgetAmount = Number(budget.amount);
    const spent = filteredTransactions
      .filter(t => {
        const tDate = new Date(t.transactionDate);
        const budgetStart = new Date(budget.startDate);
        const budgetEnd = new Date(budget.endDate);
        return t.type === 'expense' && 
               t.currency === userCurrency &&
               isWithinInterval(tDate, { start: budgetStart, end: budgetEnd });
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      name: budget.name,
      budget: budgetAmount,
      spent: spent,
      remaining: Math.max(0, budgetAmount - spent)
    };
  }) || [];

  const isMobile = useMediaQuery("(max-width: 1023px)");

  // Render mobile version
  if (isMobile) {
    return (
      <MobileReports
        income={income}
        expenses={expenses}
        balance={balance}
        transactions={filteredTransactions}
        budgetPerformance={budgetPerformance.map(b => ({ ...b, id: b.name }))}
        expensesByCategory={expensesByCategory}
        incomeTrends={incomeTrends}
        isLoading={false}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />
    );
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('financialReports')}</h1>
          <div className="flex space-x-4">
            <div className="w-40">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectAccount')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allAccounts')}</SelectItem>
                  {accounts?.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <DatePicker
                selected={selectedMonth}
                onSelect={(date) => date && setSelectedMonth(date)}
              />
            </div>
          </div>
        </div>

        {hasMultipleCurrencies && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              ⚠️ Multiple currencies detected. Showing only {userCurrency} transactions in summaries.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalIncome')}</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                {new Intl.NumberFormat('en', { style: 'currency', currency: userCurrency }).format(income)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('for')} {format(selectedMonth, 'MMMM yyyy')}
                {hasMultipleCurrencies && ` (${userCurrency})`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalExpenses')}</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {new Intl.NumberFormat('en', { style: 'currency', currency: userCurrency }).format(expenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('for')} {format(selectedMonth, 'MMMM yyyy')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('netBalance')}</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {new Intl.NumberFormat('en', { style: 'currency', currency: userCurrency }).format(balance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('for')} {format(selectedMonth, 'MMMM yyyy')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="income">{t('income')}</TabsTrigger>
            <TabsTrigger value="expenses">{t('expenses')}</TabsTrigger>
            <TabsTrigger value="budgets">{t('budgets')}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('incomeVsExpenses')}</CardTitle>
                  <CardDescription>
                    {t('comparisonFor')} {format(selectedMonth, 'MMMM yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] flex items-center justify-center">
                    <ReResponsiveContainer width="100%" height={300}>
                      <ReBarChart data={[{ name: t('income'), value: income }, { name: t('expenses'), value: expenses }]}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ReTooltip formatter={(value: number) => new Intl.NumberFormat('en', { style: 'currency', currency: userCurrency }).format(value)} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </ReBarChart>
                    </ReResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('transactionDistribution')}</CardTitle>
                  <CardDescription>
                    {t('byTransactionType')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] flex items-center justify-center">
                    <ReResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={Object.entries(transactionsByType).map(([type, value]) => ({ name: type, value }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {Object.entries(transactionsByType).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#0088FE', '#FF8042', '#00C49F', '#FFBB28'][index % 4]} />
                          ))}
                        </Pie>
                        <Legend />
                        <ReTooltip formatter={(value: number) => new Intl.NumberFormat('en', { style: 'currency', currency: userCurrency }).format(value)} />
                      </RePieChart>
                    </ReResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="income" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('incomeTrends')}</CardTitle>
                <CardDescription>
                  {t('monthlyIncomeOverLast')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[400px]">
                  <ReResponsiveContainer width="100%" height={400}>
                    <ReBarChart data={incomeTrends}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ReTooltip formatter={(value: number) => new Intl.NumberFormat('en', { style: 'currency', currency: userCurrency }).format(value)} />
                      <Bar dataKey="income" fill="#10b981" />
                    </ReBarChart>
                  </ReResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('expenseBreakdown')}</CardTitle>
                <CardDescription>
                  {t('byCategory')} {format(selectedMonth, 'MMMM yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[400px]">
                  {Object.keys(expensesByCategory).length > 0 ? (
                    <ReResponsiveContainer width="100%" height={400}>
                      <RePieChart>
                        <Pie
                          data={Object.entries(expensesByCategory).map(([category, value]) => ({ name: category, value }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          fill="#8884d8"
                          label
                        >
                          {Object.entries(expensesByCategory).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6'][index % 6]} />
                          ))}
                        </Pie>
                        <Legend />
                        <ReTooltip formatter={(value: number) => new Intl.NumberFormat('en', { style: 'currency', currency: userCurrency }).format(value)} />
                      </RePieChart>
                    </ReResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {t('noExpenseDataForPeriod')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="budgets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('budgetPerformance')}</CardTitle>
                <CardDescription>
                  {t('actualSpendingVsBudget')} {format(selectedMonth, 'MMMM yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[400px]">
                  {budgetPerformance.length > 0 ? (
                    <ReResponsiveContainer width="100%" height={400}>
                      <ReBarChart data={budgetPerformance}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ReTooltip formatter={(value: number) => new Intl.NumberFormat('en', { style: 'currency', currency: userCurrency }).format(value)} />
                        <Legend />
                        <Bar dataKey="budget" fill="#3b82f6" name={t('budget')} />
                        <Bar dataKey="spent" fill="#ef4444" name={t('spent')} />
                        <Bar dataKey="remaining" fill="#10b981" name={t('remaining')} />
                      </ReBarChart>
                    </ReResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {t('noBudgetsForPeriod')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
