"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ChevronRight,
  Settings2,
  RefreshCw,
  X,
  Check
} from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from '@/hooks/use-currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { tradingAgentApi } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useKeyboard } from '@/hooks/use-keyboard';
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

export default function MobileTradingAgentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const keyboard = useKeyboard();
  const { currency } = useCurrency();
  const { convertAndFormat } = useExchangeRates();
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
    } catch {
      // Trading agent data loading failed silently
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
      setNewAgentName('Mein Trading Agent');
      setSelectedAssets([]);
      setStrategy('conservative');
      setStopLoss(8);
      setTakeProfit(15);
      setShowCreateSheet(false);
      loadData();
    } catch {
      alert(t('errorCreatingAgent') || 'Fehler beim Erstellen des Agents');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleAgent = async (agentId: string, enabled: boolean) => {
    try {
      await tradingAgentApi.toggleAgent(agentId, enabled);
      loadData();
    } catch {
      // Toggle failed silently
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm(t('confirmDeleteAgent'))) return;
    try {
      await tradingAgentApi.deleteAgent(agentId);
      loadData();
    } catch {
      // Delete failed silently
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
              {t('tradingBotsWarning')}
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
          /* Portfolio Tab */
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
                <div
                  key={item.asset}
                  className="bg-white dark:bg-[#1a2332] rounded-xl p-4"
                >
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
          /* Agents Tab */
          <div className="space-y-3">
            {agents.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2332] rounded-xl p-8 text-center">
                <Bot className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  {t('noAgentsYet')}
                </p>
                <button
                  onClick={() => setShowCreateSheet(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  {t('createFirstAgent')}
                </button>
              </div>
            ) : (
              agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white dark:bg-[#1a2332] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${getStrategyColor(agent.strategy)} flex items-center justify-center text-white`}>
                        {getStrategyIcon(agent.strategy)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{agent.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${agent.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {agent.enabled ? t('active') : t('inactive')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAgent(agent.id, !agent.enabled)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        agent.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {agent.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Assets */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {agent.assets.slice(0, 4).map((asset) => (
                      <span
                        key={asset}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400 rounded text-xs"
                      >
                        {asset}
                      </span>
                    ))}
                    {agent.assets.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400 rounded text-xs">
                        +{agent.assets.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-gray-50 dark:bg-[#232e40] rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Stop Loss</p>
                      <p className="text-sm font-semibold text-red-500">-{agent.stopLossPercent}%</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-[#232e40] rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Take Profit</p>
                      <p className="text-sm font-semibold text-green-500">+{agent.takeProfitPercent}%</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-[#232e40] rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Trades</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{agent.totalTradesExecuted}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/trading-history?agent=${agent.id}`)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 dark:bg-[#232e40] rounded-lg text-gray-600 dark:text-gray-400 text-xs font-medium"
                    >
                      <History className="w-3 h-3" />
                      History
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="flex items-center justify-center gap-1 py-2 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 text-xs font-medium"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}

          </div>
        )}
      </div>

      {/* FAB - Always Visible */}
      <button
        onClick={() => setShowCreateSheet(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center active:scale-95 transition-transform z-20"
        aria-label={t('newAgent') || 'Neuen Agent erstellen'}
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Create Agent Bottom Sheet */}
      {showCreateSheet && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateSheet(false)}
          />
          
          {/* Sheet */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up"
            style={{
              marginBottom: keyboard.height > 0 ? `${keyboard.height}px` : '0px',
              paddingBottom: keyboard.height > 0 ? '0px' : 'env(safe-area-inset-bottom)',
              transition: 'margin-bottom 0.25s ease-out'
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('createNewTradingAgent') || 'Neuen Agent erstellen'}
              </h2>
              <button
                onClick={() => setShowCreateSheet(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 pb-[120px]">
              {/* Agent Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('name') || 'Name'}
                </label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-[#232e40] rounded-xl text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-blue-500"
                  placeholder="Mein Trading Agent"
                />
              </div>

              {/* Strategy Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('strategy') || 'Strategie'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'conservative', icon: Shield, label: t('conservative') || 'Konservativ', color: 'blue' },
                    { value: 'moderate', icon: TrendingUp, label: t('moderate') || 'Moderat', color: 'yellow' },
                    { value: 'aggressive', icon: Zap, label: t('aggressive') || 'Aggressiv', color: 'red' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStrategy(s.value as any)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        strategy === s.value
                          ? `border-${s.color}-500 bg-${s.color}-50 dark:bg-${s.color}-900/20`
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <s.icon className={`w-5 h-5 mx-auto mb-1 ${
                        strategy === s.value ? `text-${s.color}-500` : 'text-gray-400'
                      }`} />
                      <span className={`text-xs font-medium ${
                        strategy === s.value ? `text-${s.color}-600 dark:text-${s.color}-400` : 'text-gray-500'
                      }`}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crypto Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('selectCryptocurrencies') || 'Kryptowährungen auswählen'} ({selectedAssets.length})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {POPULAR_CRYPTOS.map((crypto) => (
                    <button
                      key={crypto.symbol}
                      onClick={() => toggleAsset(crypto.symbol)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedAssets.includes(crypto.symbol)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          selectedAssets.includes(crypto.symbol)
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {crypto.symbol}
                        </span>
                        {selectedAssets.includes(crypto.symbol) && (
                          <Check className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('stopLoss') || 'Stop Loss'}: {stopLoss}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-Verkauf bei -{stopLoss}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('takeProfit') || 'Take Profit'}: {takeProfit}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Gewinnmitnahme bei +{takeProfit}%</p>
                </div>
              </div>

              {/* Max Trade Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('maxDailyVolume') || 'Max. täglich'}: {maxDailyTrades}€
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="50"
                    value={maxDailyTrades}
                    onChange={(e) => setMaxDailyTrades(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('maxSingleTradeSize') || 'Max. pro Trade'}: {maxSingleTrade}€
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={maxSingleTrade}
                    onChange={(e) => setMaxSingleTrade(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={createAgent}
                disabled={isCreating || selectedAssets.length === 0}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed safe-area-inset-bottom"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {t('createAgent') || 'Agent erstellen'}
                    {selectedAssets.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {selectedAssets.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav fixed />
    </div>
  );
}
