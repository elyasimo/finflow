'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useBudgets } from '@/hooks/use-budgets';
import Dashboard from "@/components/finflow/dashboard";
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { budgets, isLoading: budgetsLoading } = useBudgets();
  const router = useRouter();
  const { t } = useLanguage();

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

  return (
    <Dashboard
      user={user}
      accounts={accounts || []}
      transactions={transactions || []}
      budgets={budgets || []}
    />
  );
}
