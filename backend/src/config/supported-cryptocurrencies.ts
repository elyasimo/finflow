/**
 * Supported Cryptocurrencies for Trading
 * Updated: November 2024
 * All coins supported by Binance with EUR trading pairs
 */

export interface CryptocurrencyInfo {
  symbol: string;
  name: string;
  category: 'major' | 'defi' | 'layer1' | 'layer2' | 'meme' | 'stablecoin' | 'ai' | 'gaming';
  minNotional: number; // Minimum trade value in EUR
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  description: string;
}

export const SUPPORTED_CRYPTOCURRENCIES: CryptocurrencyInfo[] = [
  // Major Cryptocurrencies (Low Risk)
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'major',
    minNotional: 10,
    riskLevel: 'low',
    description: 'The first and largest cryptocurrency by market cap',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'low',
    description: 'Leading smart contract platform',
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    category: 'major',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Binance exchange native token',
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    category: 'major',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Digital payment protocol for financial institutions',
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Proof-of-stake blockchain platform',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'High-performance blockchain for DeFi and NFTs',
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Multi-chain protocol for interoperability',
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Fast smart contracts platform',
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    category: 'layer2',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Ethereum scaling solution',
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    category: 'defi',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Decentralized oracle network',
  },

  // DeFi Tokens
  {
    symbol: 'UNI',
    name: 'Uniswap',
    category: 'defi',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Leading decentralized exchange',
  },
  {
    symbol: 'AAVE',
    name: 'Aave',
    category: 'defi',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Decentralized lending protocol',
  },
  {
    symbol: 'MKR',
    name: 'Maker',
    category: 'defi',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Governance token for MakerDAO',
  },
  {
    symbol: 'SUSHI',
    name: 'SushiSwap',
    category: 'defi',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Decentralized exchange and AMM',
  },
  {
    symbol: 'CRV',
    name: 'Curve DAO',
    category: 'defi',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Stablecoin exchange protocol',
  },

  // Layer 1 Blockchains
  {
    symbol: 'ATOM',
    name: 'Cosmos',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Internet of blockchains',
  },
  {
    symbol: 'ALGO',
    name: 'Algorand',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Pure proof-of-stake blockchain',
  },
  {
    symbol: 'XLM',
    name: 'Stellar',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Payment and remittance network',
  },
  {
    symbol: 'VET',
    name: 'VeChain',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Supply chain blockchain',
  },
  {
    symbol: 'FIL',
    name: 'Filecoin',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Decentralized storage network',
  },
  {
    symbol: 'NEAR',
    name: 'Near Protocol',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Sharded proof-of-stake blockchain',
  },
  {
    symbol: 'APT',
    name: 'Aptos',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'high',
    description: 'High-performance Layer 1 blockchain',
  },
  {
    symbol: 'SUI',
    name: 'Sui',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Layer 1 blockchain with parallel execution',
  },

  // Layer 2 Solutions
  {
    symbol: 'ARB',
    name: 'Arbitrum',
    category: 'layer2',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Ethereum Layer 2 scaling solution',
  },
  {
    symbol: 'OP',
    name: 'Optimism',
    category: 'layer2',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Ethereum Layer 2 optimistic rollup',
  },

  // AI & Data Tokens
  {
    symbol: 'FET',
    name: 'Fetch.ai',
    category: 'ai',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Autonomous AI agents network',
  },
  // AGIX merged into FET - removed
  {
    symbol: 'GRT',
    name: 'The Graph',
    category: 'ai',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Indexing protocol for blockchain data',
  },

  // Gaming & Metaverse
  {
    symbol: 'SAND',
    name: 'The Sandbox',
    category: 'gaming',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Decentralized gaming metaverse',
  },
  {
    symbol: 'MANA',
    name: 'Decentraland',
    category: 'gaming',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Virtual reality platform',
  },
  {
    symbol: 'AXS',
    name: 'Axie Infinity',
    category: 'gaming',
    minNotional: 10,
    riskLevel: 'very-high',
    description: 'Play-to-earn gaming ecosystem',
  },
  {
    symbol: 'IMX',
    name: 'Immutable X',
    category: 'gaming',
    minNotional: 10,
    riskLevel: 'high',
    description: 'NFT Layer 2 for gaming',
  },

  // Meme Coins (High Risk)
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    category: 'meme',
    minNotional: 10,
    riskLevel: 'very-high',
    description: 'Original meme cryptocurrency',
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    category: 'meme',
    minNotional: 10,
    riskLevel: 'very-high',
    description: 'Dogecoin competitor meme token',
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    category: 'meme',
    minNotional: 10,
    riskLevel: 'very-high',
    description: 'Frog-themed meme token',
  },

  // Stablecoins (Low Risk, for liquidity)
  {
    symbol: 'USDT',
    name: 'Tether',
    category: 'stablecoin',
    minNotional: 10,
    riskLevel: 'low',
    description: 'USD-pegged stablecoin',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    category: 'stablecoin',
    minNotional: 10,
    riskLevel: 'low',
    description: 'Regulated USD stablecoin',
  },

  // Privacy Coins
  {
    symbol: 'XMR',
    name: 'Monero',
    category: 'major',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Privacy-focused cryptocurrency',
  },

  // Others
  {
    symbol: 'LTC',
    name: 'Litecoin',
    category: 'major',
    minNotional: 10,
    riskLevel: 'low',
    description: 'Silver to Bitcoin\'s gold',
  },
  {
    symbol: 'BCH',
    name: 'Bitcoin Cash',
    category: 'major',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Bitcoin fork for payments',
  },
  {
    symbol: 'ETC',
    name: 'Ethereum Classic',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Original Ethereum chain',
  },
  {
    symbol: 'XTZ',
    name: 'Tezos',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Self-amending blockchain',
  },
  {
    symbol: 'EOS',
    name: 'EOS',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Delegated proof-of-stake platform',
  },
  {
    symbol: 'TRX',
    name: 'TRON',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Decentralized content sharing',
  },
  {
    symbol: 'HBAR',
    name: 'Hedera',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'medium',
    description: 'Hashgraph consensus network',
  },
  {
    symbol: 'QNT',
    name: 'Quant',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Enterprise blockchain interoperability',
  },
  {
    symbol: 'ICP',
    name: 'Internet Computer',
    category: 'layer1',
    minNotional: 10,
    riskLevel: 'high',
    description: 'Decentralized internet infrastructure',
  },
];

