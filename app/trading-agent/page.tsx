"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Bot,
  Plus,
  Trash2,
  History,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Loader2,
  Activity
} from 'lucide-react';
import Layout from "@/components/finflow/layout";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from '@/hooks/use-currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { tradingAgentApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import CryptoSelector from '@/components/trading/CryptoSelector';

interface TradingAgent {
  id: string;
  name: string;
  enabled: boolean;
  assets: string[];
  strategy: string;
  stopLossPercent: string;
  takeProfitPercent: string;
  trailingStopPercent: string | null;
  maxDailyTradesCents: number;
  maxSingleTradeCents: number;
  totalTradesExecuted: number;
  totalProfitCents: number;
  lastTradeAt: string | null;
  createdAt: string;
}

interface TradeLog {
  id: string;
  action: string;
  asset: string;
  quantity: string;
  priceAtAction: string;
  totalValueCents: number;
  reason: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

interface PortfolioItem {
  asset: string;
  quantity: number;
  priceEur: number;
  priceChange24h: number;
  valueEur: number;
  monitoredBy: string | null;
}

export default function TradingAgentPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { convertAndFormat } = useExchangeRates();
  const [agents, setAgents] = useState<TradingAgent[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totalValueEur, setTotalValueEur] = useState(0);
  const [selectedAgentLogs, setSelectedAgentLogs] = useState<TradeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // New agent form state
  const [newAgentName, setNewAgentName] = useState('Mein Trading Agent');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [strategy, setStrategy] = useState('conservative');
  const [stopLoss, setStopLoss] = useState(8);
  const [takeProfit, setTakeProfit] = useState(15);
  const [maxDailyTrades, setMaxDailyTrades] = useState(100);
  const [maxSingleTrade, setMaxSingleTrade] = useState(50);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadData, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [agentsRes, portfolioRes] = await Promise.all([
        tradingAgentApi.getAgents(),
        tradingAgentApi.getPortfolioAnalysis(),
      ]);
      setAgents(agentsRes.agents || []);
      setPortfolio(portfolioRes.portfolio || []);
      setTotalValueEur(portfolioRes.totalValueEur || 0);
    } catch (error) {
      console.error('Error loading trading agent data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async () => {
    // Validation
    if (!newAgentName.trim()) {
      alert(t('pleaseEnterAgentName') || 'Please enter an agent name');
      return;
    }

    if (selectedAssets.length === 0) {
      alert(t('pleaseSelectAtLeastOneCrypto') || 'Please select at least one cryptocurrency');
      return;
    }

    try {
      setIsCreating(true);
      await tradingAgentApi.createAgent({
        name: newAgentName,
        assets: selectedAssets,
        strategy,
        stopLossPercent: stopLoss,
        takeProfitPercent: takeProfit,
        maxDailyTradesEur: maxDailyTrades,
        maxSingleTradeEur: maxSingleTrade,
      });

      // Reset form
      setNewAgentName('Mein Trading Agent');
      setSelectedAssets([]);
      setStrategy('conservative');
      setStopLoss(8);
      setTakeProfit(15);

      setShowCreateDialog(false);
      loadData();
    } catch (error) {
      console.error('Error creating agent:', error);
      alert(t('errorCreatingAgent') || 'Error creating agent');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleAgent = async (agentId: string, enabled: boolean) => {
    try {
      await tradingAgentApi.toggleAgent(agentId, enabled);
      loadData();
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm(t('confirmDeleteAgent'))) return;
    try {
      await tradingAgentApi.deleteAgent(agentId);
      loadData();
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const loadAgentLogs = async (agentId: string) => {
    try {
      const res = await tradingAgentApi.getAgentLogs(agentId);
      setSelectedAgentLogs(res.logs || []);
      setShowLogsDialog(true);
    } catch (error) {
      console.error('Error loading agent logs:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'bg-green-500';
      case 'sell': return 'bg-blue-500';
      case 'stop_loss': return 'bg-red-500';
      case 'take_profit': return 'bg-yellow-500';
      case 'error': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'conservative': return <Shield className="w-4 h-4" />;
      case 'moderate': return <TrendingUp className="w-4 h-4" />;
      case 'aggressive': return <Zap className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Layout user={user}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto py-10 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="w-8 h-8" />
              {t('tradingAgent')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('automatedRiskManagement')}
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('newAgent')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('createNewTradingAgent')}</DialogTitle>
                <DialogDescription>
                  {t('configureRiskSettings')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{t('name')}</Label>
                  <Input
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="Mein Trading Agent"
                  />
                </div>

                {/* NEW: Advanced Crypto Selector */}
                <div>
                  <Label className="mb-2 block">{t('selectCryptocurrencies') || 'Select Cryptocurrencies'}</Label>
                  <CryptoSelector
                    selectedAssets={selectedAssets}
                    onSelectionChange={setSelectedAssets}
                    maxSelection={20}
                  />
                </div>

                <div>
                  <Label>{t('strategy')}</Label>
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {t('conservative')}
                        </div>
                      </SelectItem>
                      <SelectItem value="moderate">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          {t('moderate')}
                        </div>
                      </SelectItem>
                      <SelectItem value="aggressive">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          {t('aggressive')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('stopLoss')}: {stopLoss}%</Label>
                  <Slider
                    value={[stopLoss]}
                    onValueChange={(v) => setStopLoss(v[0])}
                    min={5}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('autoSellAtLoss').replace('{percent}', stopLoss.toString())}
                  </p>
                </div>

                <div>
                  <Label>{t('takeProfit')}: {takeProfit}%</Label>
                  <Slider
                    value={[takeProfit]}
                    onValueChange={(v) => setTakeProfit(v[0])}
                    min={10}
                    max={50}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('sellAtProfit').replace('{percent}', takeProfit.toString())}
                  </p>
                </div>

                <div>
                  <Label>{t('maxDailyVolume')}: {maxDailyTrades}€</Label>
                  <Slider
                    value={[maxDailyTrades]}
                    onValueChange={(v) => setMaxDailyTrades(v[0])}
                    min={50}
                    max={500}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>{t('maxSingleTradeSize')}: {maxSingleTrade}€</Label>
                  <Slider
                    value={[maxSingleTrade]}
                    onValueChange={(v) => setMaxSingleTrade(v[0])}
                    min={10}
                    max={200}
                    step={10}
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={createAgent}
                  className="w-full"
                  disabled={isCreating || selectedAssets.length === 0}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {t('createAgent')}
                  {selectedAssets.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedAssets.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Warning Banner */}
        <Card className="p-4 border-yellow-500 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-500">{t('importantNotice')}</p>
              <p className="text-sm text-muted-foreground">
                {t('tradingBotsWarning')}
              </p>
            </div>
          </div>
        </Card>

        {/* Portfolio Overview */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('portfolioOverview')}</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className={`w-4 h-4 ${autoRefresh ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className="text-sm text-muted-foreground">{t('autoRefresh')}</span>
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4 mr-2" />
                )}
                {t('refresh')}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {portfolio.map((item) => (
              <div key={item.asset} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.asset}</p>
                    <p className="text-2xl font-bold">{convertAndFormat(item.valueEur, 'EUR', currency)}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity.toFixed(6)} @ {convertAndFormat(item.priceEur, 'EUR', currency)}
                    </p>
                  </div>
                  <div className={`flex items-center ${item.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {item.priceChange24h >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    <span className="text-sm font-medium">
                      {item.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
                {item.monitoredBy && (
                  <Badge variant="secondary" className="mt-2">
                    <Bot className="w-3 h-3 mr-1" />
                    {item.monitoredBy}
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">{t('totalValue')}</p>
            <p className="text-3xl font-bold">{convertAndFormat(totalValueEur, 'EUR', currency)}</p>
          </div>
        </Card>

        {/* Agents List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('yourTradingAgents')}</h2>

          {agents.length === 0 ? (
            <Card className="p-8 text-center">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t('noAgentsYet')}
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('createFirstAgent')}
              </Button>
            </Card>
          ) : (
            agents.map((agent) => (
              <Card key={agent.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${agent.enabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                      {getStrategyIcon(agent.strategy)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {agent.assets.map((asset) => (
                          <Badge key={asset} variant="outline">{asset}</Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('stopLoss')}</p>
                          <p className="font-medium text-red-500">-{agent.stopLossPercent}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('takeProfit')}</p>
                          <p className="font-medium text-green-500">+{agent.takeProfitPercent}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('trades')}</p>
                          <p className="font-medium">{agent.totalTradesExecuted}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('maxPerDay')}</p>
                          <p className="font-medium">{convertAndFormat(agent.maxDailyTradesCents / 100, 'EUR', currency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {agent.enabled ? t('active') : t('inactive')}
                      </span>
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={(checked) => toggleAgent(agent.id, checked)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => loadAgentLogs(agent.id)}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteAgent(agent.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Logs Dialog */}
        <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('tradeHistory')}</DialogTitle>
              <DialogDescription>
                {t('allExecutedTrades')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {selectedAgentLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('noTradesExecuted')}
                </p>
              ) : (
                selectedAgentLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(log.action)}>
                          {log.action.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{log.asset}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{log.reason}</p>
                    {log.quantity && (
                      <p className="text-sm text-muted-foreground">
                        {t('quantity')}: {parseFloat(log.quantity).toFixed(6)} @ {convertAndFormat(parseFloat(log.priceAtAction), 'EUR', currency)}
                      </p>
                    )}
                    {log.errorMessage && (
                      <p className="text-sm text-red-500 mt-1">{log.errorMessage}</p>
                    )}
                    <Badge variant={log.status === 'executed' ? 'default' : 'destructive'} className="mt-2">
                      {log.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
