'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { bankingApi, accountsApi, transactionsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Link, RefreshCw, Download, Trash2, Plus, Search, CheckCircle, XCircle, Clock, AlertCircle, Building, CreditCard, Upload, FileSpreadsheet, Globe, Smartphone, ExternalLink, Eye, HelpCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ============ TYPES ============
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

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  valid: boolean;
  error?: string;
}

// ============ SWISS BANKS CONFIG ============
const SWISS_BANKS = [
  { 
    id: 'ubs', 
    name: 'UBS', 
    logo: 'https://logo.clearbit.com/ubs.com',
    loginUrl: 'https://www.ubs.com/ch/de/private/digital-banking/e-banking.html',
    exportPath: 'Kontoübersicht → Umsätze → Export (CSV)',
    csvConfig: { delimiter: ';', dateCol: 0, descCol: 3, amountCol: 4, dateFormat: 'DD.MM.YYYY', skipRows: 1 }
  },
  { 
    id: 'postfinance', 
    name: 'PostFinance', 
    logo: 'https://logo.clearbit.com/postfinance.ch',
    loginUrl: 'https://www.postfinance.ch/de/privat/produkte/digital-banking/e-finance.html',
    exportPath: 'Zahlungen → Kontobewegungen → CSV herunterladen',
    csvConfig: { delimiter: ';', dateCol: 0, descCol: 1, incomeCol: 2, expenseCol: 3, dateFormat: 'DD.MM.YYYY', skipRows: 1 }
  },
  { 
    id: 'raiffeisen', 
    name: 'Raiffeisen', 
    logo: 'https://logo.clearbit.com/raiffeisen.ch',
    loginUrl: 'https://ebanking.raiffeisen.ch/',
    exportPath: 'Konten → Kontobewegungen → Export → CSV',
    csvConfig: { delimiter: ';', dateCol: 0, descCol: 1, amountCol: 2, dateFormat: 'DD.MM.YYYY', skipRows: 1 }
  },
  { 
    id: 'zkb', 
    name: 'Zürcher Kantonalbank (ZKB)', 
    logo: 'https://logo.clearbit.com/zkb.ch',
    loginUrl: 'https://onba.zkb.ch/',
    exportPath: 'Kontoübersicht → Transaktionen → Exportieren',
    csvConfig: { delimiter: ';', dateCol: 0, descCol: 2, amountCol: 3, dateFormat: 'DD.MM.YYYY', skipRows: 1 }
  },
  { 
    id: 'bcv', 
    name: 'Banque Cantonale Vaudoise (BCV)', 
    logo: 'https://logo.clearbit.com/bcv.ch',
    loginUrl: 'https://www.bcv.ch/fr/Connexion',
    exportPath: 'Comptes → Mouvements → Télécharger CSV',
    csvConfig: { delimiter: ';', dateCol: 0, descCol: 1, amountCol: 2, dateFormat: 'DD.MM.YYYY', skipRows: 1 }
  },
  { 
    id: 'migros', 
    name: 'Migros Bank', 
    logo: 'https://logo.clearbit.com/migrosbank.ch',
    loginUrl: 'https://www.migrosbank.ch/de/e-banking.html',
    exportPath: 'Konten → Bewegungen → CSV exportieren',
    csvConfig: { delimiter: ';', dateCol: 0, descCol: 1, amountCol: 2, dateFormat: 'DD.MM.YYYY', skipRows: 1 }
  },
  { 
    id: 'cler', 
    name: 'Bank Cler', 
    logo: 'https://logo.clearbit.com/cler.ch',
    loginUrl: 'https://www.cler.ch/de/e-banking',
    exportPath: 'Kontoübersicht → Export → CSV',
    csvConfig: { delimiter: ';', dateCol: 0, descCol: 1, amountCol: 2, dateFormat: 'DD.MM.YYYY', skipRows: 1 }
  },
  { 
    id: 'neon', 
    name: 'Neon', 
    logo: 'https://logo.clearbit.com/neon-free.ch',
    loginUrl: 'https://app.neon-free.ch/',
    exportPath: 'Profil → Kontoauszug → CSV herunterladen',
    csvConfig: { delimiter: ',', dateCol: 0, descCol: 1, amountCol: 5, dateFormat: 'YYYY-MM-DD', skipRows: 1 }
  },
  { 
    id: 'yuh', 
    name: 'Yuh', 
    logo: 'https://logo.clearbit.com/yuh.com',
    loginUrl: 'https://www.yuh.com/',
    exportPath: 'Profil → Dokumente → Transaktionen exportieren',
    csvConfig: { delimiter: ',', dateCol: 0, descCol: 1, amountCol: 2, dateFormat: 'YYYY-MM-DD', skipRows: 1 }
  },
];

