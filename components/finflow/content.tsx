// @ts-nocheck
'use client';

import {
  Calendar,
  CreditCard,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  type LucideIcon
} from "lucide-react"
import List01 from "./list-01"
import List02 from "./list-02"
import List03 from "./list-03"
import MobileDashboardNew from "./mobile-dashboard-new"
import { Account, Transaction, Budget, User } from "@/lib/types"
import useBinancePortfolio from '@/hooks/use-binance-portfolio';
import { PortfolioPieChart } from './PortfolioPieChart';
import { useRef, useEffect, useState } from 'react';
import { PortfolioSparkline } from './PortfolioSparkline';
import { LivePortfolioValueChart } from './LivePortfolioValueChart';
import { useRouter } from 'next/navigation';
import { getTransactionIcon } from '@/lib/transaction-icons';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getTranslatedText } from '@/lib/translation-utils';
import { useCurrency } from './CurrencyContext';
import { useMediaQuery } from '@/hooks/use-mobile';

interface ContentProps {
  user?: User;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
}

export default function Content({ user, accounts, transactions, budgets }: ContentProps) {
  const { currency: userCurrency } = useCurrency();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  // Button handlers
  const handleAddAccount = () => router.push('/accounts');
  const handleSendMoney = () => router.push('/transactions');
  const handleTopUp = () => router.push('/transactions');
  const handleMore = () => router.push('/accounts');
  const handleViewAllTransactions = () => router.push('/transactions');
  const handleViewBudgetDetails = (budgetId: string) => router.push('/budgets');

  // Map API accounts to the format expected by List01
  const mappedAccounts = accounts.map(account => ({
    id: account.id,
    title: getTranslatedText(account.name, account.nameTranslations, language),
    description: account.type,
    balance: new Intl.NumberFormat('en', {
      style: 'currency',
      currency: account.currency || userCurrency
    }).format((Number(account.balance || 0)) / 100), // Balance is in cents, divide by 100 for display
    type: mapAccountType(account.type),
  }));

  // Map account type to the expected type in List01
  function mapAccountType(type: string | null | undefined): "savings" | "checking" | "investment" | "debt" {
    if (!type || typeof type !== 'string') return 'savings';
    switch (type.toLowerCase()) {
      case 'bank':
        return 'checking';
      case 'credit card':
        return 'debt';
      case 'investment':
        return 'investment';
      case 'savings':
      case 'cash':
      default:
        return 'savings';
    }
  }

  // Calculate total balance - only for accounts in the user's selected currency
  const accountsInUserCurrency = accounts.filter(account => account.currency === userCurrency);
  // Balance is in cents, divide by 100 for currency display
  const totalBalance = accountsInUserCurrency.reduce((sum, account) => sum + (Number(account.balance) / 100), 0);
  const formattedTotalBalance = new Intl.NumberFormat('en', { 
    style: 'currency', 
    currency: userCurrency 
  }).format(totalBalance);
  const hasMultipleCurrencies = accounts.length !== accountsInUserCurrency.length;

  // Map API transactions to the format expected by List02
  // Show only the 5 most recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5);
  
  const mappedTransactions = recentTransactions.map(transaction => {
    // Determine icon based on transaction description
    const { icon, category } = getTransactionIcon(
      transaction.description || '',
      transaction.type
    );

    // Format date
    const date = new Date(transaction.transactionDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let timestamp;
    if (date.toDateString() === today.toDateString()) {
      timestamp = `${t('today')}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? t('pm') : t('am')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      timestamp = t('yesterday');
    } else {
      timestamp = date.toLocaleDateString();
    }

    return {
      id: transaction.id,
      title: getTranslatedText(
        transaction.description,
        transaction.descriptionTranslations,
        language
      ) || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} Transaction`,
      amount: new Intl.NumberFormat('en', {
        style: 'currency',
        currency: transaction.currency || userCurrency
      }).format(Number(transaction.amount) || 0),
      type: transaction.type === 'income' ? 'incoming' : 'outgoing' as 'incoming' | 'outgoing',
      category,
      icon,
      timestamp,
      status: 'completed' as 'completed' | 'pending' | 'failed',
    };
  });

  // Map API budgets to the format expected by List03
  const mappedBudgets = budgets.map(budget => {
    // Calculate actual spending for this budget period
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);
    
    // Calculate spent amount - transactions already have amount in currency units (not cents)
    const spent = transactions
      .filter(t => {
        const txDate = new Date(t.transactionDate);
        return t.type === 'expense' && 
               txDate >= budgetStart && 
               txDate <= budgetEnd;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    // Budget amount is already in currency units from the API (backend converts amountCents / 100)
    const budgetAmount = Number(budget.amount);
    
    // Calculate progress percentage
    const progress = budgetAmount > 0 
      ? Math.min(Math.round((spent / budgetAmount) * 100), 100)
      : 0;
    
    return {
      id: budget.id,
      title: getTranslatedText(budget.name, budget.nameTranslations, language),
      subtitle: `${t('budgetFrom')} ${budgetStart.toLocaleDateString()} ${t('to')} ${budgetEnd.toLocaleDateString()}`,
      icon: PiggyBank,
      iconStyle: 'savings',
      date: `${t('target')}: ${budgetEnd.toLocaleDateString()}`,
      amount: new Intl.NumberFormat('en', {
        style: 'currency',
        currency: budget.currency || userCurrency
      }).format(budgetAmount),
      status: progress < 30 ? 'pending' : progress < 70 ? 'in-progress' : 'completed' as 'pending' | 'in-progress' | 'completed',
      progress,
    };
  });

  const { portfolio, loading: binanceLoading, error: binanceError, needsConfiguration } = useBinancePortfolio(300000);

  // Calculate estimated total value
  const estimatedTotal = portfolio
    ? portfolio.reduce((sum: number, a: typeof portfolio[0]) => sum + (a.currentPrice ? parseFloat(a.free) * a.currentPrice : 0), 0)
    : 0;

  const [totalHistory, setTotalHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!binanceLoading && !binanceError) {
      setTotalHistory((prev) => {
        const next = [...prev, estimatedTotal];
        // Keep only the last 100 points for a longer visible history
        return next.slice(-100);
      });
    }
  }, [estimatedTotal, binanceLoading, binanceError]);

  // Prepare assets for live portfolio value chart
  const portfolioAssets = portfolio
    ? portfolio.filter(a => parseFloat(a.free) > 0).map(a => ({ symbol: a.asset, amount: a.free }))
    : [];

  // Calculate total income and expenses for the current month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthTransactions = transactions.filter(t => new Date(t.transactionDate) >= currentMonthStart);
  
  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Mobile budgets with spent calculation
  const mobileBudgets = budgets.map(budget => {
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = new Date(budget.endDate);
    const spent = transactions
      .filter(t => {
        const txDate = new Date(t.transactionDate);
        return t.type === 'expense' && txDate >= budgetStart && txDate <= budgetEnd;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    return {
      id: budget.id,
      name: getTranslatedText(budget.name, budget.nameTranslations, language),
      amount: Number(budget.amount),
      spent,
      currency: budget.currency || userCurrency,
    };
  });

  // Render Mobile Dashboard for mobile devices
  if (isMobile) {
    return (
      <MobileDashboardNew
        accounts={accounts.map(a => ({
          id: a.id,
          name: getTranslatedText(a.name, a.nameTranslations, language),
          type: a.type,
          balance: Number(a.balance),
          currency: a.currency || userCurrency,
        }))}
        transactions={transactions.map(t => ({
          id: t.id,
          description: getTranslatedText(t.description, t.descriptionTranslations, language),
          amount: Number(t.amount),
          type: t.type as 'income' | 'expense',
          category: typeof t.category === 'object' ? t.category?.name : t.category,
          transactionDate: t.transactionDate,
          currency: t.currency || userCurrency,
        }))}
        budgets={mobileBudgets}
        totalBalance={totalBalance}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
      />
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Main Cards Grid - Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Accounts Card */}
        <div className="bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-[#232e40]">
          <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-[#232e40]">
            <h2 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" />
              {t('accounts')}
            </h2>
          </div>
          <List01 
            className="border-0 shadow-none rounded-none" 
            accounts={mappedAccounts} 
            totalBalance={formattedTotalBalance}
            hasMultipleCurrencies={hasMultipleCurrencies}
            userCurrency={userCurrency}
            onAddClick={handleAddAccount}
            onSendClick={handleSendMoney}
            onTopUpClick={handleTopUp}
            onMoreClick={handleMore}
          />
        </div>

        {/* Recent Transactions Card */}
        <div className="bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-[#232e40]">
          <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-[#232e40]">
            <h2 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500" />
              {t('recentTransactions')}
            </h2>
          </div>
          <div className="p-4 lg:p-6">
            <List02 className="h-full" transactions={mappedTransactions} onViewAllClick={handleViewAllTransactions} />
          </div>
        </div>
      </div>

      {/* Budgets Card */}
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-[#232e40]">
        <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-[#232e40]">
          <h2 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500" />
            {t('upcomingEvents')}
          </h2>
        </div>
        <div className="p-4 lg:p-6">
          <List03 items={mappedBudgets} onViewDetailsClick={handleViewBudgetDetails} />
        </div>
      </div>

      {/* Binance Portfolio Card - Mobile Optimized */}
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-[#232e40]">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-[#232e40]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 126.61 126.61" fill="currentColor">
                  <path d="M38.73 53.2l24.59-24.58 24.6 24.6-14.45 14.44-10.15-10.15-10.14 10.15z"/>
                  <path d="M0 63.31l24.58-24.6 14.45 14.45-24.6 24.6z"/>
                  <path d="M38.73 73.41l24.59 24.6 24.6-24.6-14.45-14.45-10.15 10.15-10.14-10.15z"/>
                  <path d="M87.47 63.31l14.45-14.45L126.61 63.3l-24.6 24.6z"/>
                  <path d="M77.83 63.3L63.32 48.78 52.59 59.51l-5.15 5.16 5.15 5.15 10.73 10.73z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                  {t('binancePortfolio')}
                </h2>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                  {t('liveCryptocurrencyHoldings')}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right bg-gray-50 dark:bg-[#232e40] rounded-xl p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('totalValue')}</div>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('de-CH', { style: 'currency', currency: userCurrency, minimumFractionDigits: 2 }).format(estimatedTotal)}
              </div>
            </div>
          </div>
        </div>

        {binanceLoading && (
          <div className="p-8 lg:p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">{t('loadingPortfolio')}</p>
          </div>
        )}
        
        {needsConfiguration && !binanceLoading && (
          <div className="p-6 lg:p-8 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white mb-2">{t('binanceApiKeysNotConfigured') || 'Binance API Keys Not Configured'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
              {t('configureBinanceApiKeys') || 'Add your Binance API keys in Settings to view your portfolio.'}
            </p>
            <a
              href="/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-colors active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('goToSettings') || 'Go to Settings'}
            </a>
          </div>
        )}
        
        {binanceError && !needsConfiguration && !binanceLoading && (
          <div className="p-6 lg:p-8 text-center">
            <div className="text-red-500 dark:text-red-400 text-sm">{binanceError}</div>
          </div>
        )}
        
        {!binanceLoading && !binanceError && !needsConfiguration && (
          <>
            {portfolio.length === 0 ? (
              <div className="p-6 lg:p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#232e40] flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('noAssetsFound')}</p>
                <p className="text-sm mt-1">{t('binancePortfolioEmpty')}</p>
              </div>
            ) : (
              <div className="p-4 lg:p-6">
                {/* Portfolio Chart */}
                <div className="mb-4 lg:mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900/50 dark:to-zinc-800/30 rounded-xl p-4">
                  <PortfolioPieChart data={portfolio.map(a => ({
                    asset: a.asset,
                    value: a.currentPrice ? parseFloat(a.free) * a.currentPrice : 0
                  }))} />
                </div>

                {/* Asset Cards Grid - Mobile Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {portfolio.map((asset) => {
                    const value = asset.currentPrice ? parseFloat(asset.free) * asset.currentPrice : 0;
                    const isPositive = (asset.priceChange24h || 0) > 0;
                    const isNegative = (asset.priceChange24h || 0) < 0;
                    
                    return (
                      <div 
                        key={asset.asset}
                        className="bg-white dark:bg-[#232e40] rounded-xl p-4 border border-gray-100 dark:border-[#2d3b4e] hover:border-gray-200 dark:hover:border-[#3d4b5e] transition-all active:scale-[0.98]"
                      >
                        {/* Header with Icon and 24h Change */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                              {asset.asset.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white text-sm">{asset.asset}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {parseFloat(asset.free).toFixed(4)}
                              </div>
                            </div>
                          </div>
                          {asset.priceChange24h !== null && (
                            <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold ${
                              isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                              isNegative ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                              'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}>
                              {isPositive ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : isNegative ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : null}
                              {isPositive ? '+' : ''}{asset.priceChange24h?.toFixed(2)}%
                            </div>
                          )}
                        </div>

                        {/* Price and Value */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('currentPrice')}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {asset.currentPrice !== null
                                ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: userCurrency, minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(asset.currentPrice)
                                : '-'
                              }
                            </span>
                          </div>
                          <div className="pt-2 border-t border-gray-100 dark:border-[#2d3b4e] flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('totalValue')}</span>
                            <span className="text-base font-bold text-gray-900 dark:text-white">
                              {new Intl.NumberFormat('de-CH', { style: 'currency', currency: userCurrency, minimumFractionDigits: 2 }).format(value)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
