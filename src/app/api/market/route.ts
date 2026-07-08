import { NextRequest, NextResponse } from "next/server";

// CoinGecko free API (no key required)
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// Map of popular crypto symbols to CoinGecko IDs
const CRYPTO_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  SUI: "sui",
  TIA: "celestia",
  TON: "the-open-network",
  PEPE: "pepe",
  SHIB: "shiba-inu",
  FIL: "filecoin",
  INJ: "injective-protocol",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "top";
  const symbol = searchParams.get("symbol")?.toUpperCase();

  try {
    switch (action) {
      case "top": {
        // Get top cryptocurrencies by market cap
        const limit = searchParams.get("limit") || "20";
        const res = await fetch(
          `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`,
          {
            headers: { Accept: "application/json" },
            next: { revalidate: 60 },
          }
        );
        if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data);
      }

      case "price": {
        // Get price for specific symbols
        const symbols = searchParams.get("symbols")?.toUpperCase().split(",") || [];
        const ids = symbols
          .map((s) => CRYPTO_MAP[s])
          .filter(Boolean)
          .join(",");
        if (!ids) {
          return NextResponse.json({ error: "No valid symbols found" }, { status: 400 });
        }
        const res = await fetch(
          `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
          {
            headers: { Accept: "application/json" },
            next: { revalidate: 30 },
          }
        );
        if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
        const data = await res.json();

        // Remap back to symbols
        const result: Record<string, {
          price: number;
          change24h: number;
          volume24h: number;
          marketCap: number;
        }> = {};
        for (const s of symbols) {
          const id = CRYPTO_MAP[s];
          if (id && data[id]) {
            result[s] = {
              price: data[id].usd,
              change24h: data[id].usd_24h_change,
              volume24h: data[id].usd_24h_vol,
              marketCap: data[id].usd_market_cap,
            };
          }
        }
        return NextResponse.json(result);
      }

      case "detail": {
        // Get detailed info for a specific coin
        if (!symbol) {
          return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
        }
        const id = CRYPTO_MAP[symbol];
        if (!id) {
          return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 });
        }
        const res = await fetch(
          `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`,
          {
            headers: { Accept: "application/json" },
            next: { revalidate: 60 },
          }
        );
        if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json({
          symbol,
          name: data.name,
          price: data.market_data?.current_price?.usd,
          change24h: data.market_data?.price_change_percentage_24h,
          change7d: data.market_data?.price_change_percentage_7d,
          change30d: data.market_data?.price_change_percentage_30d,
          marketCap: data.market_data?.market_cap?.usd,
          volume24h: data.market_data?.total_volume?.usd,
          high24h: data.market_data?.high_24h?.usd,
          low24h: data.market_data?.low_24h?.usd,
          ath: data.market_data?.ath?.usd,
          athDate: data.market_data?.ath_date?.usd,
          athChangePercent: data.market_data?.ath_change_percentage?.usd,
          circulatingSupply: data.market_data?.circulating_supply,
          totalSupply: data.market_data?.total_supply,
          maxSupply: data.market_data?.max_supply,
          rank: data.market_cap_rank,
          image: data.image?.small,
          sparkline: data.market_data?.sparkline_7d?.price,
        });
      }

      case "chart": {
        // Get price chart data
        if (!symbol) {
          return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
        }
        const id = CRYPTO_MAP[symbol];
        if (!id) {
          return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 });
        }
        const days = searchParams.get("days") || "7";
        const res = await fetch(
          `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
          {
            headers: { Accept: "application/json" },
            next: { revalidate: 300 },
          }
        );
        if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json({
          prices: data.prices?.map((p: [number, number]) => ({
            time: p[0],
            price: p[1],
          })),
          volumes: data.total_volumes?.map((v: [number, number]) => ({
            time: v[0],
            volume: v[1],
          })),
        });
      }

      case "trending": {
        // Get trending coins
        const res = await fetch(`${COINGECKO_BASE}/search/trending`, {
          headers: { Accept: "application/json" },
          next: { revalidate: 300 },
        });
        if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json(
          data.coins?.map(
            (c: { item: { id: string; name: string; symbol: string; market_cap_rank: number; thumb: string; data?: { price?: number; price_change_percentage_24h?: Record<string, number> } } }) => ({
              id: c.item.id,
              name: c.item.name,
              symbol: c.item.symbol,
              rank: c.item.market_cap_rank,
              thumb: c.item.thumb,
              price: c.item.data?.price,
              change24h: c.item.data?.price_change_percentage_24h?.usd,
            })
          ) ?? []
        );
      }

      case "global": {
        // Get global market data
        const res = await fetch(`${COINGECKO_BASE}/global`, {
          headers: { Accept: "application/json" },
          next: { revalidate: 120 },
        });
        if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json({
          totalMarketCap: data.data?.total_market_cap?.usd,
          totalVolume: data.data?.total_volume?.usd,
          btcDominance: data.data?.market_cap_percentage?.btc,
          ethDominance: data.data?.market_cap_percentage?.eth,
          activeCryptos: data.data?.active_cryptocurrencies,
          markets: data.data?.markets,
          marketCapChange24h: data.data?.market_cap_change_percentage_24h_usd,
        });
      }

      case "search": {
        // Search for coins
        const query = searchParams.get("q") || "";
        if (!query) {
          return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }
        const res = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`, {
          headers: { Accept: "application/json" },
          next: { revalidate: 300 },
        });
        if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json(
          data.coins?.slice(0, 10).map(
            (c: { id: string; name: string; symbol: string; market_cap_rank: number | null; thumb: string }) => ({
              id: c.id,
              name: c.name,
              symbol: c.symbol,
              rank: c.market_cap_rank,
              thumb: c.thumb,
            })
          ) ?? []
        );
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data. API rate limit may be exceeded." },
      { status: 500 }
    );
  }
}
