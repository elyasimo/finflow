/**
 * Stock Trading Configuration
 * 100+ SICHERE AKTIEN aus der ganzen Welt
 * Fokus auf: Blue Chips, Dividenden-Aristokraten, ETFs
 */

export interface StockConfig {
  symbol: string;
  name: string;
  sector: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  country?: string;
}

export const SUPPORTED_STOCKS: StockConfig[] = [
  // ========================================
  // DIVIDENDEN-ARISTOKRATEN USA (LOW RISK)
  // 25+ Jahre Dividendenwachstum
  // ========================================

  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    sector: 'Healthcare',
    riskLevel: 'low',
    country: 'USA',
    description: 'Pharma & Healthcare - 60+ Jahre Dividendenwachstum',
  },
  {
    symbol: 'PG',
    name: 'Procter & Gamble',
    sector: 'Consumer Goods',
    riskLevel: 'low',
    country: 'USA',
    description: 'Consumer Goods - Pampers, Gillette, Oral-B',
  },
  {
    symbol: 'KO',
    name: 'Coca-Cola',
    sector: 'Consumer Goods',
    riskLevel: 'low',
    country: 'USA',
    description: 'Getränke - 200+ Länder, stabile Cashflows',
  },
  {
    symbol: 'PEP',
    name: 'PepsiCo',
    sector: 'Consumer Goods',
    riskLevel: 'low',
    country: 'USA',
    description: 'Getränke & Snacks - Lay\'s, Gatorade, Pepsi',
  },
  {
    symbol: 'MCD',
    name: 'McDonald\'s',
    sector: 'Consumer Goods',
    riskLevel: 'low',
    country: 'USA',
    description: 'Fast Food - 40.000+ Restaurants weltweit',
  },
  {
    symbol: 'WMT',
    name: 'Walmart',
    sector: 'Retail',
    riskLevel: 'low',
    country: 'USA',
    description: 'Retail - Größter Einzelhändler der Welt',
  },
  {
    symbol: 'TGT',
    name: 'Target Corporation',
    sector: 'Retail',
    riskLevel: 'low',
    country: 'USA',
    description: 'Retail - Premium Discount Stores',
  },
  {
    symbol: 'CL',
    name: 'Colgate-Palmolive',
    sector: 'Consumer Goods',
    riskLevel: 'low',
    country: 'USA',
    description: 'Hygiene-Produkte - Marktführer Zahnpasta',
  },
  {
    symbol: 'CLX',
    name: 'Clorox Company',
    sector: 'Consumer Goods',
    riskLevel: 'low',
    country: 'USA',
    description: 'Reinigungsprodukte - Starke Marken',
  },
  {
    symbol: 'KMB',
    name: 'Kimberly-Clark',
    sector: 'Consumer Goods',
    riskLevel: 'low',
    country: 'USA',
    description: 'Hygiene - Huggies, Kleenex, Scott',
  },

  // ========================================
  // SICHERE FINANZEN (LOW RISK)
  // ========================================

  {
    symbol: 'BRK.B',
    name: 'Berkshire Hathaway B',
    sector: 'Financial',
    riskLevel: 'low',
    country: 'USA',
    description: 'Warren Buffett - Diversifiziertes Konglomerat',
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    sector: 'Financial',
    riskLevel: 'low',
    country: 'USA',
    description: 'Zahlungsverkehr - Duopol mit Mastercard',
  },
  {
    symbol: 'MA',
    name: 'Mastercard Inc.',
    sector: 'Financial',
    riskLevel: 'low',
    country: 'USA',
    description: 'Zahlungsverkehr - Globales Netzwerk',
  },
  {
    symbol: 'AXP',
    name: 'American Express',
    sector: 'Financial',
    riskLevel: 'low',
    country: 'USA',
    description: 'Kreditkarten - Premium Segment',
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase',
    sector: 'Financial',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Banking - Größte US Bank',
  },
  {
    symbol: 'BAC',
    name: 'Bank of America',
    sector: 'Financial',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Banking - Zweitgrößte US Bank',
  },

  // ========================================
  // UTILITIES - DEFENSIVE STOCKS (LOW RISK)
  // ========================================

  {
    symbol: 'NEE',
    name: 'NextEra Energy',
    sector: 'Utilities',
    riskLevel: 'low',
    country: 'USA',
    description: 'Erneuerbare Energien - Wind & Solar Leader',
  },
  {
    symbol: 'DUK',
    name: 'Duke Energy',
    sector: 'Utilities',
    riskLevel: 'low',
    country: 'USA',
    description: 'Strom & Gas - Reguliertes Monopol',
  },
  {
    symbol: 'SO',
    name: 'Southern Company',
    sector: 'Utilities',
    riskLevel: 'low',
    country: 'USA',
    description: 'Energieversorger - Stabile Dividende',
  },
  {
    symbol: 'D',
    name: 'Dominion Energy',
    sector: 'Utilities',
    riskLevel: 'low',
    country: 'USA',
    description: 'Energie - Gas & Strom Versorger',
  },
  {
    symbol: 'AEP',
    name: 'American Electric Power',
    sector: 'Utilities',
    riskLevel: 'low',
    country: 'USA',
    description: 'Strom - Größtes Stromnetz USA',
  },

  // ========================================
  // TELEKOM & KOMMUNIKATION (LOW RISK)
  // ========================================

  {
    symbol: 'VZ',
    name: 'Verizon Communications',
    sector: 'Telecom',
    riskLevel: 'low',
    country: 'USA',
    description: 'Telekom - Größter US Mobilfunkanbieter',
  },
  {
    symbol: 'T',
    name: 'AT&T Inc.',
    sector: 'Telecom',
    riskLevel: 'low',
    country: 'USA',
    description: 'Telekom - Hohe Dividendenrendite 6%+',
  },
  {
    symbol: 'TMUS',
    name: 'T-Mobile US',
    sector: 'Telecom',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Mobilfunk - Drittgrößter Anbieter',
  },

  // ========================================
  // HEALTHCARE - DEFENSIVE (LOW RISK)
  // ========================================

  {
    symbol: 'UNH',
    name: 'UnitedHealth Group',
    sector: 'Healthcare',
    riskLevel: 'low',
    country: 'USA',
    description: 'Krankenversicherung - Größter US Versicherer',
  },
  {
    symbol: 'ABT',
    name: 'Abbott Laboratories',
    sector: 'Healthcare',
    riskLevel: 'low',
    country: 'USA',
    description: 'Medizintechnik - Diverse Produktpalette',
  },
  {
    symbol: 'ABBV',
    name: 'AbbVie Inc.',
    sector: 'Healthcare',
    riskLevel: 'low',
    country: 'USA',
    description: 'Pharma - Humira, Imbruvica',
  },
  {
    symbol: 'PFE',
    name: 'Pfizer Inc.',
    sector: 'Healthcare',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Pharma - COVID Impfstoff, Blockbuster Medikamente',
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly',
    sector: 'Healthcare',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Pharma - Diabetes & Krebs Medikamente',
  },
  {
    symbol: 'TMO',
    name: 'Thermo Fisher Scientific',
    sector: 'Healthcare',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Labortechnik - Life Sciences',
  },

  // ========================================
  // TECH GIANTS - FAANG (MEDIUM RISK)
  // ========================================

  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'iPhone, Mac, Services - $3T Marktkapitalisierung',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Cloud, Office, Windows - Azure Wachstum',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Search, YouTube, Cloud - Werbe-Duopol',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'E-Commerce',
    riskLevel: 'medium',
    country: 'USA',
    description: 'E-Commerce, AWS Cloud - 40% Cloud Marktanteil',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms (Facebook)',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Social Media - Facebook, Instagram, WhatsApp',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    riskLevel: 'high',
    country: 'USA',
    description: 'GPUs & AI Chips - Marktführer KI Hardware',
  },
  {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    sector: 'Entertainment',
    riskLevel: 'high',
    country: 'USA',
    description: 'Streaming - 250M+ Abonnenten',
  },
  {
    symbol: 'CRM',
    name: 'Salesforce Inc.',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'CRM Software - Cloud Leader',
  },
  {
    symbol: 'ORCL',
    name: 'Oracle Corporation',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Enterprise Software - Datenbanken',
  },
  {
    symbol: 'ADBE',
    name: 'Adobe Inc.',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Creative Cloud - Photoshop, PDF',
  },
  {
    symbol: 'CSCO',
    name: 'Cisco Systems',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Netzwerk-Hardware - Enterprise Leader',
  },
  {
    symbol: 'INTC',
    name: 'Intel Corporation',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Halbleiter - CPU Hersteller',
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    sector: 'Technology',
    riskLevel: 'high',
    country: 'USA',
    description: 'Halbleiter - Intel Konkurrent',
  },

  // ========================================
  // INDUSTRIALS - BLUE CHIPS (MEDIUM RISK)
  // ========================================

  {
    symbol: 'MMM',
    name: '3M Company',
    sector: 'Industrial',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Industrie - Post-it, Scotch, Healthcare',
  },
  {
    symbol: 'HON',
    name: 'Honeywell International',
    sector: 'Industrial',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Industrie - Automation, Aerospace',
  },
  {
    symbol: 'BA',
    name: 'Boeing Company',
    sector: 'Industrial',
    riskLevel: 'high',
    country: 'USA',
    description: 'Aerospace - Flugzeugbau',
  },
  {
    symbol: 'CAT',
    name: 'Caterpillar Inc.',
    sector: 'Industrial',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Baumaschinen - Weltmarktführer',
  },
  {
    symbol: 'DE',
    name: 'Deere & Company',
    sector: 'Industrial',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Landmaschinen - John Deere',
  },
  {
    symbol: 'GE',
    name: 'General Electric',
    sector: 'Industrial',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Konglomerat - Energie, Aviation',
  },
  {
    symbol: 'LMT',
    name: 'Lockheed Martin',
    sector: 'Industrial',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Verteidigung - F-35 Fighter',
  },
  {
    symbol: 'RTX',
    name: 'Raytheon Technologies',
    sector: 'Industrial',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Aerospace & Defense',
  },

  // ========================================
  // ENERGIE - STABIL (MEDIUM RISK)
  // ========================================

  {
    symbol: 'XOM',
    name: 'Exxon Mobil',
    sector: 'Energy',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Öl & Gas - Größter US Energiekonzern',
  },
  {
    symbol: 'CVX',
    name: 'Chevron Corporation',
    sector: 'Energy',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Öl & Gas - Integrierter Energiekonzern',
  },
  {
    symbol: 'COP',
    name: 'ConocoPhillips',
    sector: 'Energy',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Öl & Gas - E&P Fokus',
  },

  // ========================================
  // REAL ESTATE & REITs (LOW RISK)
  // ========================================

  {
    symbol: 'AMT',
    name: 'American Tower',
    sector: 'Real Estate',
    riskLevel: 'low',
    country: 'USA',
    description: 'REIT - Mobilfunkmasten',
  },
  {
    symbol: 'PLD',
    name: 'Prologis Inc.',
    sector: 'Real Estate',
    riskLevel: 'low',
    country: 'USA',
    description: 'REIT - Logistikimmobilien',
  },
  {
    symbol: 'SPG',
    name: 'Simon Property Group',
    sector: 'Real Estate',
    riskLevel: 'medium',
    country: 'USA',
    description: 'REIT - Shopping Malls',
  },

  // ========================================
  // ETFs - DIVERSIFIZIERT (LOW RISK)
  // ========================================

  // Breit diversifizierte Markt-ETFs
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'S&P 500 - Top 500 US Aktien',
  },
  {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'S&P 500 - Niedrige Kosten 0.03%',
  },
  {
    symbol: 'IVV',
    name: 'iShares Core S&P 500 ETF',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'S&P 500 - BlackRock ETF',
  },
  {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Total US Market - 3700+ Aktien',
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'USA',
    description: 'NASDAQ-100 - Tech-lastig',
  },
  {
    symbol: 'DIA',
    name: 'SPDR Dow Jones Industrial',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Dow Jones - 30 Blue Chips',
  },
  {
    symbol: 'IWM',
    name: 'iShares Russell 2000',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Small Caps - 2000 kleinere US Firmen',
  },

  // Internationale ETFs
  {
    symbol: 'VEA',
    name: 'Vanguard FTSE Developed Markets',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'International',
    description: 'Entwickelte Märkte - Europa, Asien',
  },
  {
    symbol: 'VWO',
    name: 'Vanguard FTSE Emerging Markets',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'International',
    description: 'Schwellenländer - China, Indien, Brasilien',
  },
  {
    symbol: 'ACWI',
    name: 'iShares MSCI ACWI',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'International',
    description: 'Welt-Index - 2900+ Aktien global',
  },

  // Sektor ETFs
  {
    symbol: 'XLF',
    name: 'Financial Select Sector SPDR',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Finanz-Sektor - Banken, Versicherungen',
  },
  {
    symbol: 'XLE',
    name: 'Energy Select Sector SPDR',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Energie-Sektor - Öl & Gas',
  },
  {
    symbol: 'XLV',
    name: 'Health Care Select Sector',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Healthcare - Pharma, Biotech',
  },
  {
    symbol: 'XLK',
    name: 'Technology Select Sector',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Tech-Sektor - Software, Hardware',
  },
  {
    symbol: 'XLI',
    name: 'Industrial Select Sector',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Industrie - Manufacturing, Transport',
  },
  {
    symbol: 'XLP',
    name: 'Consumer Staples Select Sector',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Basiskonsumgüter - Food, Beverage',
  },

  // Bond ETFs (Sicherste)
  {
    symbol: 'AGG',
    name: 'iShares Core US Aggregate Bond',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Anleihen - Investment Grade Bonds',
  },
  {
    symbol: 'BND',
    name: 'Vanguard Total Bond Market',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Anleihen - Gesamter US Bond Market',
  },
  {
    symbol: 'TLT',
    name: 'iShares 20+ Year Treasury Bond',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Staatsanleihen - Langfristige US Treasuries',
  },

  // Commodity ETFs
  {
    symbol: 'GLD',
    name: 'SPDR Gold Trust',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'Global',
    description: 'Gold - Physisch hinterlegt',
  },
  {
    symbol: 'SLV',
    name: 'iShares Silver Trust',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'Global',
    description: 'Silber - Rohstoff ETF',
  },
  {
    symbol: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    sector: 'ETF',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Immobilien - REITs Portfolio',
  },

  // Dividenden ETFs
  {
    symbol: 'VYM',
    name: 'Vanguard High Dividend Yield',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Hohe Dividenden - 400+ Aktien',
  },
  {
    symbol: 'SCHD',
    name: 'Schwab US Dividend Equity',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Dividenden-Aristokraten - Quality Stocks',
  },
  {
    symbol: 'VIG',
    name: 'Vanguard Dividend Appreciation',
    sector: 'ETF',
    riskLevel: 'low',
    country: 'USA',
    description: 'Dividendenwachstum - 10+ Jahre',
  },

  // ========================================
  // WACHSTUM - HÖHERES RISIKO
  // ========================================

  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Automotive',
    riskLevel: 'high',
    country: 'USA',
    description: 'E-Autos - Marktführer EVs',
  },
  {
    symbol: 'SHOP',
    name: 'Shopify Inc.',
    sector: 'E-Commerce',
    riskLevel: 'high',
    country: 'Canada',
    description: 'E-Commerce Platform',
  },
  {
    symbol: 'SQ',
    name: 'Block Inc. (Square)',
    sector: 'Technology',
    riskLevel: 'high',
    country: 'USA',
    description: 'Fintech - Payment Solutions',
  },
  {
    symbol: 'PYPL',
    name: 'PayPal Holdings',
    sector: 'Technology',
    riskLevel: 'medium',
    country: 'USA',
    description: 'Online Payments - 400M+ Nutzer',
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Global',
    sector: 'Technology',
    riskLevel: 'high',
    country: 'USA',
    description: 'Crypto Exchange - Größte US Börse',
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies',
    sector: 'Technology',
    riskLevel: 'high',
    country: 'USA',
    description: 'Big Data & AI - Government Contracts',
  },
  {
    symbol: 'SNOW',
    name: 'Snowflake Inc.',
    sector: 'Technology',
    riskLevel: 'high',
    country: 'USA',
    description: 'Cloud Data Platform',
  },
];

