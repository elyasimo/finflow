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
  RefreshCw
} from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from '@/hooks/use-currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { tradingAgentApi } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import MobileHeader from '@/components/finflow/mobile-header';
import MobileBottomNav from '@/components/finflow/mobile-bottom-nav';

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
  const { currency } = useCurrency();
  const { convertAndFormat } = useExchangeRates();
  const [agents, setAgents] = useState<TradingAgent[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totalValueEur, setTotalValueEur] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'agents'>('portfolio');

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
      console.error('Error loading trading agent data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
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
      <MobileHeader user={user} showLogo={false} title={t('tradingAgent')} />

      {/* Header Card */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <span className="font-semibold">{t('tradingAgent')}</span>
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
                  onClick={() => router.push('/trading-agent')}
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

            {/* Add Agent Button */}
            {agents.length > 0 && (
              <button
                onClick={() => router.push('/trading-agent')}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t('newAgent')}
              </button>
            )}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
