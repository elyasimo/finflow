"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/use-transactions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Transaction } from "@/lib/types";
import { transactionsApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useAccounts } from "@/hooks/use-accounts";
import { useBudgets } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import Layout from "@/components/finflow/layout";
import MobileTransactionsPage from "@/components/finflow/mobile-transactions-page";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { de, fr, ar, enUS } from 'date-fns/locale';
import { getTransactionIcon } from '@/lib/transaction-icons';
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getTranslatedText } from '@/lib/translation-utils';
import { useCurrency } from '@/components/finflow/CurrencyContext';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { useMediaQuery } from '@/hooks/use-mobile';

export default function TransactionsPage() {
  const { transactions, isLoading, createTransaction, isCreating, updateTransaction, deleteTransaction, isDeleting } = useTransactions();
  const { accounts } = useAccounts();
  const { budgets } = useBudgets();
  const { categories } = useCategories();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { currency: userCurrency } = useCurrency();
  const { convert, convertAndFormat } = useExchangeRates();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  // Get date-fns locale based on current language
  const getDateLocale = () => {
    switch (language) {
      case 'de': return de;
      case 'fr': return fr;
      case 'ar': return ar;
      default: return enUS;
    }
  };

  // State for expanded months
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [monthToDelete, setMonthToDelete] = useState<{ monthKey: string; monthLabel: string; count: number } | null>(null);

  // Toggle month expansion
  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  // Delete all transactions for a month
  const handleDeleteMonth = async (monthKey: string) => {
    if (!monthToDelete) return;
    
    try {
      const monthTransactions = transactions?.filter(t => {
        const date = new Date(t.transactionDate);
        return format(date, 'yyyy-MM') === monthKey;
      }) || [];

      // Delete each transaction
      for (const transaction of monthTransactions) {
        await deleteTransaction(transaction.id);
      }

      setMonthToDelete(null);
    } catch (error) {
      console.error('Error deleting month transactions:', error);
      alert(`Failed to delete transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Group transactions by month - use useMemo to recalculate when userCurrency changes
  const monthlyGroups = useMemo(() => {
    console.log('🔄 Recalculating monthlyGroups with userCurrency:', userCurrency);
    
    if (!transactions) {
      return [];
    }

    const grouped = new Map<string, Transaction[]>();

    transactions.forEach(transaction => {
      if (!transaction.transactionDate) {
        return;
      }

      const date = new Date(transaction.transactionDate);
      if (isNaN(date.getTime())) {
        return;
      }

      const monthKey = format(date, 'yyyy-MM');

      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(transaction);
    });

    // Sort by month (newest first) and sort transactions within each month
    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, transactions]) => {
        // Convert ALL transactions to user currency
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => {
            const converted = convert(Number(t.amount), t.currency || userCurrency, userCurrency);
            console.log(`💰 Income: Convert ${t.amount} ${t.currency} -> ${converted} ${userCurrency}`);
            return sum + converted;
          }, 0);
        
        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => {
            const converted = convert(Number(t.amount), t.currency || userCurrency, userCurrency);
            console.log(`💸 Expense: Convert ${t.amount} ${t.currency} -> ${converted} ${userCurrency}`);
            return sum + converted;
          }, 0);
        
        return {
          monthKey,
          monthLabel: format(new Date(monthKey + '-01'), 'MMMM yyyy', { locale: getDateLocale() }),
          transactions: transactions.sort((a, b) =>
            new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
          ),
          income,
          expenses,
          totalTransactions: transactions.length,
        };
      });
  }, [transactions, userCurrency, convert]);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedAccountForImport, setSelectedAccountForImport] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [newTransaction, setNewTransaction] = useState<{
    accountId: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description: string;
    categoryId: string;
    currency: string;
    transactionDate: Date;
  }>({
    accountId: "",
    amount: 0,
    type: "expense",
    description: "",
    categoryId: "",
    currency: userCurrency,
    transactionDate: new Date(),
  });

  // Handle CSV file upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setImportError(null);
    }
  };

  // Import CSV with error handling
  const importCsv = async () => {
    if (!csvFile) return;

    if (!selectedAccountForImport) {
      setImportError('Bitte wählen Sie ein Konto für den Import aus');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      // Read file content as text
      const text = await csvFile.text();

      const result = await transactionsApi.importCsv({
        data: text,
        accountId: selectedAccountForImport
      });

      console.log('Import result:', result);

      setIsImportOpen(false);
      setCsvFile(null);
      setSelectedAccountForImport("");

      // Reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Fehler beim Importieren:', error);
      setImportError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Import');
    } finally {
      setIsImporting(false);
    }
  };

  // Create transaction with error handling
  const handleCreateTransaction = async () => {
    // Validate required fields
    if (!newTransaction.accountId) {
      alert('Bitte wählen Sie ein Konto aus');
      return;
    }
    if (!newTransaction.amount || newTransaction.amount <= 0) {
      alert('Bitte geben Sie einen gültigen Betrag ein');
      return;
    }
    if (!newTransaction.description.trim()) {
      alert('Bitte geben Sie eine Beschreibung ein');
      return;
    }

    try {
    await createTransaction({
      accountId: newTransaction.accountId,
      amount: newTransaction.amount,
      type: newTransaction.type,
      currency: newTransaction.currency,
      description: newTransaction.description,
        categoryId: newTransaction.categoryId || undefined,
      transactionDate: newTransaction.transactionDate
    });

    setIsCreateOpen(false);
    setNewTransaction({
      accountId: "",
      amount: 0,
      type: "expense",
      description: "",
        categoryId: "",
      currency: userCurrency,
      transactionDate: new Date(),
    });
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert(`Erstellen fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  // Update transaction with error handling
  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    try {
    await updateTransaction({
      id: selectedTransaction.id,
      data: {
        accountId: newTransaction.accountId,
        amount: newTransaction.amount,
        type: newTransaction.type,
        currency: newTransaction.currency,
        description: newTransaction.description,
          categoryId: newTransaction.categoryId,
        transactionDate: newTransaction.transactionDate
      }
    });

    setIsEditOpen(false);
    setSelectedTransaction(null);
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert(`Aktualisieren fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  // Import CSV handler for mobile
  const handleMobileImport = async (file: File) => {
    if (!accounts || accounts.length === 0) {
      throw new Error('Kein Konto verfügbar');
    }
    
    const text = await file.text();
    await transactionsApi.importCsv({
      data: text,
      accountId: accounts[0].id // Use first account for import
    });
    
    window.location.reload();
  };

  // Render mobile version
  if (isMobile) {
    return (
      <MobileTransactionsPage
        transactions={transactions?.map(t => ({
          id: t.id,
          description: getTranslatedText(t.description, t.descriptionTranslations, language),
          amount: Number(t.amount),
          type: t.type as 'income' | 'expense',
          category: typeof t.category === 'object' ? t.category?.name : t.category,
          transactionDate: t.transactionDate,
          currency: t.currency || userCurrency,
          accountId: t.accountId,
          note: (t as any).note,
          merchant: (t as any).merchant,
        })) || []}
        accounts={accounts?.map(a => ({
          id: a.id,
          name: getTranslatedText(a.name, a.nameTranslations, language),
          currency: a.currency || userCurrency,
        })) || []}
        categories={categories?.map(c => ({
          id: c.id,
          name: getTranslatedText(c.name, c.nameTranslations, language),
        })) || []}
        isLoading={isLoading}
        onAddTransaction={async (data) => {
          await createTransaction({
            accountId: data.accountId,
            amount: data.amount,
            type: data.type,
            currency: userCurrency,
            description: data.description,
            categoryId: data.category || undefined,
            transactionDate: new Date(data.transactionDate),
          });
        }}
        onEditTransaction={async (id, data) => {
          await updateTransaction({
            id,
            data: {
              accountId: data.accountId,
              amount: data.amount,
              type: data.type,
              currency: userCurrency,
              description: data.description,
              categoryId: data.category || undefined,
              transactionDate: new Date(data.transactionDate),
            }
          });
        }}
        onDeleteTransaction={async (id) => {
          await deleteTransaction(id);
        }}
        onImport={handleMobileImport}
        user={user || undefined}
      />
    );
  }

  return (
    <Layout user={user}>
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('transactions')}</h1>
        <div className="flex space-x-2">
            <Button onClick={() => setIsCreateOpen(true)} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('addTransaction')
              )}
          </Button>
            <Button onClick={() => setIsImportOpen(true)} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('importCSV')
              )}
          </Button>
        </div>
      </div>

        {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('importCSV')}</DialogTitle>
            <DialogDescription>
                {t('selectAccount')}
            </DialogDescription>
          </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="importAccount">{t('account')}</Label>
              <Select
                value={selectedAccountForImport}
                onValueChange={setSelectedAccountForImport}
                disabled={isImporting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectAccount')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Alle importierten Transaktionen werden diesem Konto zugeordnet.
              </p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="csvFile">CSV-Datei</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  disabled={isImporting}
                />
              </div>
              {importError && (
                <p className="text-sm text-red-500">{importError}</p>
            )}
          </div>
          <DialogFooter>
              <Button onClick={() => {
                setIsImportOpen(false);
                setSelectedAccountForImport("");
                setCsvFile(null);
                setImportError(null);
              }} variant="outline">
              Abbrechen
            </Button>
              <Button onClick={importCsv} disabled={!csvFile || !selectedAccountForImport || isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  'Importieren'
                )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Create/Edit Transaction Dialog */}
        <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
          }
        }}>
        <DialogContent>
          <DialogHeader>
              <DialogTitle>
                {isEditOpen ? 'Transaktion bearbeiten' : 'Neue Transaktion'}
              </DialogTitle>
          </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account">{t('account')}</Label>
              <Select
                value={newTransaction.accountId || ""}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, accountId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectAccount')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget">Budget (optional)</Label>
              <Select
                value={(() => {
                  if (!newTransaction.transactionDate || !budgets) return "none";
                  const txDate = new Date(newTransaction.transactionDate);
                  
                  // Find matching budget by category and date
                  const matchingBudget = budgets.find(b => {
                    if (b.categoryId && newTransaction.categoryId && b.categoryId === newTransaction.categoryId) {
                      if (b.startDate && b.endDate) {
                        const start = new Date(b.startDate);
                        const end = new Date(b.endDate);
                        return txDate >= start && txDate <= end;
                      }
                    }
                    return false;
                  });
                  
                  return matchingBudget?.id || "none";
                })()}
                onValueChange={(budgetId) => {
                  // When budget is selected, set the category automatically
                  if (budgetId === "none") {
                    // Clear category if "Kein Budget" is selected
                    return;
                  }
                  const selectedBudget = budgets?.find(b => b.id === budgetId);
                  if (selectedBudget?.categoryId) {
                    setNewTransaction({ 
                      ...newTransaction, 
                      categoryId: selectedBudget.categoryId 
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kein Budget / Budget wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Budget</SelectItem>
                  {budgets
                    ?.filter(b => {
                      // Only show budgets that match the transaction date
                      if (!newTransaction.transactionDate) return true;
                      if (!b.startDate || !b.endDate) return false;
                      const txDate = new Date(newTransaction.transactionDate);
                      const start = new Date(b.startDate);
                      const end = new Date(b.endDate);
                      return txDate >= start && txDate <= end;
                    })
                    .map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Wählen Sie ein Budget aus, um die Kategorie automatisch zu setzen.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">{t('type')}</Label>
              <Select
                value={newTransaction.type}
                  onValueChange={(value: 'income' | 'expense' | 'transfer') =>
                    setNewTransaction({ ...newTransaction, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="income">{t('income')}</SelectItem>
                  <SelectItem value="expense">{t('expense')}</SelectItem>
                  <SelectItem value="transfer">{t('transfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">{t('amount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTransaction.amount || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setNewTransaction({ ...newTransaction, amount: value });
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">{t('currency')}</Label>
                <Select
                  value={newTransaction.currency}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Währung auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                    <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                    <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                    <SelectItem value="MAD">MAD - Moroccan Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Input
                id="description"
                value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">{t('category')}</Label>
                <Select
                  value={newTransaction.categoryId || "none"}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, categoryId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Kategorie</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">{t('transactionDate')}</Label>
              <DatePicker
                date={newTransaction.transactionDate}
                onSelect={(date) => date && setNewTransaction({ ...newTransaction, transactionDate: date })}
              />
            </div>
          </div>
          <DialogFooter>
              <Button onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }} variant="outline">
              Abbrechen
            </Button>
              <Button
                onClick={isEditOpen ? handleUpdateTransaction : handleCreateTransaction}
                disabled={isCreating || !newTransaction.accountId || !newTransaction.amount || !newTransaction.description.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  isEditOpen ? 'Aktualisieren' : 'Erstellen'
                )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Transactions Grouped by Month */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : monthlyGroups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('noTransactions')}
          </div>
        ) : (
          <div className="space-y-4">
            {monthlyGroups.map(({ monthKey, monthLabel, transactions, income, expenses, totalTransactions }) => {
              const isExpanded = expandedMonths.has(monthKey);
              const balance = income - expenses;
              const hasMultipleCurrencies = transactions.some(t => t.currency !== userCurrency);

              return (
                <Card key={monthKey}>
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => toggleMonth(monthKey)}
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        <div>
                          <CardTitle className="text-xl">{monthLabel}</CardTitle>
                          <CardDescription>
                            {transactions.length} {t('transactionsCount')}
                            {hasMultipleCurrencies && (
                              <span className="text-orange-500 ml-2">
                                (converted to {userCurrency})
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm items-center">
                        <div className="text-right">
                          <div className="text-muted-foreground">{t('income')}</div>
                          <div className="text-lg font-semibold text-green-500">
                            {new Intl.NumberFormat('de-DE', {
                              style: 'currency',
                              currency: userCurrency
                            }).format(income)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">{t('expenses')}</div>
                          <div className="text-lg font-semibold text-red-500">
                            {new Intl.NumberFormat('de-DE', {
                              style: 'currency',
                              currency: userCurrency
                            }).format(expenses)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">{t('balance')}</div>
                          <div className={`text-lg font-semibold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {new Intl.NumberFormat('de-DE', {
                              style: 'currency',
                              currency: userCurrency
                            }).format(balance)}
                          </div>
                        </div>
                        <AlertDialog open={monthToDelete?.monthKey === monthKey} onOpenChange={(open) => !open && setMonthToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMonthToDelete({ monthKey, monthLabel, count: transactions.length });
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Monat löschen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Alle Transaktionen von {monthLabel} löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Diese Aktion kann nicht rückgängig gemacht werden. Es werden {transactions.length} Transaktionen 
                                mit einem Gesamtvolumen von {new Intl.NumberFormat('de-DE', {
                                  style: 'currency',
                                  currency: userCurrency
                                }).format(Math.abs(income) + Math.abs(expenses))} permanent gelöscht.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setMonthToDelete(null)}>
                                Abbrechen
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMonth(monthKey)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Lösche...
                                  </>
                                ) : (
                                  'Alle löschen'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>{t('transactionDate')}</TableHead>
                            <TableHead>{t('description')}</TableHead>
                            <TableHead>{t('account')}</TableHead>
                            <TableHead>{t('category')}</TableHead>
                            <TableHead>{t('budget')}</TableHead>
                            <TableHead>{t('type')}</TableHead>
                            <TableHead>{t('currency')}</TableHead>
                            <TableHead className="text-right">{t('amount')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => {
                            const { icon: IconComponent } = getTransactionIcon(
                              transaction.description || '',
                              transaction.type
                            );

                            return (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <div className="flex items-center justify-center w-10 h-10 rounded-full">
                                  <IconComponent />
                                </div>
                              </TableCell>
                              <TableCell>{new Date(transaction.transactionDate).toLocaleDateString('de-DE')}</TableCell>
                              <TableCell>
                                {getTranslatedText(transaction.description, transaction.descriptionTranslations, language)}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const account = accounts?.find(a => a.id === transaction.accountId);
                                  return account ? getTranslatedText(account.name, account.nameTranslations, language) : '-';
                                })()}
                              </TableCell>
                              <TableCell>
                                {typeof transaction.category === 'string'
                                  ? transaction.category
                                  : transaction.category
                                    ? getTranslatedText(transaction.category.name, transaction.category.nameTranslations, language)
                                    : '-'
                                }
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  if (!budgets) return '-';

                                  const transactionDate = new Date(transaction.transactionDate);
                                  
                                  // First try to match by category AND date range
                                  let matchingBudget = budgets.find(b => {
                                    if (b.categoryId && transaction.categoryId && b.categoryId === transaction.categoryId) {
                                      if (b.startDate && b.endDate) {
                                        const start = new Date(b.startDate);
                                        const end = new Date(b.endDate);
                                        return transactionDate >= start && transactionDate <= end;
                                      }
                                    }
                                    return false;
                                  });

                                  // If no category match, fallback to date range only (for budgets without category)
                                  if (!matchingBudget && !transaction.categoryId) {
                                    matchingBudget = budgets.find(b => {
                                      if (!b.categoryId && b.startDate && b.endDate) {
                                        const start = new Date(b.startDate);
                                        const end = new Date(b.endDate);
                                        return transactionDate >= start && transactionDate <= end;
                                      }
                                      return false;
                                    });
                                  }

                                  return matchingBudget?.name || '-';
                                })()}
                              </TableCell>
                              <TableCell>
                                {transaction.type === 'income' ? t('income') :
                                 transaction.type === 'expense' ? t('expense') : t('transfer')}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{transaction.currency || 'EUR'}</span>
                                {transaction.currency !== userCurrency && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    (→ {userCurrency})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                                  {convertAndFormat(
                                    parseFloat(transaction.amount.toString()),
                                    transaction.currency || userCurrency
                                  )}
                                </span>
                                {transaction.currency !== userCurrency && (
                                  <div className="text-xs text-muted-foreground">
                                    {new Intl.NumberFormat('de-DE', {
                                      style: 'currency',
                                      currency: transaction.currency || 'EUR'
                                    }).format(parseFloat(transaction.amount.toString()))}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setNewTransaction({
                                      accountId: transaction.accountId || "",
                                      amount: parseFloat(transaction.amount.toString()),
                                      type: transaction.type,
                                      description: transaction.description || "",
                                      categoryId: transaction.categoryId || "",
                                      currency: transaction.currency || userCurrency,
                                      transactionDate: new Date(transaction.transactionDate),
                                    });
                                    setIsEditOpen(true);
                                  }}
                                >
                                  Bearbeiten
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-500">
                                      Löschen
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Transaktion löschen</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Möchten Sie diese Transaktion wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTransaction(transaction.id)}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Löschen
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
    </div>
    </Layout>
  );
}