const EU_COUNTRIES = [
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪' },
  { code: 'AT', name: 'Österreich', flag: '🇦🇹' },
  { code: 'FR', name: 'Frankreich', flag: '🇫🇷' },
  { code: 'IT', name: 'Italien', flag: '🇮🇹' },
  { code: 'NL', name: 'Niederlande', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgien', flag: '🇧🇪' },
  { code: 'ES', name: 'Spanien', flag: '🇪🇸' },
  { code: 'GB', name: 'Grossbritannien', flag: '🇬🇧' },
  { code: 'PL', name: 'Polen', flag: '🇵🇱' },
];

// ============ MAIN COMPONENT ============
export default function BankingPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('swiss');
  
  // Shared state
  const [accounts, setAccounts] = useState<FinFlowAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Swiss Bank Import state
  const [selectedBank, setSelectedBank] = useState<typeof SWISS_BANKS[0] | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // EU Open Banking state
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsRes, connectionsRes] = await Promise.all([
        accountsApi.getAll(),
        bankingApi.getConnections().catch(() => []),
      ]);
      setAccounts(accountsRes);
      setConnections(connectionsRes);
      if (accountsRes.length > 0) {
        setSelectedAccount(accountsRes[0].id);
      }
    } catch {
      // Data loading failed silently
    } finally {
      setLoading(false);
    }
  };

  // ============ CSV PARSING ============
  const parseDate = (dateStr: string, format: string): string | null => {
    try {
      const cleaned = dateStr.trim().replace(/"/g, '');
      let day: string, month: string, year: string;
      if (format === 'YYYY-MM-DD') {
        [year, month, day] = cleaned.split('-');
      } else if (format === 'DD.MM.YYYY') {
        [day, month, year] = cleaned.split('.');
      } else {
        return null;
      }
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  const parseAmount = (amountStr: string): number | null => {
    try {
      let cleaned = amountStr.trim().replace(/"/g, '').replace(/'/g, '');
      if (cleaned.includes(',') && cleaned.includes('.')) {
        cleaned = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.') 
          ? cleaned.replace(/\./g, '').replace(',', '.')
          : cleaned.replace(/,/g, '');
      } else if (cleaned.includes(',')) {
        cleaned = cleaned.replace(',', '.');
      }
      cleaned = cleaned.replace(/[^\d.-]/g, '');
      const amount = parseFloat(cleaned);
      return isNaN(amount) ? null : amount;
    } catch {
      return null;
    }
  };

  const parseCSV = useCallback((content: string, config: typeof SWISS_BANKS[0]['csvConfig']): ParsedTransaction[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const transactions: ParsedTransaction[] = [];

    for (let i = config.skipRows; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const columns: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === config.delimiter && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim());

      const dateStr = columns[config.dateCol] || '';
      const description = columns[config.descCol]?.replace(/"/g, '') || '';
      
      let amount: number | null = null;
      if ('incomeCol' in config && 'expenseCol' in config) {
        const income = parseAmount(columns[config.incomeCol as number] || '0');
        const expense = parseAmount(columns[config.expenseCol as number] || '0');
        if (income && income > 0) amount = income;
        else if (expense && expense !== 0) amount = -Math.abs(expense);
        else amount = 0;
      } else if ('amountCol' in config) {
        amount = parseAmount(columns[config.amountCol as number] || '');
      }

      const date = parseDate(dateStr, config.dateFormat);

      if (!date || amount === null || !description) {
        if (dateStr || description) {
          transactions.push({
            date: dateStr, description: description || 'Unknown', amount: amount || 0,
            type: 'expense', valid: false,
            error: !date ? 'Ungültiges Datum' : !amount ? 'Ungültiger Betrag' : 'Fehlende Beschreibung',
          });
        }
        continue;
      }

      transactions.push({
        date, description, amount: Math.abs(amount),
        type: amount >= 0 ? 'income' : 'expense', valid: true,
      });
    }
    return transactions;
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!selectedBank) return;
    setCsvFile(file);
    setImportResult(null);
    try {
      const content = await file.text();
      const transactions = parseCSV(content, selectedBank.csvConfig);
      setParsedTransactions(transactions);
      setPreviewOpen(true);
    } catch (error) {
      setImportResult({ success: false, message: 'Fehler beim Lesen der CSV-Datei' });
    }
  }, [selectedBank, parseCSV]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]?.name.endsWith('.csv')) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const importTransactions = async () => {
    if (!selectedAccount || parsedTransactions.length === 0) return;
    setImporting(true);
    let importedCount = 0, skippedCount = 0;

    try {
      const validTransactions = parsedTransactions.filter(t => t.valid);
      for (const tx of validTransactions) {
        try {
          await transactionsApi.create({
            accountId: selectedAccount,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            transactionDate: new Date(tx.date),
          });
          importedCount++;
        } catch {
          skippedCount++;
        }
      }
      setImportResult({ success: true, message: `${importedCount} Transaktionen importiert, ${skippedCount} übersprungen.` });
      setPreviewOpen(false);
      setParsedTransactions([]);
      setCsvFile(null);
    } catch {
      setImportResult({ success: false, message: 'Import fehlgeschlagen' });
    } finally {
      setImporting(false);
    }
  };

  // ============ EU OPEN BANKING ============
  const loadInstitutions = async (country: string) => {
    setLoadingInstitutions(true);
    try {
      const data = await bankingApi.getInstitutions(country);
      setInstitutions(data);
    } catch {
      setInstitutions([]);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'eu' && connectDialogOpen) {
      loadInstitutions(selectedCountry);
    }
  }, [selectedCountry, connectDialogOpen, activeTab]);

  const connectEUBank = async (institution: Institution) => {
    try {
      const response = await bankingApi.createConnection({
        institutionId: institution.id,
        institutionName: institution.name,
        institutionLogo: institution.logo,
      });
      window.open(response.authUrl, '_blank');
      setConnectDialogOpen(false);
    } catch {
      setImportResult({ success: false, message: 'Verbindung fehlgeschlagen' });
    }
  };

  const syncTransactions = async (linkedAccountId: string) => {
    setSyncing(linkedAccountId);
    try {
      const response = await bankingApi.syncTransactions(linkedAccountId);
      setImportResult({ success: true, message: `${response.imported} Transaktionen synchronisiert` });
      loadData();
    } catch {
      setImportResult({ success: false, message: 'Synchronisation fehlgeschlagen' });
    } finally {
      setSyncing(null);
    }
  };

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validCount = parsedTransactions.filter(t => t.valid).length;
  const invalidCount = parsedTransactions.filter(t => !t.valid).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('banking')}</h1>
        <p className="text-muted-foreground mt-2">
          Importiere Transaktionen von deiner Bank - kostenlos und sicher
        </p>
      </div>

      {importResult && (
        <Alert variant={importResult.success ? 'default' : 'destructive'} className="mb-6">
          {importResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{importResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="swiss" className="flex items-center gap-2">
            🇨🇭 Schweizer Banken
          </TabsTrigger>
          <TabsTrigger value="eu" className="flex items-center gap-2">
            🇪🇺 EU Open Banking
          </TabsTrigger>
        </TabsList>

        {/* ============ SWISS BANKS TAB ============ */}
        <TabsContent value="swiss" className="space-y-6">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertTitle>So funktioniert's</AlertTitle>
            <AlertDescription>
              1. Wähle deine Bank → 2. Logge dich in dein E-Banking ein → 3. Exportiere CSV → 4. Lade die Datei hier hoch
            </AlertDescription>
          </Alert>

          {/* Bank Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Wähle deine Bank
              </CardTitle>
              <CardDescription>
                Unterstützte Schweizer Banken für den CSV-Import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {SWISS_BANKS.map(bank => (
                  <Button
                    key={bank.id}
                    variant={selectedBank?.id === bank.id ? 'default' : 'outline'}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setSelectedBank(bank)}
                  >
                    <img 
                      src={bank.logo} 
                      alt={bank.name} 
                      className="h-8 w-8 object-contain rounded"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-bank.png'; }}
                    />
                    <span className="text-xs text-center">{bank.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Bank Instructions & Upload */}
          {selectedBank && (
            <>
              {/* Step 1: Login Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                    Bei {selectedBank.name} einloggen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <img 
                      src={selectedBank.logo} 
                      alt={selectedBank.name}
                      className="h-12 w-12 object-contain rounded"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-bank.png'; }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{selectedBank.name} E-Banking</p>
                      <p className="text-sm text-muted-foreground">{selectedBank.exportPath}</p>
                    </div>
                    <Button onClick={() => window.open(selectedBank.loginUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      E-Banking öffnen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Select Target Account */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                    Zielkonto wählen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue placeholder="Konto auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Step 3: Upload CSV */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                    CSV-Datei hochladen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">
                      {dragActive ? 'CSV hier ablegen' : 'CSV-Datei hierher ziehen'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">oder klicken zum Auswählen</p>
                    <Button variant="outline">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      CSV auswählen
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ============ EU OPEN BANKING TAB ============ */}
        <TabsContent value="eu" className="space-y-6">
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertTitle>EU Open Banking (PSD2)</AlertTitle>
            <AlertDescription>
              Verbinde EU-Banken automatisch über GoCardless - kostenlos und sicher. Keine Zugangsdaten werden bei FinFlow gespeichert.
            </AlertDescription>
          </Alert>

          {/* Connected Banks */}
          {connections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Verbundene Banken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {connections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      {conn.institutionLogo ? (
                        <img src={conn.institutionLogo} alt={conn.institutionName} className="h-10 w-10 object-contain" />
                      ) : (
                        <Building2 className="h-10 w-10" />
                      )}
                      <div>
                        <p className="font-medium">{conn.institutionName}</p>
                        <p className="text-sm text-muted-foreground">
                          {conn.status === 'linked' ? 'Verbunden' : conn.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {conn.accounts?.map(acc => (
                        <Button
                          key={acc.id}
                          variant="outline"
                          size="sm"
                          disabled={syncing === acc.id}
                          onClick={() => syncTransactions(acc.id)}
                        >
                          {syncing === acc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><RefreshCw className="h-4 w-4 mr-2" />Sync</>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Connect New EU Bank */}
          <Card>
            <CardHeader>
              <CardTitle>EU-Bank verbinden</CardTitle>
              <CardDescription>Wähle dein Land und deine Bank für automatische Synchronisation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); setConnectDialogOpen(true); }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EU_COUNTRIES.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => { setConnectDialogOpen(true); loadInstitutions(selectedCountry); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Bank verbinden
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ DIALOGS ============ */}
      
      {/* CSV Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Transaktionen prüfen</DialogTitle>
            <DialogDescription>
              {csvFile?.name} • {validCount} gültig, {invalidCount} ungültig
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mb-4">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />{validCount} Gültig
            </Badge>
            {invalidCount > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />{invalidCount} Ungültig
              </Badge>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Typ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedTransactions.slice(0, 50).map((tx, i) => (
                  <TableRow key={i} className={!tx.valid ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                    <TableCell>
                      {tx.valid ? <CheckCircle className="h-4 w-4 text-green-500" /> : (
                        <span title={tx.error}>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{tx.description}</TableCell>
                    <TableCell className="text-right font-mono">{tx.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === 'income' ? 'default' : 'secondary'}>
                        {tx.type === 'income' ? 'Einnahme' : 'Ausgabe'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Abbrechen</Button>
            <Button onClick={importTransactions} disabled={importing || validCount === 0}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {validCount} Transaktionen importieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EU Bank Selection Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>EU-Bank verbinden</DialogTitle>
            <DialogDescription>
              Wähle deine Bank für automatische PSD2-Verbindung
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mb-4">
            <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); loadInstitutions(v); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EU_COUNTRIES.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Bank suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingInstitutions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Keine Banken gefunden</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredInstitutions.map(inst => (
                  <Button
                    key={inst.id}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => connectEUBank(inst)}
                  >
                    {inst.logo ? (
                      <img src={inst.logo} alt={inst.name} className="h-8 w-8 mr-3 object-contain" />
                    ) : (
                      <Building2 className="h-8 w-8 mr-3" />
                    )}
                    <div className="text-left">
                      <div className="font-medium">{inst.name}</div>
                      <div className="text-xs text-muted-foreground">{inst.transactionDays} Tage Historie</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
