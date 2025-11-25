// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarkets } from "@/hooks/use-markets";
import { useCryptoMarkets } from '@/hooks/use-crypto-markets';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import Layout from "@/components/finflow/layout";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from '@/components/finflow/CurrencyContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function MarketsPage() {
  const { markets, isLoading, error } = useMarkets();
  const { markets: cryptoMarkets, isLoading: cryptoLoading, error: cryptoError } = useCryptoMarkets();
  const { user } = useAuth();
  const { currency: selectedCurrency } = useCurrency();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Formatierungsfunktionen
  const formatCurrency = (value: number) => {
    return formatCurrencyOrig(value, selectedCurrency);
  };
  
  const formatCurrencyOrig = (value: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('de-DE').format(value);
  };
  
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };
  
  const formatMarketCap = (value: number) => {
    if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toFixed(2)} Billionen €`;
    } else if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)} Milliarden €`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)} Millionen €`;
    } else {
      return formatCurrency(value);
    }
  };
  
  // Filterfunktion basierend auf Suchbegriff
  const filterBySearch = (items: any[], fields: string[]) => {
    if (!searchQuery) return items;
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return items.filter(item => 
      fields.some(field => 
        item[field]?.toString().toLowerCase().includes(lowercaseQuery)
      )
    );
  };
  
  // Gefilterte Daten
  const filteredStocks = markets?.stocks ? 
    filterBySearch(markets.stocks, ['symbol', 'name']) : [];
  
  const filteredIndices = markets?.indices ? 
    filterBySearch(markets.indices, ['symbol', 'name']) : [];
  
  const filteredCommodities = markets?.commodities ? 
    filterBySearch(markets.commodities, ['symbol', 'name']) : [];
  
  const filteredForex = markets?.forex ? 
    filterBySearch(markets.forex, ['baseCurrency', 'targetCurrency']) : [];

  // Timestamp für letzte Aktualisierung
  const lastUpdated = markets?.stocks?.[0]?.lastUpdated ? 
    new Date(markets.stocks[0].lastUpdated).toLocaleString('de-DE') : '';

  return (
    <Layout user={user}>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('markets')}</h1>
        </div>

        <Tabs defaultValue="stocks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="crypto">{t('cryptocurrencies')}</TabsTrigger>
            <TabsTrigger value="stocks">{t('stocks')}</TabsTrigger>
            <TabsTrigger value="indices">{t('indices')}</TabsTrigger>
            <TabsTrigger value="commodities">{t('commodities')}</TabsTrigger>
            <TabsTrigger value="forex">{t('forex')}</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-destructive">{error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'}</p>
            </div>
          ) : (
            <>
              <TabsContent value="crypto" className="space-y-4">
                {cryptoLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : cryptoError ? (
                  <div className="flex justify-center items-center h-64">
                    <p className="text-destructive">{cryptoError instanceof Error ? cryptoError.message : t('anErrorOccurred')}</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cryptoMarkets.map((market) => {
                      const baseSymbol = market.symbol.replace('EUR', '').replace('USDT', '').toLowerCase();
                      const logoUrl = `/logos/cryptocurrency/${baseSymbol}.png`;
                      return (
                        <Card key={market.id} className="p-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={logoUrl}
                                  alt={`${baseSymbol} logo`}
                                  className="w-8 h-8"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/logos/cryptocurrency/default.png';
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {market.symbol}
                                  </p>
                                  <p className="text-2xl font-bold">
                                    {formatCurrency(market.current_price)}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`flex items-center ${
                                  market.price_change_percentage_24h >= 0
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }`}
                              >
                                {market.price_change_percentage_24h >= 0 ? (
                                  <span className="text-sm font-medium">▲ {market.price_change_percentage_24h?.toFixed(2) || '0.00'}%</span>
                                ) : (
                                  <span className="text-sm font-medium">▼ {Math.abs(market.price_change_percentage_24h || 0).toFixed(2)}%</span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{t('marketCap')}</span>
                                <span className="text-sm font-medium">
                                  {market.market_cap ? formatMarketCap(market.market_cap) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{t('volume')}</span>
                                <span className="text-sm font-medium">
                                  {market.total_volume ? formatMarketCap(market.total_volume) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{t('high')} 24h</span>
                                <span className="text-sm font-medium">
                                  {market.high_24h ? formatCurrency(market.high_24h) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{t('low')} 24h</span>
                                <span className="text-sm font-medium">
                                  {market.low_24h ? formatCurrency(market.low_24h) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stocks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('stocks')}</CardTitle>
                    <CardDescription>
                      {t('lastUpdated')}: {lastUpdated}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('symbol')}</TableHead>
                          <TableHead>{t('name')}</TableHead>
                          <TableHead className="text-right">{t('price')}</TableHead>
                          <TableHead className="text-right">{t('change24h')}</TableHead>
                          <TableHead className="text-right">{t('volume')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStocks.map((stock) => (
                          <TableRow key={stock.symbol}>
                            <TableCell className="font-medium">{stock.symbol}</TableCell>
                            <TableCell>{stock.name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(stock.price)}</TableCell>
                            <TableCell className={`text-right ${stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatPercentage(stock.changePercent)}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(stock.volume)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="indices" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('indices')}</CardTitle>
                    <CardDescription>
                      {t('lastUpdated')}: {lastUpdated}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('symbol')}</TableHead>
                          <TableHead>{t('name')}</TableHead>
                          <TableHead className="text-right">{t('value')}</TableHead>
                          <TableHead className="text-right">{t('change24h')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredIndices.map((index) => (
                          <TableRow key={index.symbol}>
                            <TableCell className="font-medium">{index.symbol}</TableCell>
                            <TableCell>{index.name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(index.price)}</TableCell>
                            <TableCell className={`text-right ${index.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatPercentage(index.changePercent)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commodities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('commodities')}</CardTitle>
                    <CardDescription>
                      {t('lastUpdated')}: {lastUpdated}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('symbol')}</TableHead>
                          <TableHead>{t('name')}</TableHead>
                          <TableHead className="text-right">{t('price')}</TableHead>
                          <TableHead className="text-right">{t('change24h')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCommodities.map((commodity) => (
                          <TableRow key={commodity.symbol}>
                            <TableCell className="font-medium">{commodity.symbol}</TableCell>
                            <TableCell>{commodity.name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(commodity.price)}</TableCell>
                            <TableCell className={`text-right ${commodity.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatPercentage(commodity.changePercent)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="forex" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('forex')}</CardTitle>
                    <CardDescription>
                      {t('lastUpdated')}: {lastUpdated}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('pair')}</TableHead>
                          <TableHead className="text-right">{t('rate')}</TableHead>
                          <TableHead className="text-right">{t('change24h')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredForex.map((pair) => (
                          <TableRow key={`${pair.baseCurrency}/${pair.targetCurrency}`}>
                            <TableCell className="font-medium">
                              {pair.baseCurrency}/{pair.targetCurrency}
                            </TableCell>
                            <TableCell className="text-right">{pair.rate.toFixed(4)}</TableCell>
                            <TableCell className={`text-right ${pair.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatPercentage(pair.changePercent)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
