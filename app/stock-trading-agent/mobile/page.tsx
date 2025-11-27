"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ShoppingCart,
  Clock,
  BarChart3,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronDown,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from '@/hooks/use-currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { stockTradingApi } from '@/lib/api/stock-trading';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import MobileHeader from '@/components/finflow/mobile-header';
import MobileBottomNav from '@/components/finflow/mobile-bottom-nav';

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  sector: string;
  riskLevel: string;
}

interface Position {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  sector: string;
}

interface PortfolioSummary {
  totalValue: number;
  cash: number;
  buyingPower: number;
  dayChange: number;
  dayChangePercent: number;
  positions: Position[];
  allocation: Array<{
    sector: string;
    value: number;
    percent: number;
  }>;
}

interface Order {
  id: string;
  symbol: string;
  side: string;
  qty: string;
  type: string;
  status: string;
  filled_avg_price: string | null;
  created_at: string;
}

export default function MobileStockTradingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { convert, convertAndFormat } = useExchangeRates();
  const { t } = useLanguage();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'markets' | 'portfolio' | 'orders'>('markets');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  
  // Order form
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [stocksRes, marketStatus] = await Promise.all([
        stockTradingApi.getSupportedStocks(),
        stockTradingApi.getMarketStatus(),
      ]);

      setStocks(stocksRes);
      setIsMarketOpen(marketStatus.isOpen);

      try {
        const [portfolioRes, ordersRes] = await Promise.all([
          stockTradingApi.getPortfolio(),
          stockTradingApi.getOpenOrders(),
        ]);
        
        setPortfolio(portfolioRes);
        setOrders(ordersRes);
      } catch (error) {
        console.error('Portfolio error:', error);
        setPortfolio({
          totalValue: 0,
          cash: 0,
          buyingPower: 0,
          dayChange: 0,
          dayChangePercent: 0,
          positions: [],
          allocation: []
        });
      }

      try {
        const allSymbols = stocksRes.map((stock: any) => stock.symbol);
        const quotesRes = await stockTradingApi.getStockQuotes(allSymbols);
        setQuotes(quotesRes);
      } catch (error) {
        console.log('Quotes not available:', error);
      }
    } catch (error) {
      console.error('Error loading stock trading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const openTradeModal = (stock: any) => {
    setSelectedStock(stock);
    setOrderQuantity('');
    setOrderSide('buy');
    setShowOrderModal(true);
  };

  const placeOrder = async () => {
    if (!selectedStock || !orderQuantity) return;

    try {
      setIsPlacingOrder(true);
      await stockTradingApi.placeMarketOrder(
        selectedStock.symbol,
        orderSide,
        parseInt(orderQuantity),
        'moderate'
      );
      alert('Order placed successfully!');
      setShowOrderModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert(error.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredStocks = stocks.filter((stock) => {
    return stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
           stock.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getQuote = (symbol: string) => quotes.find(q => q.symbol === symbol);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e17] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e17] pb-24">
      <MobileHeader user={user} showLogo={false} title={t('stockTradingAgent')} />

      {/* Portfolio Summary Card */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium">{t('portfolio')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                isMarketOpen 
                  ? 'bg-green-500/30 text-green-200' 
                  : 'bg-gray-500/30 text-gray-300'
              }`}>
                {isMarketOpen ? t('marketOpen') : t('marketClosed')}
              </span>
              <button 
                onClick={handleRefresh}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          <p className="text-3xl font-bold mb-1">
            {formatCurrency(portfolio?.totalValue || 0, currency)}
          </p>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              {(portfolio?.dayChange || 0) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-300" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-300" />
              )}
              <span className={`text-sm ${
                (portfolio?.dayChange || 0) >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {formatCurrency(portfolio?.dayChange || 0, currency)} ({(portfolio?.dayChangePercent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-white/60">{t('buyingPower')}</p>
              <p className="text-lg font-semibold">{formatCurrency(portfolio?.buyingPower || 0, currency)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-white/60">Cash</p>
              <p className="text-lg font-semibold">{formatCurrency(portfolio?.cash || 0, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#1a2332] rounded-xl">
          {(['markets', 'portfolio', 'orders'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-[#232e40] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab === 'markets' ? t('stockMarkets') : tab === 'portfolio' ? t('portfolio') : t('orders')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {activeTab === 'markets' && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('stockSearch') || 'Search stocks...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1a2332] rounded-xl text-sm border-0 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stocks List */}
            <div className="space-y-2">
              {filteredStocks.slice(0, 20).map((stock) => {
                const quote = getQuote(stock.symbol);
                return (
                  <button
                    key={stock.symbol}
                    onClick={() => openTradeModal(stock)}
                    className="w-full bg-white dark:bg-[#1a2332] rounded-xl p-4 text-left active:scale-98 transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                          {stock.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{stock.symbol}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                            {stock.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {quote ? (
                          <>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {convertAndFormat(quote.price, 'USD', currency)}
                            </p>
                            <div className={`flex items-center justify-end gap-1 text-xs ${
                              quote.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {quote.changePercent >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {quote.changePercent.toFixed(2)}%
                            </div>
                          </>
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#232e40] rounded text-xs text-gray-500 dark:text-gray-400">
                        {stock.sector}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        stock.riskLevel === 'low' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : stock.riskLevel === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {stock.riskLevel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-3">
            {portfolio?.positions && portfolio.positions.length > 0 ? (
              portfolio.positions.map((position) => (
                <div
                  key={position.symbol}
                  className="bg-white dark:bg-[#1a2332] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                        {position.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{position.symbol}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {position.quantity} shares
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(position.marketValue, currency)}
                      </p>
                      <p className={`text-xs ${
                        position.unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {position.unrealizedPL >= 0 ? '+' : ''}{formatCurrency(position.unrealizedPL, currency)} ({position.unrealizedPLPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Avg Price</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {convertAndFormat(position.avgPrice, 'USD', currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {convertAndFormat(position.currentPrice, 'USD', currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-[#1a2332] rounded-xl p-8 text-center">
                <Activity className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('noPositions') || 'No positions yet'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-[#1a2332] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        order.side === 'buy' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {order.side === 'buy' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{order.symbol}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {order.side.toUpperCase()} {order.qty} shares
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'filled' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span>{order.type}</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-[#1a2332] rounded-xl p-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('noOrders') || 'No orders yet'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB - Always Visible for Quick Trade */}
      <button
        onClick={() => {
          if (filteredStocks.length > 0) {
            openTradeModal(filteredStocks[0]);
          }
        }}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center active:scale-95 transition-transform z-20"
        aria-label={t('placeOrder') || 'Order platzieren'}
      >
        <ShoppingCart className="w-7 h-7 text-white" />
      </button>

      {/* Order Modal */}
      {showOrderModal && selectedStock && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setShowOrderModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a2332] rounded-t-3xl z-[101] p-6 safe-area-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('placeOrder')}
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#232e40] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#232e40] rounded-xl mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {selectedStock.symbol.substring(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedStock.symbol}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedStock.name}</p>
              </div>
            </div>

            {/* Buy/Sell Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setOrderSide('buy')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  orderSide === 'buy'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400'
                }`}
              >
                {t('buy')}
              </button>
              <button
                onClick={() => setOrderSide('sell')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  orderSide === 'sell'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-[#232e40] text-gray-600 dark:text-gray-400'
                }`}
              >
                {t('sell')}
              </button>
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity (Shares)
              </label>
              <input
                type="number"
                value={orderQuantity}
                onChange={e => setOrderQuantity(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#232e40] rounded-xl text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={placeOrder}
              disabled={isPlacingOrder || !orderQuantity}
              className={`w-full py-4 rounded-xl font-semibold transition-all ${
                orderSide === 'buy'
                  ? 'bg-green-500 text-white disabled:bg-green-300'
                  : 'bg-red-500 text-white disabled:bg-red-300'
              }`}
            >
              {isPlacingOrder ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                `${orderSide === 'buy' ? t('buy') : t('sell')} ${selectedStock.symbol}`
              )}
            </button>
          </div>
        </>
      )}

      <MobileBottomNav />
    </div>
  );
}
