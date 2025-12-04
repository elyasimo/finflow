// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Search, X, TrendingUp, Shield, Zap, Coins, TrendingDown } from 'lucide-react';
import { tradingAgentApi } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useCurrency } from '@/hooks/use-currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { useWebSocketPrices } from '@/hooks/use-websocket-prices';

interface CryptocurrencyInfo {
  symbol: string;
  name: string;
  category: string;
  minNotional: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  description: string;
}

interface PriceData {
  price: number;
  priceChange24h: number;
}

interface CryptoSelectorProps {
  selectedAssets: string[];
  onSelectionChange: (assets: string[]) => void;
  maxSelection?: number;
}

export default function CryptoSelector({
  selectedAssets,
  onSelectionChange,
  maxSelection = 20,
}: CryptoSelectorProps) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { rates, convertAndFormat } = useExchangeRates();
  const { prices: wsPrices, isConnected } = useWebSocketPrices();
  const [allCryptos, setAllCryptos] = useState<CryptocurrencyInfo[]>([]);
  const [groupedCryptos, setGroupedCryptos] = useState<Record<string, CryptocurrencyInfo[]>>({});
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Update prices from WebSocket
  useEffect(() => {
    if (wsPrices.size > 0) {
      setPrices(wsPrices);
    }
  }, [wsPrices]);

  useEffect(() => {
    loadCryptocurrencies();
    loadPrices();
    
    // Fallback price refresh if WebSocket disconnects
    const interval = setInterval(() => {
      if (!isConnected) {
        loadPrices();
      }
    }, 30000); // Update prices every 30 seconds
    
    return () => {
      clearInterval(interval); // Clean up on unmount
    };
  }, [isConnected]);

  const loadCryptocurrencies = async () => {
    try {
      setIsLoading(true);
      const data = await tradingAgentApi.getSupportedCryptocurrencies();
      setAllCryptos(data.cryptocurrencies);
      setGroupedCryptos(data.grouped);
    } catch (error) {
      // Error loading cryptocurrencies - silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrices = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/trading-agents/crypto-prices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        return; // Keep existing prices on error
      }
      
      const data = await response.json();
      
      if (data.prices && Object.keys(data.prices).length > 0) {
        const priceMap = new Map<string, PriceData>();
        Object.entries(data.prices).forEach(([asset, priceData]: [string, any]) => {
          priceMap.set(asset, {
            price: priceData.price,
            priceChange24h: priceData.priceChange24h,
          });
        });
        setPrices(priceMap);
      }
    } catch (error) {
      // Don't clear prices on error - keep the old ones
    }
  };

  const toggleAsset = (symbol: string) => {
    if (selectedAssets.includes(symbol)) {
      onSelectionChange(selectedAssets.filter(s => s !== symbol));
    } else {
      if (selectedAssets.length < maxSelection) {
        onSelectionChange([...selectedAssets, symbol]);
      }
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-500/20 text-green-500 border-green-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500';
      case 'very-high': return 'bg-red-500/20 text-red-500 border-red-500';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'major': return <Coins className="w-3 h-3" />;
      case 'defi': return <TrendingUp className="w-3 h-3" />;
      case 'layer1': return <Shield className="w-3 h-3" />;
      case 'layer2': return <Zap className="w-3 h-3" />;
      default: return null;
    }
  };

  const filteredCryptos = allCryptos.filter(crypto => {
    const matchesSearch = crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || crypto.category === selectedCategory;
    const matchesRisk = selectedRiskLevel === 'all' || crypto.riskLevel === selectedRiskLevel;
    return matchesSearch && matchesCategory && matchesRisk;
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('loading')}...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Assets */}
      {selectedAssets.length > 0 && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">
              {t('selectedAssets')} ({selectedAssets.length}/{maxSelection})
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="h-7 text-xs"
            >
              {t('clearAll')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedAssets.map(symbol => {
              const crypto = allCryptos.find(c => c.symbol === symbol);
              return (
                <Badge
                  key={symbol}
                  variant="secondary"
                  className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
                  onClick={() => toggleAsset(symbol)}
                >
                  {symbol}
                  {crypto && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {crypto.name}
                    </span>
                  )}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchCryptocurrencies') || 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder={t('category') || 'Category'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories') || 'All Categories'}</SelectItem>
            <SelectItem value="major">{t('major') || 'Major'}</SelectItem>
            <SelectItem value="defi">DeFi</SelectItem>
            <SelectItem value="layer1">Layer 1</SelectItem>
            <SelectItem value="layer2">Layer 2</SelectItem>
            <SelectItem value="ai">AI</SelectItem>
            <SelectItem value="gaming">{t('gaming') || 'Gaming'}</SelectItem>
            <SelectItem value="meme">Meme</SelectItem>
            <SelectItem value="stablecoin">Stablecoin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
          <SelectTrigger>
            <SelectValue placeholder={t('riskLevel') || 'Risk Level'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRiskLevels') || 'All Risk Levels'}</SelectItem>
            <SelectItem value="low">{t('lowRisk') || 'Low Risk'}</SelectItem>
            <SelectItem value="medium">{t('mediumRisk') || 'Medium Risk'}</SelectItem>
            <SelectItem value="high">{t('highRisk') || 'High Risk'}</SelectItem>
            <SelectItem value="very-high">{t('veryHighRisk') || 'Very High Risk'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Crypto List */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="grid">{t('grid') || 'Grid View'}</TabsTrigger>
          <TabsTrigger value="category">{t('byCategory') || 'By Category'}</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-4">
          <ScrollArea className="h-[400px] rounded-lg border p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredCryptos.map((crypto) => {
                const isSelected = selectedAssets.includes(crypto.symbol);
                return (
                  <div
                    key={crypto.symbol}
                    onClick={() => toggleAsset(crypto.symbol)}
                    className={`
                      relative p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(crypto.category)}
                        <span className="font-bold text-sm">{crypto.symbol}</span>
                      </div>
                      {prices.has(crypto.symbol) && (
                        <div className={`flex items-center text-xs ${
                          prices.get(crypto.symbol)!.priceChange24h >= 0 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          {prices.get(crypto.symbol)!.priceChange24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="ml-0.5">
                            {Math.abs(prices.get(crypto.symbol)!.priceChange24h).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                      {crypto.name}
                    </p>

                    {prices.has(crypto.symbol) && (
                      <p className="text-xs font-semibold mb-2">
                        {convertAndFormat(prices.get(crypto.symbol)!.price, 'EUR', currency)}
                      </p>
                    )}

                    <Badge
                      variant="outline"
                      className={`text-xs ${getRiskColor(crypto.riskLevel)}`}
                    >
                      {crypto.riskLevel.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {filteredCryptos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('noResultsFound') || 'No cryptocurrencies found'}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="category" className="mt-4">
          <ScrollArea className="h-[400px] rounded-lg border p-4">
            {Object.entries(groupedCryptos).map(([category, cryptos]) => {
              const filtered = cryptos.filter(crypto =>
                filteredCryptos.some(fc => fc.symbol === crypto.symbol)
              );

              if (filtered.length === 0) return null;

              return (
                <div key={category} className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="capitalize">{category}</span>
                    <Badge variant="secondary" className="text-xs">
                      {filtered.length}
                    </Badge>
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {filtered.map((crypto) => {
                      const isSelected = selectedAssets.includes(crypto.symbol);
                      return (
                        <div
                          key={crypto.symbol}
                          onClick={() => toggleAsset(crypto.symbol)}
                          className={`
                            relative p-2 rounded border cursor-pointer text-sm
                            ${isSelected
                              ? 'border-primary bg-primary/10 font-medium'
                              : 'border-border hover:border-primary/50'
                            }
                          `}
                        >
                          {isSelected && (
                            <Check className="absolute top-1 right-1 w-3 h-3 text-primary" />
                          )}
                          {crypto.symbol}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center">
        {t('cryptoSelectorHint') || `Select up to ${maxSelection} cryptocurrencies for your trading agent`}
      </p>
    </div>
  );
}
