'use client';

import { useQuery } from '@tanstack/react-query';

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  lastUpdated: string;
}

interface BinancePair {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  quoteVolume: string;
}

interface BinanceSymbolInfo {
  symbol: string;
  baseAssetPrecision: number;
}

interface BinanceExchangeInfo {
  symbols: BinanceSymbolInfo[];
}

interface CoinGeckoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap: number;
  market_cap_rank: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
}

// Binance API für Kryptowährungsdaten
const fetchCryptoData = async (): Promise<CryptoData[]> => {
  try {
    // Informationen über die Top-Kryptowährungen von der Binance API abrufen
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Kryptodaten von Binance');
    }
    
    // Alle Symbole abrufen für zusätzliche Informationen
    const exchangeInfoResponse = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    if (!exchangeInfoResponse.ok) {
      throw new Error('Fehler beim Abrufen der Kryptodaten von Binance');
    }
    
    const exchangeInfoData: BinanceExchangeInfo = await exchangeInfoResponse.json();
    const cryptoData: BinancePair[] = await response.json();
    
    // Filter für USDT-Paare (die beliebtesten)
    const usdtPairs = cryptoData.filter((pair: BinancePair) => 
      pair.symbol.endsWith('USDT') && !pair.symbol.includes('UP') && !pair.symbol.includes('DOWN') && !pair.symbol.includes('BEAR') && !pair.symbol.includes('BULL')
    );
    
    // Nach Handelsvolumen sortieren und die Top 20 auswählen
    const topPairs = usdtPairs
      .sort((a: BinancePair, b: BinancePair) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 20);
    
    // Kryptowährungssymbole für die MarketCap-Daten von CoinGecko
    const cryptoSymbols = topPairs.map((pair: BinancePair) => pair.symbol.replace('USDT', '').toLowerCase());
    
    // CoinGecko API für zusätzliche Daten verwenden
    const coinGeckoResponse = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cryptoSymbols.join(',')}&order=market_cap_desc&per_page=20&page=1&sparkline=false&locale=en`);
    let coinGeckoData: CoinGeckoData[] = [];
    
    if (coinGeckoResponse.ok) {
      coinGeckoData = await coinGeckoResponse.json();
    }
    
    // Ein Mapping für CoinGecko-Daten erstellen, um einfachen Zugriff zu haben
    const coinGeckoMap = new Map<string, CoinGeckoData>();
    coinGeckoData.forEach((coin: CoinGeckoData) => {
      coinGeckoMap.set(coin.symbol.toUpperCase(), coin);
    });
    
    // Informationen aus beiden APIs zusammenführen
    return topPairs.map((pair: BinancePair, index: number) => {
      const symbol = pair.symbol.replace('USDT', '');
      const coinGeckoInfo = coinGeckoMap.get(symbol);
      
      const symbolInfo = exchangeInfoData.symbols.find((s: BinanceSymbolInfo) => s.symbol === pair.symbol);
      const baseAssetPrecision = symbolInfo?.baseAssetPrecision || 8;
      
      return {
        id: coinGeckoInfo?.id || symbol.toLowerCase(),
        symbol: symbol.toLowerCase(),
        name: coinGeckoInfo?.name || symbol,
        image: coinGeckoInfo?.image || `https://cryptoicons.org/api/icon/${symbol.toLowerCase()}/64`,
        currentPrice: parseFloat(pair.lastPrice),
        marketCap: coinGeckoInfo?.market_cap || 0,
        marketCapRank: coinGeckoInfo?.market_cap_rank || index + 1,
        volume24h: parseFloat(pair.quoteVolume),
        priceChange24h: parseFloat(pair.priceChange),
        priceChangePercentage24h: parseFloat(pair.priceChangePercent),
        circulatingSupply: coinGeckoInfo?.circulating_supply || 0,
        totalSupply: coinGeckoInfo?.total_supply || 0,
        maxSupply: coinGeckoInfo?.max_supply || null,
        lastUpdated: new Date().toISOString()
      };
    });
  } catch (error) {
    // Fallback zu den Beispieldaten im Fehlerfall
    return getFallbackCryptoData();
  }
};

