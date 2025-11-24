'use client';

import { useQuery } from '@tanstack/react-query';

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  dayHigh?: number;
  dayLow?: number;
  yearHigh?: number;
  yearLow?: number;
  lastUpdated: string;
}

export interface StockIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface CommodityData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  lastUpdated: string;
}

interface MarketsResponse {
  stocks: MarketData[];
  indices: StockIndex[];
  commodities: CommodityData[];
  forex: {
    baseCurrency: string;
    targetCurrency: string;
    rate: number;
    change: number;
    changePercent: number;
    lastUpdated: string;
  }[];
}

// Yahoo Finance API für Marktdaten
const fetchMarketData = async (): Promise<MarketsResponse> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_YAHOO_FINANCE_API_KEY || 'demo';
    
    // Aktien abrufen
    const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
    const stocksResponse = await fetch(`https://yfapi.net/v6/finance/quote?region=US&lang=en&symbols=${stockSymbols.join(',')}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    // Indizes abrufen
    const indexSymbols = ['^SPX', '^DJI', '^IXIC', '^GDAXI', '^N225'];
    const indicesResponse = await fetch(`https://yfapi.net/v6/finance/quote?region=US&lang=en&symbols=${indexSymbols.join(',')}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    // Rohstoffe abrufen
    const commoditySymbols = ['GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F'];
    const commoditiesResponse = await fetch(`https://yfapi.net/v6/finance/quote?region=US&lang=en&symbols=${commoditySymbols.join(',')}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    // Forex abrufen
    const forexPairs = ['EURUSD=X', 'USDJPY=X', 'GBPUSD=X', 'USDCHF=X', 'USDCAD=X'];
    const forexResponse = await fetch(`https://yfapi.net/v6/finance/quote?region=US&lang=en&symbols=${forexPairs.join(',')}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    // Verarbeiten der API-Antworten
    const stocksData = await stocksResponse.json();
    const indicesData = await indicesResponse.json();
    const commoditiesData = await commoditiesResponse.json();
    const forexData = await forexResponse.json();
    
    // Mappingfunktion für die Aktien
    const mapStocks = (apiData: any): MarketData[] => {
      if (!apiData.quoteResponse || !apiData.quoteResponse.result) {
        return [];
      }
      
      return apiData.quoteResponse.result.map((item: any) => ({
        symbol: item.symbol,
        name: item.shortName || item.longName || item.symbol,
        price: item.regularMarketPrice || 0,
        change: item.regularMarketChange || 0,
        changePercent: item.regularMarketChangePercent || 0,
        volume: item.regularMarketVolume || 0,
        marketCap: item.marketCap || 0,
        dayHigh: item.regularMarketDayHigh || 0,
        dayLow: item.regularMarketDayLow || 0,
        yearHigh: item.fiftyTwoWeekHigh || 0,
        yearLow: item.fiftyTwoWeekLow || 0,
        lastUpdated: new Date().toISOString(),
      }));
    };
    
    // Mapping für Indizes
    const mapIndices = (apiData: any): StockIndex[] => {
      if (!apiData.quoteResponse || !apiData.quoteResponse.result) {
        return [];
      }
      
      return apiData.quoteResponse.result.map((item: any) => ({
        symbol: item.symbol,
        name: item.shortName || item.longName || item.symbol,
        price: item.regularMarketPrice || 0,
        change: item.regularMarketChange || 0,
        changePercent: item.regularMarketChangePercent || 0,
        lastUpdated: new Date().toISOString(),
      }));
    };
    
    // Mapping für Rohstoffe
    const mapCommodities = (apiData: any): CommodityData[] => {
      if (!apiData.quoteResponse || !apiData.quoteResponse.result) {
        return [];
      }
      
      const unitMapping: Record<string, string> = {
        'GC=F': 'oz',
        'SI=F': 'oz',
        'CL=F': 'bbl',
        'NG=F': 'MMBtu',
        'HG=F': 'lb',
      };
      
      return apiData.quoteResponse.result.map((item: any) => ({
        symbol: item.symbol,
        name: item.shortName || item.longName || item.symbol,
        price: item.regularMarketPrice || 0,
        change: item.regularMarketChange || 0,
        changePercent: item.regularMarketChangePercent || 0,
        unit: unitMapping[item.symbol] || 'unit',
        lastUpdated: new Date().toISOString(),
      }));
    };
    
    // Mapping für Forex
    const mapForex = (apiData: any): { baseCurrency: string; targetCurrency: string; rate: number; change: number; changePercent: number; lastUpdated: string; }[] => {
      if (!apiData.quoteResponse || !apiData.quoteResponse.result) {
        return [];
      }
      
      return apiData.quoteResponse.result.map((item: any) => {
        const symbolParts = item.symbol.replace('=X', '').split('');
        return {
          baseCurrency: symbolParts.slice(0, 3).join(''),
          targetCurrency: symbolParts.slice(3).join(''),
          rate: item.regularMarketPrice || 0,
          change: item.regularMarketChange || 0,
          changePercent: item.regularMarketChangePercent || 0,
          lastUpdated: new Date().toISOString(),
        };
      });
    };
    
    // Daten in das erforderliche Format umwandeln
    return {
      stocks: mapStocks(stocksData),
      indices: mapIndices(indicesData),
      commodities: mapCommodities(commoditiesData),
      forex: mapForex(forexData),
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Marktdaten:', error);
    
    // Fallback zu unseren Beispieldaten im Fehlerfall
    return getFallbackMarketData();
  }
};

// Fallback-Funktion für den Fall, dass die API nicht verfügbar ist
const getFallbackMarketData = (): MarketsResponse => {
  
  return {
    stocks: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 178.72,
        change: 2.35,
        changePercent: 1.33,
        volume: 59482900,
        marketCap: 2800000000000,
        dayHigh: 179.43,
        dayLow: 176.81,
        yearHigh: 199.62,
        yearLow: 124.17,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        price: 417.88,
        change: 4.28,
        changePercent: 1.03,
        volume: 25972300,
        marketCap: 3100000000000,
        dayHigh: 418.41,
        dayLow: 413.85,
        yearHigh: 420.82,
        yearLow: 247.26,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com, Inc.',
        price: 182.81,
        change: 3.35,
        changePercent: 1.87,
        volume: 38762200,
        marketCap: 1900000000000,
        dayHigh: 183.92,
        dayLow: 180.61,
        yearHigh: 185.10,
        yearLow: 101.15,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 165.92,
        change: 1.48,
        changePercent: 0.90,
        volume: 22881400,
        marketCap: 2050000000000,
        dayHigh: 166.39,
        dayLow: 164.25,
        yearHigh: 171.68,
        yearLow: 120.21,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'META',
        name: 'Meta Platforms, Inc.',
        price: 474.99,
        change: 8.21,
        changePercent: 1.76,
        volume: 14923600,
        marketCap: 1210000000000,
        dayHigh: 477.50,
        dayLow: 467.42,
        yearHigh: 531.49,
        yearLow: 296.66,
        lastUpdated: new Date().toISOString(),
      },
    ],
    indices: [
      {
        symbol: '^SPX',
        name: 'S&P 500',
        price: 5069.53,
        change: 51.54,
        changePercent: 1.03,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: '^DJI',
        name: 'Dow Jones Industrial Average',
        price: 38239.98,
        change: 259.57,
        changePercent: 0.68,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: '^IXIC',
        name: 'NASDAQ Composite',
        price: 15927.90,
        change: 169.30,
        changePercent: 1.08,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: '^GDAXI',
        name: 'DAX Performance Index',
        price: 18161.01,
        change: 51.07,
        changePercent: 0.28,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: '^N225',
        name: 'Nikkei 225',
        price: 37934.76,
        change: 155.20,
        changePercent: 0.41,
        lastUpdated: new Date().toISOString(),
      },
    ],
    commodities: [
      {
        symbol: 'GC=F',
        name: 'Gold',
        price: 2306.10,
        change: 8.30,
        changePercent: 0.36,
        unit: 'oz',
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'SI=F',
        name: 'Silver',
        price: 27.08,
        change: 0.16,
        changePercent: 0.60,
        unit: 'oz',
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'CL=F',
        name: 'Crude Oil',
        price: 83.85,
        change: 0.20,
        changePercent: 0.24,
        unit: 'bbl',
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'NG=F',
        name: 'Natural Gas',
        price: 1.91,
        change: -0.03,
        changePercent: -1.80,
        unit: 'MMBtu',
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'HG=F',
        name: 'Copper',
        price: 4.52,
        change: 0.05,
        changePercent: 1.12,
        unit: 'lb',
        lastUpdated: new Date().toISOString(),
      },
    ],
    forex: [
      {
        baseCurrency: 'EUR',
        targetCurrency: 'USD',
        rate: 1.0702,
        change: 0.0009,
        changePercent: 0.08,
        lastUpdated: new Date().toISOString(),
      },
      {
        baseCurrency: 'USD',
        targetCurrency: 'JPY',
        rate: 157.53,
        change: 0.10,
        changePercent: 0.06,
        lastUpdated: new Date().toISOString(),
      },
      {
        baseCurrency: 'GBP',
        targetCurrency: 'USD',
        rate: 1.2510,
        change: 0.0016,
        changePercent: 0.13,
        lastUpdated: new Date().toISOString(),
      },
      {
        baseCurrency: 'USD',
        targetCurrency: 'CHF',
        rate: 0.9051,
        change: -0.0005,
        changePercent: -0.05,
        lastUpdated: new Date().toISOString(),
      },
      {
        baseCurrency: 'USD',
        targetCurrency: 'CAD',
        rate: 1.3621,
        change: -0.0018,
        changePercent: -0.13,
        lastUpdated: new Date().toISOString(),
      },
    ],
  };
};

export function useMarkets() {
  const { data: markets, isLoading, error } = useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarketData,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  return {
    markets: markets || {
      stocks: [],
      indices: [],
      commodities: [],
      forex: []
    },
    isLoading,
    error: error as Error | null
  };
}
