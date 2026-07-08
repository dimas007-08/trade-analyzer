export interface Trade {
  id: number;
  ticker: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees: number | null;
  pnl: number;
  pnlPercent: number;
  notes: string | null;
  tags: string | null;
  entryDate: string;
  exitDate: string;
  createdAt: string;
}

export interface WatchlistItem {
  id: number;
  ticker: string;
  targetPrice: number | null;
  stopLoss: number | null;
  notes: string | null;
  priority: number | null;
  createdAt: string;
}

export interface TickerStats {
  count: number;
  pnl: number;
  wins: number;
}

export interface Stats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  profitFactor: number;
  avgRR: number;
  maxDrawdown: number;
  avgHoldTime: number;
  byTicker: Record<string, TickerStats>;
  byDirection: {
    long: { count: number; pnl: number };
    short: { count: number; pnl: number };
  };
  monthlyPnl: Record<string, number>;
  cumulativePnl: { date: string; pnl: number; ticker: string }[];
  recentTrades: Trade[];
}

// Market data types
export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_7d_in_currency: number | null;
  sparkline_in_7d: { price: number[] } | null;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
}

export interface CoinDetail {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  ath: number;
  athDate: string;
  athChangePercent: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  rank: number;
  image: string;
  sparkline: number[];
}

export interface ChartData {
  prices: { time: number; price: number }[];
  volumes: { time: number; volume: number }[];
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  thumb: string;
  price?: number;
  change24h?: number;
}

export interface GlobalData {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptos: number;
  markets: number;
  marketCapChange24h: number;
}