/**
 * Get cryptocurrency by symbol
 */
export function getCryptocurrency(symbol: string): CryptocurrencyInfo | undefined {
  return SUPPORTED_CRYPTOCURRENCIES.find(c => c.symbol === symbol);
}

/**
 * Get all symbols
 */
export function getAllSymbols(): string[] {
  return SUPPORTED_CRYPTOCURRENCIES.map(c => c.symbol);
}

/**
 * Get cryptocurrencies by category
 */
export function getCryptocurrenciesByCategory(category: CryptocurrencyInfo['category']): CryptocurrencyInfo[] {
  return SUPPORTED_CRYPTOCURRENCIES.filter(c => c.category === category);
}

/**
 * Get cryptocurrencies by risk level
 */
export function getCryptocurrenciesByRisk(riskLevel: CryptocurrencyInfo['riskLevel']): CryptocurrencyInfo[] {
  return SUPPORTED_CRYPTOCURRENCIES.filter(c => c.riskLevel === riskLevel);
}

/**
 * Validate if symbols are supported
 */
export function validateSymbols(symbols: string[]): { valid: string[]; invalid: string[] } {
  const allSymbols = getAllSymbols();
  const valid = symbols.filter(s => allSymbols.includes(s));
  const invalid = symbols.filter(s => !allSymbols.includes(s));
  return { valid, invalid };
}
