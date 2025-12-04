// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  ArrowUpDown,
} from 'lucide-react';
import Layout from "@/components/finflow/layout";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from '@/hooks/use-currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { stockTradingApi } from '@/lib/api/stock-trading';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

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

export default function StockTradingAgentPage() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { convert, convertAndFormat } = useExchangeRates();
  const { t } = useLanguage();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  // Order form state
  const [orderSymbol, setOrderSymbol] = useState('');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [strategy, setStrategy] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Redirect mobile users to mobile version
  useEffect(() => {
    if (isMobile) {
      router.replace('/stock-trading-agent/mobile');
    }
  }, [isMobile, router]);

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

      // Load portfolio and orders if available
      try {
        const [portfolioRes, ordersRes] = await Promise.all([
          stockTradingApi.getPortfolio(),
          stockTradingApi.getOpenOrders(),
        ]);
        
        // Always show portfolio with user's real account data
        setPortfolio(portfolioRes);
        setOrders(ordersRes);
      } catch {
        // Even on error, show empty portfolio structure
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

      // Load quotes for ALL stocks (not just popular ones)
      try {
        const allSymbols = stocksRes.map((stock: any) => stock.symbol);
        const quotesRes = await stockTradingApi.getStockQuotes(allSymbols);
        setQuotes(quotesRes);
      } catch {
        // Quotes not available
      }
    } catch {
      // Stock trading data loading failed silently
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!orderSymbol || !orderQuantity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsPlacingOrder(true);

      if (orderType === 'market') {
        await stockTradingApi.placeMarketOrder(
          orderSymbol,
          orderSide,
          parseInt(orderQuantity),
          strategy
        );
      } else {
        if (!limitPrice) {
          alert('Please enter a limit price');
          return;
        }
        await stockTradingApi.placeLimitOrder(
          orderSymbol,
          orderSide,
          parseInt(orderQuantity),
          parseFloat(limitPrice)
        );
      }

      alert('Order placed successfully!');
      setShowOrderDialog(false);
      resetOrderForm();
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const resetOrderForm = () => {
    setOrderSymbol('');
    setOrderSide('buy');
    setOrderQuantity('');
    setOrderType('market');
    setLimitPrice('');
    setStrategy('moderate');
  };

  const openOrderDialog = (symbol: string) => {
    setOrderSymbol(symbol);
    setShowOrderDialog(true);
  };

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = filterSector === 'all' || stock.sector === filterSector;
    const matchesRisk = filterRisk === 'all' || stock.riskLevel === filterRisk;
    return matchesSearch && matchesSector && matchesRisk;
  });

  const sectors = ['all', ...Array.from(new Set(stocks.map(s => s.sector)))];
  const riskLevels = ['all', 'low', 'medium', 'high'];

  if (isLoading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('stockTradingAgent')}</h1>
            <p className="text-muted-foreground">
              Trade 50+ stocks and ETFs with professional strategies
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isMarketOpen ? "default" : "secondary"}>
              <Activity className="h-3 w-3 mr-1" />
              {isMarketOpen ? t('marketOpen') : t('marketClosed')}
            </Badge>
            <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowOrderDialog(true)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t('placeOrder')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('placeOrder')}</DialogTitle>
                  <DialogDescription>
                    Execute a stock trade with professional strategies
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t('symbol')}</Label>
                    <Select value={orderSymbol} onValueChange={setOrderSymbol}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stock" />
                      </SelectTrigger>
                      <SelectContent>
                        {stocks.slice(0, 50).map((stock) => (
                          <SelectItem key={stock.symbol} value={stock.symbol}>
                            {stock.symbol} - {stock.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Side</Label>
                      <Select value={orderSide} onValueChange={(v: any) => setOrderSide(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">{t('buy')}</SelectItem>
                          <SelectItem value="sell">{t('sell')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('type')}</Label>
                      <Select value={orderType} onValueChange={(v: any) => setOrderType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="market">{t('market')}</SelectItem>
                          <SelectItem value="limit">{t('limit')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Quantity (Shares)</Label>
                    <Input
                      type="number"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      placeholder="100"
                    />
                  </div>

                  {orderType === 'limit' && (
                    <div>
                      <Label>{t('limitPrice')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder="150.00"
                      />
                    </div>
                  )}

                  {orderType === 'market' && orderSide === 'buy' && (
                    <div>
                      <Label>{t('strategy')} (Auto TP/SL)</Label>
                      <Select value={strategy} onValueChange={(v: any) => setStrategy(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservative">
                            {t('conservative')} (3% SL, 8% TP)
                          </SelectItem>
                          <SelectItem value="moderate">
                            {t('moderate')} (5% SL, 12% TP)
                          </SelectItem>
                          <SelectItem value="aggressive">
                            {t('aggressive')} (8% SL, 20% TP)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically sets Stop-Loss and Take-Profit orders
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={placeOrder}
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      `Place ${orderSide === 'buy' ? 'Buy' : 'Sell'} Order`
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Portfolio Summary - Show user's real account balances */}
        {portfolio && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalValue')}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(portfolio.totalValue, currency)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('buyingPower')}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(portfolio.buyingPower, currency)}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('dayChange')}</p>
                  <p className={`text-2xl font-bold ${portfolio.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(portfolio.dayChange, currency)}
                  </p>
                </div>
                {portfolio.dayChange >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Day Change %</p>
                  <p className={`text-2xl font-bold ${(portfolio.dayChangePercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(portfolio.dayChangePercent ?? 0).toFixed(2)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="markets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="markets">{t('stockMarkets')}</TabsTrigger>
            <TabsTrigger value="portfolio">{t('portfolio')}</TabsTrigger>
            <TabsTrigger value="orders">{t('orders')}</TabsTrigger>
          </TabsList>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-4">
            {/* Info Card */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {t('stockMarkets') || 'Stock Markets'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('marketInfo') || 'Discover and analyze 50+ stocks and ETFs with real-time market data in your preferred currency (CHF/EUR).'}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>{t('realTimeData') || 'Real-time prices'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span>{t('multiCurrency') || 'Multi-currency support'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Filters */}
            <Card className="p-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>{t('search')}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('stockSearch')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="w-48">
                  <Label>{t('sector')}</Label>
                  <Select value={filterSector} onValueChange={setFilterSector}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector === 'all' ? t('allSectors') : sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-48">
                  <Label>{t('riskLevel')}</Label>
                  <Select value={filterRisk} onValueChange={setFilterRisk}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {riskLevels.map((risk) => (
                        <SelectItem key={risk} value={risk}>
                          {risk === 'all' ? 'All Risk Levels' : risk.charAt(0).toUpperCase() + risk.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Stocks Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStocks.map((stock) => {
                const quote = quotes.find((q) => q.symbol === stock.symbol);
                return (
                  <Card key={stock.symbol} className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => openOrderDialog(stock.symbol)}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-lg">{stock.symbol}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {stock.name}
                          </p>
                        </div>
                        <Badge variant={
                          stock.riskLevel === 'low' ? 'default' :
                          stock.riskLevel === 'medium' ? 'secondary' : 'destructive'
                        }>
                          {stock.riskLevel}
                        </Badge>
                      </div>

                      {quote ? (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold">
                              {convertAndFormat(quote.price, 'USD', currency)}
                            </p>
                            <div className={`flex items-center gap-1 ${quote.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {quote.changePercent >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span className="text-sm font-medium">
                                {quote.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>H: {convertAndFormat(quote.high, 'USD', currency)}</span>
                              <span>L: {convertAndFormat(quote.low, 'USD', currency)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-muted-foreground">
                              Preis lädt...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Klicken für Details
                            </p>
                          </div>
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{stock.sector}</span>
                          <Button size="sm" variant="outline">
                            Trade
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            {portfolio && portfolio.positions && portfolio.positions.length > 0 ? (
              <div className="space-y-4">
                {portfolio.positions.map((position) => (
                  <Card key={position.symbol} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-bold text-lg">{position.symbol}</p>
                            <p className="text-sm text-muted-foreground">{position.name}</p>
                          </div>
                          <Badge variant="outline">{position.sector}</Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-medium">{position.quantity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Price</p>
                            <p className="font-medium">{convertAndFormat(position.avgPrice, 'USD', currency)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Current Price</p>
                            <p className="font-medium">{convertAndFormat(position.currentPrice, 'USD', currency)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Market Value</p>
                            <p className="font-medium">{formatCurrency(position.marketValue, currency)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Unrealized P/L</p>
                            <p className={`font-medium ${position.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(position.unrealizedPL, currency)} ({position.unrealizedPLPercent.toFixed(2)}%)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">{t('noPositions') || 'No positions yet'}</p>
                <p className="text-muted-foreground">
                  {t('startTradingMessage') || 'Start trading in the Markets tab to build your portfolio!'}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-bold">{order.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.side.toUpperCase()} {order.qty} shares
                          </p>
                        </div>
                        <Badge variant={order.status === 'filled' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Type: {order.type}</p>
                        {order.filled_avg_price && (
                          <p className="text-sm">Filled @ {convertAndFormat(parseFloat(order.filled_avg_price), 'USD', currency)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">{t('noOrders') || 'No orders yet'}</p>
                <p className="text-muted-foreground">
                  {t('ordersWillAppear') || 'Your buy and sell orders will appear here'}
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
