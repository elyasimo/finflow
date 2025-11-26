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
  function mapAccountType(type: string): "savings" | "checking" | "investment" | "debt" {
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

  const { portfolio, loading: binanceLoading, error: binanceError } = useBinancePortfolio(300000);

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#232e40] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#2d3b4e]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2 ">
            <Wallet className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
            {t('accounts')}
          </h2>
          <div className="flex-1">
            <List01 
              className="h-full" 
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
        </div>
        <div className="bg-white dark:bg-[#232e40] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#2d3b4e]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white text-left flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
              {t('recentTransactions')}
            </h2>
          </div>
          <div className="flex-1">
            <List02 className="h-full" transactions={mappedTransactions} onViewAllClick={handleViewAllTransactions} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#232e40] rounded-xl p-6 flex flex-col items-start justify-start border border-gray-200 dark:border-[#2d3b4e]">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
          {t('upcomingEvents')}
        </h2>
        <List03 items={mappedBudgets} onViewDetailsClick={handleViewBudgetDetails} />
      </div>

      {/* Binance Portfolio Card - Only shown when no API key format error */}
      {(!binanceError || !binanceError.toLowerCase().includes('format')) && (
      <div className="bg-white dark:bg-[#232e40] rounded-xl border border-gray-200 dark:border-[#2d3b4e] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-[#2d3b4e]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 126.61 126.61" fill="currentColor">
                  <path d="M38.73 53.2l24.59-24.58 24.6 24.6-14.45 14.44-10.15-10.15-10.14 10.15z"/>
                  <path d="M0 63.31l24.58-24.6 14.45 14.45-24.6 24.6z"/>
                  <path d="M38.73 73.41l24.59 24.6 24.6-24.6-14.45-14.45-10.15 10.15-10.14-10.15z"/>
                  <path d="M87.47 63.31l14.45-14.45L126.61 63.3l-24.6 24.6z"/>
                  <path d="M77.83 63.3L63.32 48.78 52.59 59.51l-5.15 5.16 5.15 5.15 10.73 10.73z"/>
                </svg>
                {t('binancePortfolio')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('liveCryptocurrencyHoldings')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('de-CH', { style: 'currency', currency: userCurrency, minimumFractionDigits: 2 }).format(estimatedTotal)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('totalValue')}</div>
            </div>
          </div>
        </div>

        {binanceLoading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">{t('loadingPortfolio')}</p>
          </div>
        )}
        
        {binanceError && (
          <div className="p-8 text-center">
            <div className="text-red-500 dark:text-red-400">{binanceError}</div>
          </div>
        )}
        
        {!binanceLoading && !binanceError && (
          <>
            {portfolio.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="font-medium">{t('noAssetsFound')}</p>
                <p className="text-sm mt-1">{t('binancePortfolioEmpty')}</p>
              </div>
            ) : (
              <div className="p-6">
                {/* Portfolio Chart */}
                <div className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900/50 dark:to-zinc-800/30 rounded-lg p-4">
                  <PortfolioPieChart data={portfolio.map(a => ({
                    asset: a.asset,
                    value: a.currentPrice ? parseFloat(a.free) * a.currentPrice : 0
                  }))} />
                </div>

                {/* Asset Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio.map((asset) => {
                    const value = asset.currentPrice ? parseFloat(asset.free) * asset.currentPrice : 0;
                    const baseSymbol = asset.asset.replace('USDT', '').toLowerCase();
                    const logoUrl = `/logos/cryptocurrency/${baseSymbol}.png`;
                    const isPositive = (asset.priceChange24h || 0) > 0;
                    const isNegative = (asset.priceChange24h || 0) < 0;
                    
                    return (
                      <div 
                        key={asset.asset}
                        className="bg-white dark:bg-zinc-900/50 rounded-lg p-4 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all hover:shadow-md"
                      >
                        {/* Header with Icon and 24h Change */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center overflow-hidden">
                              {/* Fallback to SVG icon */}
                              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">{asset.asset}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {parseFloat(asset.free).toFixed(6)}
                              </div>
                            </div>
                          </div>
                          {asset.priceChange24h !== null && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              isNegative ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                              'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            }`}>
                              {isPositive ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : isNegative ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : null}
                              {isPositive ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                            </div>
                          )}
                        </div>

                        {/* Price and Value */}
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{t('currentPrice')}</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {asset.currentPrice !== null
                                ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: userCurrency, minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(asset.currentPrice)
                                : '-'
                              }
                            </div>
                          </div>
                          <div className="pt-2 border-t border-gray-200 dark:border-zinc-800">
                            <div className="text-xs text-gray-600 dark:text-gray-400">{t('totalValue')}</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {new Intl.NumberFormat('de-CH', { style: 'currency', currency: userCurrency, minimumFractionDigits: 2 }).format(value)}
                            </div>
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
      )}
    </div>
  )
}
