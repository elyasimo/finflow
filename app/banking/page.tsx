'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { bankingApi, accountsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Link, RefreshCw, Download, Trash2, Plus, Search, CheckCircle, XCircle, Clock, AlertCircle, Building, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Institution {
  id: string;
  name: string;
  logo: string;
  countries: string[];
  transactionDays: number;
}

interface LinkedBankAccount {
  id: string;
  externalAccountId: string;
  iban?: string;
  accountName: string;
  accountType: string;
  currency: string;
  balanceCents: number;
  balanceUpdatedAt: string;
  autoSync: boolean;
  finflowAccountId?: string;
}

interface BankConnection {
  id: string;
  provider: string;
  institutionId: string;
  institutionName: string;
  institutionLogo?: string;
  requisitionId?: string;
  status: 'pending' | 'linked' | 'expired' | 'error';
  lastSync?: string;
  expiresAt?: string;
  errorMessage?: string;
  accounts: LinkedBankAccount[];
}

interface FinFlowAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
}

const COUNTRIES = [
  { code: 'CH', name: 'Switzerland' },
  { code: 'DE', name: 'Germany' },
  { code: 'AT', name: 'Austria' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'PL', name: 'Poland' },
];

export default function BankingPage() {
  const { t } = useLanguage();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [finflowAccounts, setFinflowAccounts] = useState<FinFlowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('CH');
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<LinkedBankAccount | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (connectDialogOpen) {
      loadInstitutions(selectedCountry);
    }
  }, [selectedCountry, connectDialogOpen]);

  const loadData = async () => {
    try {
      const [connectionsRes, accountsRes] = await Promise.all([
        bankingApi.getConnections(),
        accountsApi.getAll(),
      ]);
      setConnections(connectionsRes);
      setFinflowAccounts(accountsRes);
    } catch (error) {
      console.error('Error loading banking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutions = async (country: string) => {
    setLoadingInstitutions(true);
    try {
      const data = await bankingApi.getInstitutions(country);
      setInstitutions(data);
    } catch (error) {
      console.error('Error loading institutions:', error);
      setInstitutions([]);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const connectBank = async (institution: Institution) => {
    try {
      const response = await bankingApi.createConnection({
        institutionId: institution.id,
        institutionName: institution.name,
        institutionLogo: institution.logo,
      });

      window.open(response.authUrl, '_blank');
      setConnectDialogOpen(false);
      alert('Please complete the authentication in the new window. Once done, click "Check Status" to verify your connection.');
    } catch (error) {
      console.error('Error connecting bank:', error);
      alert('Failed to initiate bank connection');
    }
  };

  const checkConnectionStatus = async (requisitionId: string) => {
    try {
      await bankingApi.checkCallback(requisitionId);
      loadData();
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const deleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this bank connection?')) return;
    try {
      await bankingApi.deleteConnection(connectionId);
      loadData();
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const syncTransactions = async (linkedAccountId: string) => {
    setSyncing(linkedAccountId);
    try {
      const response = await bankingApi.syncTransactions(linkedAccountId);
      alert(`Synced ${response.imported} new transactions (${response.skipped} skipped)`);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to sync transactions');
    } finally {
      setSyncing(null);
    }
  };

  const refreshBalance = async (linkedAccountId: string) => {
    try {
      const response = await bankingApi.refreshBalance(linkedAccountId);
      if (response.success) {
        alert(`Balance updated: ${response.currency} ${response.balance}`);
        loadData();
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  const linkAccount = async (linkedAccountId: string, finflowAccountId: string) => {
    try {
      await bankingApi.linkAccount(linkedAccountId, finflowAccountId);
      setLinkDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error linking account:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'linked':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case 'error':
        return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Bank Connections</h1>
          <p className="text-muted-foreground mt-2">
            Connect your bank accounts via secure PSD2/Open Banking
          </p>
        </div>
        <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Connect Bank</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Connect Your Bank</DialogTitle>
              <DialogDescription>
                Select your bank to securely connect via PSD2 Open Banking (free)
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-4 mb-4">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(country => (
                    <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search banks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingInstitutions ? (
                <div className="text-center py-8">Loading banks...</div>
              ) : filteredInstitutions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No banks found</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredInstitutions.map(inst => (
                    <Button
                      key={inst.id}
                      variant="outline"
                      className="h-auto p-4 justify-start"
                      onClick={() => connectBank(inst)}
                    >
                      {inst.logo ? (
                        <img src={inst.logo} alt={inst.name} className="h-8 w-8 mr-3 object-contain" />
                      ) : (
                        <Building2 className="h-8 w-8 mr-3" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">{inst.name}</div>
                        <div className="text-xs text-muted-foreground">{inst.transactionDays} days history</div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Alert className="mb-6">
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          FinFlow uses GoCardless Bank Account Data (PSD2) for secure, free bank connections. 
          Your credentials are never stored - authentication happens directly with your bank.
        </AlertDescription>
      </Alert>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Bank Connections</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your bank to automatically import transactions
            </p>
            <Button onClick={() => setConnectDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Connect Your First Bank
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {connections.map(connection => (
            <Card key={connection.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  {connection.institutionLogo ? (
                    <img src={connection.institutionLogo} alt={connection.institutionName} className="h-12 w-12 object-contain" />
                  ) : (
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle>{connection.institutionName}</CardTitle>
                    <CardDescription>
                      {connection.lastSync ? `Last synced: ${new Date(connection.lastSync).toLocaleDateString()}` : 'Never synced'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(connection.status)}
                  {connection.status === 'pending' && connection.requisitionId && (
                    <Button variant="outline" size="sm" onClick={() => checkConnectionStatus(connection.requisitionId!)}>
                      <RefreshCw className="h-4 w-4 mr-2" />Check Status
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteConnection(connection.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>

              {connection.accounts.length > 0 && (
                <CardContent>
                  <div className="space-y-3">
                    {connection.accounts.map(account => (
                      <div key={account.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-4">
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{account.accountName}</div>
                            <div className="text-sm text-muted-foreground">
                              {account.iban ? `IBAN: ${account.iban}` : account.accountType}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold">{account.currency} {(account.balanceCents / 100).toFixed(2)}</div>
                          </div>
                          <div className="flex gap-2">
                            {account.finflowAccountId ? (
                              <>
                                <Badge variant="outline" className="text-green-600">
                                  <Link className="h-3 w-3 mr-1" />Linked
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={syncing === account.id}
                                  onClick={() => syncTransactions(account.id)}
                                >
                                  {syncing === account.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <><Download className="h-4 w-4 mr-2" />Sync</>
                                  )}
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSelectedAccount(account); setLinkDialogOpen(true); }}
                              >
                                <Link className="h-4 w-4 mr-2" />Link Account
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => refreshBalance(account.id)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {connection.errorMessage && (
                <CardContent className="pt-0">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{connection.errorMessage}</AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Bank Account</DialogTitle>
            <DialogDescription>
              Select a FinFlow account to link with "{selectedAccount?.accountName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {finflowAccounts.map(account => (
              <Button
                key={account.id}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => selectedAccount && linkAccount(selectedAccount.id, account.id)}
              >
                <div className="text-left">
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm text-muted-foreground">{account.type} • {account.currency}</div>
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
