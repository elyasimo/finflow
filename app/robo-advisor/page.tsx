"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Activity,
  RefreshCw,
  X,
  Check
} from 'lucide-react';
import Layout from "@/components/finflow/layout";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from '@/hooks/use-currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { tradingAgentApi } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import CryptoSelector from '@/components/trading/CryptoSelector';
import { useMediaQuery } from '@/hooks/use-mobile';
import MobileHeader from '@/components/finflow/mobile-header';
import MobileBottomNav from '@/components/finflow/mobile-bottom-nav';

// Popular cryptos for quick selection
const POPULAR_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'UNI', name: 'Uniswap' },
  { symbol: 'ATOM', name: 'Cosmos' },
];

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

interface PortfolioItem {
  asset: string;
  quantity: number;
  priceEur: number;
  priceChange24h: number;
  valueEur: number;
  monitoredBy: string | null;
}

export default function RoboAdvisorPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { convertAndFormat } = useExchangeRates();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  
  const [agents, setAgents] = useState<TradingAgent[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totalValueEur, setTotalValueEur] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'agents'>('portfolio');
  
  // Create Agent State
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAgentName, setNewAgentName] = useState('Mein Robo-Advisor');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<'conservative' | 'moderate' | 'aggressive'>('conservative');
  const [stopLoss, setStopLoss] = useState(8);
  const [takeProfit, setTakeProfit] = useState(15);
  const [maxDailyTrades, setMaxDailyTrades] = useState(100);
  const [maxSingleTrade, setMaxSingleTrade] = useState(50);

  useEffect(() => {
    loadData();
  }, []);

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
      console.error('Error loading robo-advisor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const toggleAsset = (symbol: string) => {
    setSelectedAssets(prev => 
      prev.includes(symbol) 
        ? prev.filter(a => a !== symbol)
        : [...prev, symbol]
    );
  };

  const createAgent = async () => {
    if (!newAgentName.trim()) {
      alert(t('pleaseEnterAgentName') || 'Bitte gib einen Namen ein');
      return;
    }
    if (selectedAssets.length === 0) {
      alert(t('pleaseSelectAtLeastOneCrypto') || 'Bitte wähle mindestens eine Kryptowährung');
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
      setNewAgentName('Mein Robo-Advisor');
      setSelectedAssets([]);
      setStrategy('conservative');
      setStopLoss(8);
      setTakeProfit(15);
      setShowCreateSheet(false);
      loadData();
    } catch (error) {
      console.error('Error creating agent:', error);
      alert(t('errorCreatingAgent') || 'Fehler beim Erstellen des Agents');
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
    if (!confirm(t('confirmDeleteAgent') || 'Agent wirklich löschen?')) return;
    try {
      await tradingAgentApi.deleteAgent(agentId);
      loadData();
    } catch (error) {
      console.error('Error deleting agent:', error);
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

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'conservative': return 'bg-blue-500';
      case 'moderate': return 'bg-yellow-500';
      case 'aggressive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e17] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Mobile version
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e17] pb-24">
        <MobileHeader user={user} showLogo={false} title={t('roboAdvisor') || 'Robo-Advisor'} />

        {/* Header Card */}
        <div className="px-4 py-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <span className="font-semibold">{t('roboAdvisor') || 'Robo-Advisor'}</span>
              </div>
              <button 
                onClick={handleRefresh}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-3xl font-bold mb-1">
              {convertAndFormat(totalValueEur, 'EUR', currency)}
            </p>
            <p className="text-sm text-white/70">{t('totalValue')}</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="px-4 mb-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                {t('tradingBotsWarning') || 'Trading-Bots sind risikoreich. Investiere nur, was du dir leisten kannst zu verlieren.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 mb-4">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#1a2332] rounded-xl">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-white dark:bg-[#232e40] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'agents'
                  ? 'bg-white dark:bg-[#232e40] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Agents ({agents.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          {activeTab === 'portfolio' ? (
            <div className="space-y-3">
              {portfolio.length === 0 ? (
                <div className="bg-white dark:bg-[#1a2332] rounded-xl p-8 text-center">
                  <Activity className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('noPositions') || 'Keine Positionen'}
                  </p>
                </div>
              ) : (
                portfolio.map((item) => (
                  <div key={item.asset} className="bg-white dark:bg-[#1a2332] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                          {item.asset.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.asset}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.quantity.toFixed(6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {convertAndFormat(item.valueEur, 'EUR', currency)}
                        </p>
                        <div className={`flex items-center justify-end gap-1 text-xs ${
                          item.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {item.priceChange24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {item.priceChange24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    {item.monitoredBy && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Bot className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-500">{item.monitoredBy}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {agents.length === 0 ? (
                <div className="bg-white dark:bg-[#1a2332] rounded-xl p-8 text-center">
                  <Bot className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    {t('noAgentsYet') || 'Noch keine Agents erstellt'}
                  </p>
                  <button
                    onClick={() => setShowCreateSheet(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    {t('createFirstAgent') || 'Ersten Agent erstellen'}
                  </button>
                </div>
              ) : (
                agents.map((agent) => (
                  <div key={agent.id} className="bg-white dark:bg-[#1a2332] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getStrategyColor(agent.strategy)} flex items-center justify-center text-white`}>
                          {getStrategyIcon(agent.strategy)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{agent.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {agent.assets.slice(0, 3).join(', ')}{agent.assets.length > 3 ? ` +${agent.assets.length - 3}` : ''}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={(checked) => toggleAgent(agent.id, checked)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-gray-50 dark:bg-[#232e40] rounded-lg p-2">
                        <p className="text-red-500 font-medium">-{agent.stopLossPercent}%</p>
                        <p className="text-gray-500">Stop Loss</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#232e40] rounded-lg p-2">
                        <p className="text-green-500 font-medium">+{agent.takeProfitPercent}%</p>
                        <p className="text-gray-500">Take Profit</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#232e40] rounded-lg p-2">
                        <p className="text-gray-900 dark:text-white font-medium">{agent.totalTradesExecuted}</p>
                        <p className="text-gray-500">Trades</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => deleteAgent(agent.id)}
                        className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('delete') || 'Löschen'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* FAB */}
        {activeTab === 'agents' && agents.length > 0 && (
          <button
            onClick={() => setShowCreateSheet(true)}
            className="fixed right-4 bottom-24 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Create Sheet */}
        {showCreateSheet && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateSheet(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[85vh] overflow-y-auto pb-safe">
              <div className="sticky top-0 bg-white dark:bg-[#1a2332] pt-3 pb-4 px-5 border-b border-gray-100 dark:border-gray-700 z-10">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('createNewAgent') || 'Neuen Agent erstellen'}
                  </h2>
                  <button onClick={() => setShowCreateSheet(false)} className="p-2">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('name') || 'Name'}
                  </label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#232e40] text-gray-900 dark:text-white"
                    placeholder="Mein Robo-Advisor"
                  />
                </div>

                {/* Crypto Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('selectCryptocurrencies') || 'Kryptowährungen wählen'} ({selectedAssets.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_CRYPTOS.map((crypto) => (
                      <button
                        key={crypto.symbol}
                        onClick={() => toggleAsset(crypto.symbol)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedAssets.includes(crypto.symbol)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-[#232e40] text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {crypto.symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Strategy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('strategy') || 'Strategie'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['conservative', 'moderate', 'aggressive'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStrategy(s)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          strategy === s
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-[#232e40] text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex justify-center mb-1">
                          {s === 'conservative' && <Shield className="w-5 h-5" />}
                          {s === 'moderate' && <TrendingUp className="w-5 h-5" />}
                          {s === 'aggressive' && <Zap className="w-5 h-5" />}
                        </div>
                        <span className="text-xs font-medium">
                          {s === 'conservative' && (t('conservative') || 'Konservativ')}
                          {s === 'moderate' && (t('moderate') || 'Moderat')}
                          {s === 'aggressive' && (t('aggressive') || 'Aggressiv')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stop Loss: {stopLoss}%
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(Number(e.target.value))}
                      className="w-full accent-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Take Profit: {takeProfit}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(Number(e.target.value))}
                      className="w-full accent-green-500"
                    />
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={createAgent}
                  disabled={isCreating || selectedAssets.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      {t('createAgent') || 'Agent erstellen'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <MobileBottomNav />
      </div>
    );
  }

  // Desktop version
  return (
    <Layout user={user}>
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="w-8 h-8" />
              {t('roboAdvisor') || 'Robo-Advisor'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('automatedRiskManagement') || 'Automatisiertes Risikomanagement'}
            </p>
          </div>
          <Dialog open={showCreateSheet} onOpenChange={setShowCreateSheet}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('newAgent') || 'Neuer Agent'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('createNewAgent') || 'Neuen Robo-Advisor Agent erstellen'}</DialogTitle>
                <DialogDescription>
                  {t('configureRiskSettings') || 'Konfiguriere die Risikoeinstellungen'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{t('name') || 'Name'}</Label>
                  <Input
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="Mein Robo-Advisor"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">{t('selectCryptocurrencies') || 'Kryptowährungen wählen'}</Label>
                  <CryptoSelector
                    selectedAssets={selectedAssets}
                    onSelectionChange={setSelectedAssets}
                    maxSelection={20}
                  />
                </div>

                <div>
                  <Label>{t('strategy') || 'Strategie'}</Label>
                  <Select value={strategy} onValueChange={(v) => setStrategy(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {t('conservative') || 'Konservativ'}
                        </div>
                      </SelectItem>
                      <SelectItem value="moderate">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          {t('moderate') || 'Moderat'}
                        </div>
                      </SelectItem>
                      <SelectItem value="aggressive">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          {t('aggressive') || 'Aggressiv'}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stop Loss: {stopLoss}%</Label>
                    <Slider
                      value={[stopLoss]}
                      onValueChange={(v) => setStopLoss(v[0])}
                      min={5}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Take Profit: {takeProfit}%</Label>
                    <Slider
                      value={[takeProfit]}
                      onValueChange={(v) => setTakeProfit(v[0])}
                      min={10}
                      max={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
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
                  {t('createAgent') || 'Agent erstellen'}
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
              <p className="font-medium text-yellow-500">{t('importantNotice') || 'Wichtiger Hinweis'}</p>
              <p className="text-sm text-muted-foreground">
                {t('tradingBotsWarning') || 'Trading-Bots sind risikoreich. Investiere nur, was du dir leisten kannst zu verlieren.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Portfolio Overview */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('portfolioOverview') || 'Portfolio-Übersicht'}</h2>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {t('refresh') || 'Aktualisieren'}
            </Button>
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
                    <span className="text-sm font-medium">{item.priceChange24h.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">{t('totalValue') || 'Gesamtwert'}</p>
            <p className="text-3xl font-bold">{convertAndFormat(totalValueEur, 'EUR', currency)}</p>
          </div>
        </Card>

        {/* Agents List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('yourTradingAgents') || 'Deine Robo-Advisor Agents'}</h2>

          {agents.length === 0 ? (
            <Card className="p-8 text-center">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t('noAgentsYet') || 'Noch keine Agents erstellt'}
              </p>
              <Button className="mt-4" onClick={() => setShowCreateSheet(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('createFirstAgent') || 'Ersten Agent erstellen'}
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
                          <p className="text-muted-foreground">Stop Loss</p>
                          <p className="font-medium text-red-500">-{agent.stopLossPercent}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Take Profit</p>
                          <p className="font-medium text-green-500">+{agent.takeProfitPercent}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Trades</p>
                          <p className="font-medium">{agent.totalTradesExecuted}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Max/Tag</p>
                          <p className="font-medium">{convertAndFormat(agent.maxDailyTradesCents / 100, 'EUR', currency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {agent.enabled ? (t('active') || 'Aktiv') : (t('inactive') || 'Inaktiv')}
                      </span>
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={(checked) => toggleAgent(agent.id, checked)}
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => deleteAgent(agent.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