// Fallback-Funktion für den Fall, dass die API nicht verfügbar ist
const getFallbackCryptoData = (): CryptoData[] => {
  
  return [
    {
      id: "bitcoin",
      symbol: "btc",
      name: "Bitcoin",
      image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      currentPrice: 64287.45,
      marketCap: 1262384703341,
      marketCapRank: 1,
      volume24h: 22382926071,
      priceChange24h: -182.32,
      priceChangePercentage24h: -0.28,
      circulatingSupply: 19678475,
      totalSupply: 21000000,
      maxSupply: 21000000,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "ethereum",
      symbol: "eth",
      name: "Ethereum",
      image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
      currentPrice: 3059.37,
      marketCap: 367780419294,
      marketCapRank: 2,
      volume24h: 10876542981,
      priceChange24h: 15.43,
      priceChangePercentage24h: 0.51,
      circulatingSupply: 120250507,
      totalSupply: 120250507,
      maxSupply: null,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "tether",
      symbol: "usdt",
      name: "Tether",
      image: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png",
      currentPrice: 0.999,
      marketCap: 102724251558,
      marketCapRank: 3,
      volume24h: 26382926071,
      priceChange24h: -0.0001,
      priceChangePercentage24h: -0.01,
      circulatingSupply: 102724251558,
      totalSupply: 102724251558,
      maxSupply: null,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "binancecoin",
      symbol: "bnb",
      name: "BNB",
      image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
      currentPrice: 605.37,
      marketCap: 91324235159,
      marketCapRank: 4,
      volume24h: 987654321,
      priceChange24h: 7.21,
      priceChangePercentage24h: 1.2,
      circulatingSupply: 151000000,
      totalSupply: 165000000,
      maxSupply: 165000000,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "solana",
      symbol: "sol",
      name: "Solana",
      image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
      currentPrice: 142.87,
      marketCap: 62587458974,
      marketCapRank: 5,
      volume24h: 1875496321,
      priceChange24h: 3.56,
      priceChangePercentage24h: 2.55,
      circulatingSupply: 438500000,
      totalSupply: 558750000,
      maxSupply: null,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "ripple",
      symbol: "xrp",
      name: "XRP",
      image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
      currentPrice: 0.51,
      marketCap: 28074235159,
      marketCapRank: 6,
      volume24h: 754321987,
      priceChange24h: 0.001,
      priceChangePercentage24h: 0.2,
      circulatingSupply: 55000000000,
      totalSupply: 100000000000,
      maxSupply: 100000000000,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "cardano",
      symbol: "ada",
      name: "Cardano",
      image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
      currentPrice: 0.45,
      marketCap: 15984753621,
      marketCapRank: 7,
      volume24h: 254789631,
      priceChange24h: 0.01,
      priceChangePercentage24h: 2.27,
      circulatingSupply: 35500000000,
      totalSupply: 45000000000,
      maxSupply: 45000000000,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "dogecoin",
      symbol: "doge",
      name: "Dogecoin",
      image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
      currentPrice: 0.14,
      marketCap: 20123456789,
      marketCapRank: 8,
      volume24h: 852147963,
      priceChange24h: 0.004,
      priceChangePercentage24h: 2.94,
      circulatingSupply: 143650000000,
      totalSupply: 143650000000,
      maxSupply: null,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "polkadot",
      symbol: "dot",
      name: "Polkadot",
      image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
      currentPrice: 6.73,
      marketCap: 9854123678,
      marketCapRank: 9,
      volume24h: 185274963,
      priceChange24h: 0.12,
      priceChangePercentage24h: 1.82,
      circulatingSupply: 1463500000,
      totalSupply: 1201500000,
      maxSupply: null,
      lastUpdated: new Date().toISOString()
    },
    {
      id: "shiba-inu",
      symbol: "shib",
      name: "Shiba Inu",
      image: "https://assets.coingecko.com/coins/images/11939/large/shiba.png",
      currentPrice: 0.000022,
      marketCap: 12987453216,
      marketCapRank: 10,
      volume24h: 354126789,
      priceChange24h: 0.000001,
      priceChangePercentage24h: 4.76,
      circulatingSupply: 589600000000000,
      totalSupply: 999900000000000,
      maxSupply: null,
      lastUpdated: new Date().toISOString()
    }
  ];
};

export function useCrypto() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['crypto'],
    queryFn: fetchCryptoData,
    refetchInterval: 60000, // Aktualisiere Daten jede Minute
  });

  return {
    cryptos: data,
    isLoading,
    error,
  };
}