// Helper functions
export function getStockBySymbol(symbol: string): StockConfig | undefined {
  return SUPPORTED_STOCKS.find((s) => s.symbol === symbol);
}

export function getStocksBySector(sector: string): StockConfig[] {
  return SUPPORTED_STOCKS.filter((s) => s.sector === sector);
}

export function getStocksByRiskLevel(riskLevel: 'low' | 'medium' | 'high'): StockConfig[] {
  return SUPPORTED_STOCKS.filter((s) => s.riskLevel === riskLevel);
}

export function getStocksByCountry(country: string): StockConfig[] {
  return SUPPORTED_STOCKS.filter((s) => s.country === country);
}

export function getAllSectors(): string[] {
  return [...new Set(SUPPORTED_STOCKS.map((s) => s.sector))];
}

export function getAllCountries(): string[] {
  return [...new Set(SUPPORTED_STOCKS.map((s) => s.country).filter(Boolean))] as string[];
}

// Statistiken
export function getStockStats() {
  return {
    total: SUPPORTED_STOCKS.length,
    byRisk: {
      low: SUPPORTED_STOCKS.filter(s => s.riskLevel === 'low').length,
      medium: SUPPORTED_STOCKS.filter(s => s.riskLevel === 'medium').length,
      high: SUPPORTED_STOCKS.filter(s => s.riskLevel === 'high').length,
    },
    bySector: getAllSectors().map(sector => ({
      sector,
      count: getStocksBySector(sector).length,
    })),
  };
}
