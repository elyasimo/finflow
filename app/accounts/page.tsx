'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAccounts } from '@/hooks/use-accounts';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Edit, CreditCard, Wallet, PiggyBank, BarChart } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Layout from '@/components/finflow/layout';
import MobileAccountsPage from '@/components/finflow/mobile-accounts-page';
import { Account } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getTranslatedText } from '@/lib/translation-utils';
import { useCurrency } from '@/components/finflow/CurrencyContext';
import { PostFinanceIcon, UBSIcon, getSwissBrandIcon } from '@/components/icons/swiss-brand-icons';
import { useMediaQuery } from '@/hooks/use-mobile';

export default function AccountsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { accounts, isLoading: accountsLoading, createAccount, updateAccount, deleteAccount, isCreating, isUpdating, isDeleting } = useAccounts();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { currency: userCurrency } = useCurrency();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // Form state
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [accountCurrency, setAccountCurrency] = useState('');
  
  // Set initial currency when user currency changes or dialog opens
  useEffect(() => {
    if (isCreateDialogOpen && !accountCurrency) {
      setAccountCurrency(userCurrency);
    }
  }, [isCreateDialogOpen, userCurrency, accountCurrency]);

  const [selectedTab, setSelectedTab] = useState('all');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isCreateDialogOpen) {
      setAccountName('');
      setAccountType('');
      setBankName('');
      setAccountBalance('');
      setAccountCurrency(userCurrency);
    }
  }, [isCreateDialogOpen, userCurrency]);

  // Set form values when editing an account
  useEffect(() => {
    if (selectedAccount && isEditDialogOpen) {
      const translatedName = getTranslatedText(
        selectedAccount.name, 
        selectedAccount.nameTranslations, 
        language
      );
      
      // Extract bank info if account has bank name prefix
      const bankInfo = extractBankInfo(translatedName);
      
      setAccountName(bankInfo.accountName);
      setAccountType(selectedAccount.type);
      setBankName(bankInfo.bankName || '');
      setAccountBalance(selectedAccount.balance.toString());
      setAccountCurrency(selectedAccount.currency || 'CHF');
    }
  }, [selectedAccount, isEditDialogOpen, language]);

  // Handle create account
  const handleCreateAccount = () => {
    // If bank or savings account with bank name selected and not "Other", prepend it to account name
    const finalName = (accountType === 'Bank' || accountType === 'Savings') && bankName && bankName !== 'Other' ? `${bankName} - ${accountName}` : accountName;
    
    // Map frontend types to backend types
    const typeMap: Record<string, string> = {
      'Bank': 'bank',
      'Credit Card': 'creditCard',
      'Cash': 'cash',
      'Investment': 'investment',
      'Savings': 'savings'
    };
    
    createAccount({
      name: finalName,
      type: typeMap[accountType] || 'bank',
      currency: accountCurrency,
      balance: parseFloat(accountBalance) || 0,
    });
    setIsCreateDialogOpen(false);
    setBankName(''); // Reset bank name
  };

  // Handle update account
  const handleUpdateAccount = () => {
    if (selectedAccount) {
      // If bank or savings account with bank name selected and not "Other", prepend bank name
      const finalName = (accountType === 'Bank' || accountType === 'Savings') && bankName && bankName !== 'Other'
        ? `${bankName} - ${accountName}`
        : accountName;
      
      // Map frontend types to backend types
      const typeMap: Record<string, string> = {
        'Bank': 'bank',
        'Credit Card': 'creditCard',
        'Cash': 'cash',
        'Investment': 'investment',
        'Savings': 'savings'
      };
      
      updateAccount({
        id: selectedAccount.id,
        data: {
          name: finalName,
          type: typeMap[accountType] || selectedAccount.type,
          currency: accountCurrency,
          openingBalanceCents: Math.round((parseFloat(accountBalance) || 0) * 100),
        },
      });
      setIsEditDialogOpen(false);
      setBankName(''); // Reset bank name
    }
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    if (selectedAccount) {
      deleteAccount(selectedAccount.id);
      setIsDeleteDialogOpen(false);
    }
  };

  // Filter accounts based on selected tab
  const filteredAccounts = selectedTab === 'all'
    ? accounts
    : accounts?.filter((account) => {
        switch (selectedTab) {
          case 'bank': return account.type.toLowerCase() === 'bank';
          case 'credit-card': return account.type.toLowerCase() === 'credit card';
          case 'cash': return account.type.toLowerCase() === 'cash';
          case 'investment': return account.type.toLowerCase() === 'investment';
          case 'savings': return account.type.toLowerCase() === 'savings';
          default: return true;
        }
      });

  // Show loading state while checking authentication or fetching data
  if (authLoading || accountsLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If not authenticated, don't render anything (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Calculate total balance
  const totalBalance = accounts?.reduce((sum, account) => sum + (Number(account.balance) || 0), 0) || 0;

  // If mobile, render mobile version
  if (isMobile) {
    return (
      <MobileAccountsPage
        accounts={accounts?.map(account => ({
          id: account.id,
          name: getTranslatedText(account.name, account.nameTranslations, language),
          type: account.type,
          balance: Number(account.balance),
          currency: account.currency || userCurrency,
          bankName: account.name?.split(' - ')?.[0] || undefined,
        })) || []}
        isLoading={accountsLoading}
        onAddAccount={async (data) => {
          // Build account name with bank prefix
          const fullName = data.bankName && data.bankName !== 'other' 
            ? `${SWISS_BANKS.find(b => b.id === data.bankName)?.label || data.bankName} - ${data.name}`
            : data.name;
          
          await new Promise<void>((resolve, reject) => {
            createAccount({
              name: fullName,
              type: data.type,
              balance: data.balance,
              currency: data.currency,
            }, {
              onSuccess: () => resolve(),
              onError: (error) => reject(error),
            });
          });
        }}
        onEditAccount={async (id, data) => {
          const fullName = data.bankName && data.bankName !== 'other' 
            ? `${SWISS_BANKS.find(b => b.id === data.bankName)?.label || data.bankName} - ${data.name}`
            : data.name;
          
          await new Promise<void>((resolve, reject) => {
            updateAccount({
              id,
              data: {
                name: fullName,
                type: data.type,
                openingBalanceCents: Math.round(data.balance * 100),
                currency: data.currency,
              },
            }, {
              onSuccess: () => resolve(),
              onError: (error) => reject(error),
            });
          });
        }}
        onDeleteAccount={async (id) => {
          await new Promise<void>((resolve) => {
            deleteAccount(id, { onSuccess: () => resolve() });
          });
        }}
        user={user || undefined}
      />
    );
  }

  // Swiss Banks constant for name building
  const SWISS_BANKS = [
    { id: 'postfinance', label: 'PostFinance' },
    { id: 'ubs', label: 'UBS' },
    { id: 'credit-suisse', label: 'Credit Suisse' },
    { id: 'raiffeisen', label: 'Raiffeisen' },
    { id: 'zkb', label: 'ZKB' },
    { id: 'other', label: 'Other' },
  ];

  // Extract bank info from account name
  const extractBankInfo = (accountName: string) => {
    const bankMapping: { [key: string]: string } = {
      'PostFinance': 'postfinance',
      'UBS': 'ubs',
      'Credit Suisse': 'creditsuisse',
      'Raiffeisen': 'raiffeisen',
      'ZKB': 'zkb',
      'Other': 'other'
    };
    
    for (const [bankDisplay, bankKey] of Object.entries(bankMapping)) {
      if (accountName.startsWith(bankDisplay + ' - ')) {
        const IconComponent = getSwissBrandIcon(bankKey);
        return {
          bankName: bankDisplay === 'Other' ? null : bankDisplay,
          accountName: accountName.replace(bankDisplay + ' - ', ''),
          IconComponent
        };
      }
    }
    return { bankName: null, accountName, IconComponent: null };
  };

  // Get bank gradient based on bank name - realistic card colors
  const getBankGradient = (bankName: string | null) => {
    switch (bankName?.toLowerCase()) {
      case 'postfinance':
        // PostFinance Yellow Card
        return 'bg-gradient-to-br from-[#FFC000] via-[#FFD700] to-[#FFA500]';
      case 'ubs':
        // UBS White/Grey Card with subtle gradient
        return 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300';
      case 'credit suisse':
        // Credit Suisse Blue Card
        return 'bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#1976D2]';
      case 'raiffeisen':
        // Raiffeisen Yellow/Black Card
        return 'bg-gradient-to-br from-[#FFED00] via-[#FFE000] to-[#F5D300]';
      case 'zkb':
        // ZKB Blue Card
        return 'bg-gradient-to-br from-[#0066B3] via-[#0077CC] to-[#0088DD]';
      default:
        // Generic dark card
        return 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900';
    }
  };

  // Get text color for card (light cards need dark text)
  const getCardTextColor = (bankName: string | null) => {
    switch (bankName?.toLowerCase()) {
      case 'ubs':
      case 'raiffeisen':
      case 'postfinance':
        return 'text-gray-900'; // Dark text for light backgrounds
      default:
        return 'text-white'; // White text for dark backgrounds
    }
  };

  // Get account icon based on type
  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bank':
        return <CreditCard className="h-5 w-5" />;
      case 'credit card':
        return <CreditCard className="h-5 w-5" />;
      case 'investment':
        return <BarChart className="h-5 w-5" />;
      case 'savings':
        return <PiggyBank className="h-5 w-5" />;
      case 'cash':
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  // Get cash banknote design based on currency and account balance
  // The large denomination number on the visual banknote shows the actual entered balance (major units)
  const getCashDesign = (currency: string, balanceCents?: number) => {
    const balanceMajor = Math.round((Number(balanceCents) || 0) / 100);
    const formattedValue = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(balanceMajor);

    switch (currency?.toUpperCase()) {
      case 'CHF':
        return {
          gradient: 'bg-gradient-to-br from-[#9b4d96] via-[#8b4789] to-[#7a3f7c]',
          textColor: 'text-white',
          value: formattedValue,
          symbol: 'CHF',
          pattern: 'swiss',
          accent: '#c084bd'
        };
      case 'EUR':
        return {
          gradient: 'bg-gradient-to-br from-[#f4e04d] via-[#e8d347] to-[#d4b942]',
          textColor: 'text-gray-900',
          value: formattedValue,
          symbol: '€',
          pattern: 'euro',
          accent: '#c9b037'
        };
      default:
        return {
          gradient: 'bg-gradient-to-br from-[#2D5F3F] via-[#3A7550] to-[#275040]',
          textColor: 'text-white',
          value: formattedValue,
          symbol: currency || '$',
          pattern: 'generic',
          accent: '#4a9d66'
        };
    }
  };

  return (
    <Layout user={user}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('accounts')}</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('addAccount')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">{t('create')} {t('account')}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {t('addAccount')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Account Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {t('name')}
                  </Label>
                  <Input
                    id="name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="z.B. Hauptkonto"
                    className="h-11"
                  />
                </div>

                {/* Account Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    {t('type')}
                  </Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('selectAccountType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank">{t('bank')}</SelectItem>
                      <SelectItem value="Credit Card">{t('creditCard')}</SelectItem>
                      <SelectItem value="Cash">{t('cash')}</SelectItem>
                      <SelectItem value="Investment">{t('investment')}</SelectItem>
                      <SelectItem value="Savings">{t('savings')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bank Selection (conditional) */}
                {(accountType === 'Bank' || accountType === 'Savings') && (
                  <div className="space-y-2">
                    <Label htmlFor="bankName" className="text-sm font-medium">
                      Bank
                    </Label>
                    <Select value={bankName} onValueChange={setBankName}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Bank auswählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PostFinance">🟡 PostFinance</SelectItem>
                        <SelectItem value="UBS">🔴 UBS</SelectItem>
                        <SelectItem value="Credit Suisse">🔵 Credit Suisse</SelectItem>
                        <SelectItem value="Raiffeisen">🟢 Raiffeisen</SelectItem>
                        <SelectItem value="ZKB">🔵 Zürcher Kantonalbank (ZKB)</SelectItem>
                        <SelectItem value="Other">Andere Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Currency and Balance - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium">
                      {t('currency')}
                    </Label>
                    <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">€ EUR</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="MAD">MAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="balance" className="text-sm font-medium">
                      {t('balance')}
                    </Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(e.target.value)}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="submit" 
                  onClick={handleCreateAccount} 
                  disabled={isCreating || !accountName.trim() || !accountType}
                  className="flex-1"
                >
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Tabs defaultValue="all" className="mb-6" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="bg-gray-100 dark:bg-[#232e40] border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
            <TabsTrigger value="all">{t('all')}</TabsTrigger>
            <TabsTrigger value="bank">{t('bank')}</TabsTrigger>
            <TabsTrigger value="credit-card">{t('creditCard')}</TabsTrigger>
            <TabsTrigger value="cash">{t('cash')}</TabsTrigger>
            <TabsTrigger value="investment">{t('investment')}</TabsTrigger>
            <TabsTrigger value="savings">{t('savings')}</TabsTrigger>
          </TabsList>
          <TabsContent value={selectedTab}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts?.map((account) => {
                const translatedName = getTranslatedText(account.name, account.nameTranslations, language);
                const bankInfo = extractBankInfo(translatedName);
                const isBankOrSavings = account.type.toLowerCase() === 'bank' || account.type.toLowerCase() === 'savings';
                const isCash = account.type.toLowerCase() === 'cash';
                const cashDesign = isCash ? getCashDesign(account.currency, Number(account.balance)) : null;
                
                return (
                  <Card key={account.id} className="overflow-hidden" style={{ minHeight: '200px' }}>
                    {/* Compact Banknote Design for Cash */}
                    {isCash && cashDesign ? (
                      <div className={`${cashDesign.gradient} ${cashDesign.textColor} p-4 relative overflow-hidden rounded-xl shadow-2xl border-2 border-white/20 h-full`}>
                        {/* Subtle Security Pattern */}
                        <div className="absolute inset-0 opacity-[0.03]">
                          <div className="absolute inset-0" style={{
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, currentColor 8px, currentColor 9px)`,
                          }}></div>
                        </div>
                        
                        {/* Small Watermark effect */}
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.08]">
                          <div className="text-4xl font-bold">{cashDesign.symbol}</div>
                        </div>

                        {/* Banknote Content */}
                        <div className="relative z-10 h-full flex flex-col justify-between">
                          {/* Top Section: Compact denomination */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'serif' }}>
                                {cashDesign.value}
                              </div>
                              <div className="text-sm font-bold tracking-wider opacity-80" style={{ fontFamily: 'serif' }}>
                                {cashDesign.symbol}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-0.5">
                              <Dialog open={isEditDialogOpen && selectedAccount?.id === account.id} onOpenChange={(open) => {
                                setIsEditDialogOpen(open);
                                if (open) setSelectedAccount(account);
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className={`h-7 w-7 ${cashDesign.textColor} hover:bg-black/20 backdrop-blur-sm rounded-full`}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{t('editAccount')}</DialogTitle>
                                    <DialogDescription>{t('updateAccountDetails')}</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit-type-cash" className="text-right">{t('type')}</Label>
                                      <Select value={accountType} onValueChange={setAccountType}>
                                        <SelectTrigger className="col-span-3">
                                          <SelectValue placeholder={t('selectAccountType')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Bank">{t('bank')}</SelectItem>
                                          <SelectItem value="Credit Card">{t('creditCard')}</SelectItem>
                                          <SelectItem value="Cash">{t('cash')}</SelectItem>
                                          <SelectItem value="Investment">{t('investment')}</SelectItem>
                                          <SelectItem value="Savings">{t('savings')}</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit-name-cash" className="text-right">{t('name')}</Label>
                                      <Input id="edit-name-cash" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit-currency-cash" className="text-right">{t('currency')}</Label>
                                      <Select value={accountCurrency} onValueChange={setAccountCurrency}>
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
                                      <Label htmlFor="edit-balance-cash" className="text-right">{t('balance')}</Label>
                                      <Input id="edit-balance-cash" type="number" value={accountBalance} onChange={(e) => setAccountBalance(e.target.value)} className="col-span-3" />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button type="submit" onClick={handleUpdateAccount} disabled={isUpdating}>
                                      {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                      {t('update')}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className={`h-7 w-7 ${cashDesign.textColor} hover:bg-red-500/20`} onClick={() => setSelectedAccount(account)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('deleteAccount')}</AlertDialogTitle>
                                    <AlertDialogDescription>{t('confirmDeleteAccount')}</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                                      {t('delete')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          {/* Middle: Account Name - compact design */}
                          <div className="flex-1 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                                backgroundColor: `${cashDesign.accent}30`,
                                border: `2px solid ${cashDesign.accent}`
                              }}>
                                {cashDesign.value}
                              </div>
                              <span className="text-sm font-semibold uppercase tracking-wide opacity-90">
                                {translatedName}
                              </span>
                            </div>
                          </div>

                          {/* Bottom: Balance + Serial Number Style */}
                          <div className="flex items-end justify-between pt-1">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">SALDO</div>
                              <div className="text-xl font-bold">
                                {new Intl.NumberFormat('de-DE', {
                                  style: 'currency',
                                  currency: account.currency || 'CHF'
                                }).format(Number(account.balance) || 0)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-[0.1em] font-bold opacity-50">
                                CASH
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : isBankOrSavings && bankInfo.bankName ? (
                      <div className={`${getBankGradient(bankInfo.bankName)} ${getCardTextColor(bankInfo.bankName)} p-4 relative overflow-hidden rounded-xl shadow-2xl h-full`}>
                        
                        {/* Card Content */}
                        <div className="relative z-10 h-full flex flex-col justify-between">
                          {/* Top Row: Chip + Contactless + Bank Logo */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              {/* EMV Chip */}
                              <div className="w-10 h-7 bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 rounded-md relative overflow-hidden shadow-md">
                                <div className="absolute inset-0.5 grid grid-cols-4 gap-[1px]">
                                  {[...Array(16)].map((_, i) => (
                                    <div key={i} className="bg-yellow-600/40 rounded-[1px]"></div>
                                  ))}
                                </div>
                              </div>
                              {/* Contactless Symbol */}
                              <svg width="20" height="20" viewBox="0 0 24 24" className={getCardTextColor(bankInfo.bankName)}>
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2 0v-15.86c3.95.49 7 3.85 7 7.93s-3.05 7.44-7 7.93z" fill="currentColor" opacity="0.6"/>
                              </svg>
                            </div>
                            
                            {/* Bank Logo + Action Buttons */}
                            <div className="flex items-start space-x-1">
                              {/* Bank Logo - Direct integration without white background */}
                              {bankInfo.IconComponent && (
                                <div className="h-5 flex items-center justify-center opacity-90">
                                  <bankInfo.IconComponent />
                                </div>
                              )}
                              <div className="flex space-x-0.5">
                                <Dialog open={isEditDialogOpen && selectedAccount?.id === account.id} onOpenChange={(open) => {
                                  setIsEditDialogOpen(open);
                                  if (open) setSelectedAccount(account);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className={`h-7 w-7 ${getCardTextColor(bankInfo.bankName)} hover:bg-white/20 backdrop-blur-sm`}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t('editAccount')}</DialogTitle>
                                  <DialogDescription>
                                    {t('updateAccountDetails')}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-type" className="text-right">
                                      {t('type')}
                                    </Label>
                                    <Select value={accountType} onValueChange={setAccountType}>
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder={t('selectAccountType')} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Bank">{t('bank')}</SelectItem>
                                        <SelectItem value="Credit Card">{t('creditCard')}</SelectItem>
                                        <SelectItem value="Cash">{t('cash')}</SelectItem>
                                        <SelectItem value="Investment">{t('investment')}</SelectItem>
                                        <SelectItem value="Savings">{t('savings')}</SelectItem>
                                      </SelectContent>
                                  </Select>
                                </div>
                                
                                {(accountType === 'Bank' || accountType === 'Savings') && (
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-bank" className="text-right">
                                      Bank
                                    </Label>
                                      <Select value={bankName} onValueChange={setBankName}>
                                        <SelectTrigger className="col-span-3">
                                          <SelectValue placeholder="Bank auswählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="PostFinance">🟡 PostFinance</SelectItem>
                                          <SelectItem value="UBS">🔴 UBS</SelectItem>
                                          <SelectItem value="Credit Suisse">🔵 Credit Suisse</SelectItem>
                                          <SelectItem value="Raiffeisen">🟢 Raiffeisen</SelectItem>
                                          <SelectItem value="ZKB">🔵 ZKB</SelectItem>
                                          <SelectItem value="Other">Andere</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">
                                      {t('name')}
                                    </Label>
                                    <Input
                                      id="edit-name"
                                      value={accountName}
                                      onChange={(e) => setAccountName(e.target.value)}
                                      className="col-span-3"
                                      placeholder={accountType === 'Bank' ? 'z.B. Sparkonto' : t('name')}
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-balance" className="text-right">
                                      {t('balance')}
                                    </Label>
                                    <Input
                                      id="edit-balance"
                                      type="number"
                                      step="0.01"
                                      value={accountBalance}
                                      onChange={(e) => setAccountBalance(e.target.value)}
                                      className="col-span-3"
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-currency" className="text-right">
                                      {t('currency')}
                                    </Label>
                                    <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder={t('currency')} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit" onClick={handleUpdateAccount} disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {t('save')}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                                <Dialog open={isDeleteDialogOpen && selectedAccount?.id === account.id} onOpenChange={(open) => {
                                  setIsDeleteDialogOpen(open);
                                  if (open) setSelectedAccount(account);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className={`h-7 w-7 ${getCardTextColor(bankInfo.bankName)} hover:bg-white/20 backdrop-blur-sm`}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t('deleteAccount')}</DialogTitle>
                                  <DialogDescription>
                                    {t('confirmDeleteAccount')}
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                    {t('cancel')}
                                  </Button>
                                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {t('delete')}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </div>
                          
                          {/* Middle Section: Account Name & Card Number */}
                          <div className="py-3">
                            <div className="text-sm font-semibold mb-1">
                              {isBankOrSavings && bankInfo.accountName ? bankInfo.accountName : account.name}
                            </div>
                            <div className="font-mono text-xs tracking-[0.15em] opacity-70">
                              •••• •••• •••• {String(account.id).slice(-4).padStart(4, '•')}
                            </div>
                          </div>
                          
                          {/* Bottom Section: Balance */}
                          <div className="flex items-end justify-between pt-2">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5 font-medium">
                                SALDO
                              </div>
                              <div className="text-xl font-bold">
                                {new Intl.NumberFormat('de-DE', {
                                  style: 'currency',
                                  currency: account.currency || 'CHF'
                                }).format(Number(account.balance) || 0)}
                              </div>
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.1em] font-bold opacity-50">
                              DEBIT
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Regular Account Card (Investment, Credit Card, etc.) */
                      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white p-4 relative overflow-hidden rounded-xl shadow-2xl h-full">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                          {/* Top Row: Icon + Name + Actions */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-white/10 rounded-lg">
                                {getAccountIcon(account.type)}
                              </div>
                              <span className="text-sm font-medium opacity-80">{account.type}</span>
                            </div>
                            <div className="flex space-x-0.5">
                      <Dialog open={isEditDialogOpen && selectedAccount?.id === account.id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (open) setSelectedAccount(account);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('editAccount')}</DialogTitle>
                            <DialogDescription>
                              {t('updateAccountDetails')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-type-2" className="text-right">
                                {t('type')}
                              </Label>
                              <Select value={accountType} onValueChange={setAccountType}>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder={t('selectAccountType')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Bank">{t('bank')}</SelectItem>
                                  <SelectItem value="Credit Card">{t('creditCard')}</SelectItem>
                                  <SelectItem value="Cash">{t('cash')}</SelectItem>
                                  <SelectItem value="Investment">{t('investment')}</SelectItem>
                                  <SelectItem value="Savings">{t('savings')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {(accountType === 'Bank' || accountType === 'Savings') && (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-bank-2" className="text-right">
                                  Bank
                                </Label>
                                <Select value={bankName} onValueChange={setBankName}>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Bank auswählen" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PostFinance">🟡 PostFinance</SelectItem>
                                    <SelectItem value="UBS">🔴 UBS</SelectItem>
                                    <SelectItem value="Credit Suisse">🔵 Credit Suisse</SelectItem>
                                    <SelectItem value="Raiffeisen">🟢 Raiffeisen</SelectItem>
                                    <SelectItem value="ZKB">🔵 ZKB</SelectItem>
                                    <SelectItem value="Other">Andere</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-name-2" className="text-right">
                                {t('name')}
                              </Label>
                              <Input
                                id="edit-name-2"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                className="col-span-3"
                                placeholder={accountType === 'Bank' ? 'z.B. Sparkonto' : t('name')}
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-balance-2" className="text-right">
                                {t('balance')}
                              </Label>
                              <Input
                                id="edit-balance-2"
                                type="number"
                                step="0.01"
                                value={accountBalance}
                                onChange={(e) => setAccountBalance(e.target.value)}
                                className="col-span-3"
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-currency-2" className="text-right">
                                {t('currency')}
                              </Label>
                              <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder={t('currency')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" onClick={handleUpdateAccount} disabled={isUpdating}>
                              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              {t('save')}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isDeleteDialogOpen && selectedAccount?.id === account.id} onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (open) setSelectedAccount(account);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('deleteAccount')}</DialogTitle>
                            <DialogDescription>
                              {t('confirmDeleteAccount')}
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                              {t('cancel')}
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              {t('delete')}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                          </div>
                          
                          {/* Middle: Account Name */}
                          <div className="py-3">
                            <div className="text-sm font-semibold mb-1">{translatedName}</div>
                          </div>
                          
                          {/* Bottom: Balance */}
                          <div className="flex items-end justify-between pt-2">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">SALDO</div>
                              <div className="text-xl font-bold">
                      {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: account.currency || 'EUR'
                      }).format(Number(account.balance) || 0)}
                    </div>
                            </div>
                            <div className="text-[10px] uppercase opacity-50">{account.type}</div>
                          </div>
                        </div>
                      </div>
              )}
            </Card>
          );
        })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
