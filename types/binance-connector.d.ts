declare module '@binance/connector' {
  export class Spot {
    constructor(apiKey: string, apiSecret: string);
    ticker24hr(): Promise<{ data: any[] }>;
    exchangeInfo(): Promise<{ data: { symbols: any[] } }>;
  }
} 