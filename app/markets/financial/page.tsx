"use client";

import { Card } from '@/components/ui/card';
import { useFinancialMarkets } from '@/hooks/use-financial-markets';
import { formatCurrency } from '@/lib/utils';
import { TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import Layout from "@/components/finflow/layout";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from '@/components/finflow/CurrencyContext';

export default function FinancialMarketsPage() {
  const { markets, isLoading, error } = useFinancialMarkets();
  const { user } = useAuth();
  const { currency: selectedCurrency } = useCurrency();

  return (
    <Layout user={user}>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Finanzmärkte</h1>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {markets.map((market) => (
              <Card key={market.id} className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {market.symbol}
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(market.price, selectedCurrency)}
                      </p>
                    </div>
                    <div
                      className={`flex items-center ${
                        market.change >= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {market.change >= 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {market.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Eröffnung</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(market.open, selectedCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Höchststand</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(market.high, selectedCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tiefststand</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(market.low, selectedCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Volumen</span>
                      <span className="text-sm font-medium">
                        {market.volume.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Letzte Aktualisierung</span>
                      <span className="text-sm font-medium">
                        {new Date(market.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 